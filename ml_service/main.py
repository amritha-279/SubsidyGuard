"""
main.py - SubsidyGuard ML Service
FastAPI service exposing the Random Forest fraud detection model.
Run: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator, model_validator
import joblib
import os
from datetime import datetime

from recommendation_engine import (
    get_recommendation,
    get_quantity_ratio,
    classify_by_ratio,
    get_season_for_month,
    reload_config,
    CROPS,
    FERTILIZERS,
    THRESHOLDS,
)
from rule_engine import run_rules
from feature_engineering import FEATURE_NAMES, CATEGORICAL_COLS, build_feature_vector

app = FastAPI(title="SubsidyGuard ML Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH   = os.path.join(os.path.dirname(__file__), "model.pkl")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "encoders.pkl")

model    = None
encoders = None


@app.on_event("startup")
def load_model():
    global model, encoders
    if not os.path.exists(MODEL_PATH):
        print("WARNING: model.pkl not found. Run train_model.py first.")
        return
    model    = joblib.load(MODEL_PATH)
    encoders = joblib.load(ENCODER_PATH)
    print("Model loaded successfully.")

@app.post("/reload_config")
def api_reload_config():
    try:
        reload_config()
        return {"status": "success", "message": "Configuration reloaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Input schema ──────────────────────────────────────────────────────────────

class TransactionInput(BaseModel):
    land_size:              float
    crop_type:              str
    fertilizer_type:        str
    requested_quantity:     float
    season:                 str  = ""   # auto-derived from month if blank
    month:                  int  = 0    # 0 = use current month
    days_since_last_purchase: int  = 365
    purchase_count_30d:     int  = 0
    previous_fraud_count:   int  = 0
    retailer_risk_score:    float = 0.0
    village_risk_score:     float = 0.0
    otp_verified:           int  = 0
    officer_approved:       int  = 0
    transaction_hour:       int  = -1  # -1 = use current hour

    @field_validator("land_size")
    @classmethod
    def land_size_positive(cls, v):
        if v <= 0:
            raise ValueError("land_size must be greater than zero")
        return v

    @field_validator("requested_quantity")
    @classmethod
    def qty_positive(cls, v):
        if v <= 0:
            raise ValueError("requested_quantity must be greater than zero")
        return v

    @field_validator("retailer_risk_score", "village_risk_score")
    @classmethod
    def risk_range(cls, v):
        if not (0.0 <= v <= 1.0):
            raise ValueError("Risk scores must be between 0.0 and 1.0")
        return v

    @model_validator(mode="after")
    def resolve_season_and_hour(self):
        now = datetime.now()
        if self.month == 0:
            self.month = now.month
        if not self.season:
            self.season = get_season_for_month(self.month)
        if self.transaction_hour == -1:
            self.transaction_hour = now.hour
        return self


# ── Helpers ───────────────────────────────────────────────────────────────────

def safe_encode(encoder, value: str, default: int = 0) -> int:
    try:
        return int(encoder.transform([str(value)])[0])
    except ValueError:
        return default


def get_ml_risk_level(probability: float) -> str:
    if probability < 0.35:
        return "GREEN"
    elif probability < 0.65:
        return "YELLOW"
    return "RED"


def build_reasons(
    data: TransactionInput,
    recommended_quantity: float,
    quantity_ratio: float,
    fraud_probability: float,
) -> list[str]:
    reasons = []
    excess_pct = round((quantity_ratio - 1) * 100, 1)
    green_max_pct  = THRESHOLDS["green_max_pct"]
    yellow_max_pct = THRESHOLDS["yellow_max_pct"]

    # Quantity excess
    if quantity_ratio > yellow_max_pct / 100:
        reasons.append("Significantly exceeded recommended quantity.")
    elif quantity_ratio > green_max_pct / 100:
        reasons.append("Slightly exceeded recommended quantity.")
    else:
        reasons.append("Requested quantity is within recommendation limits.")

    # Frequent purchases
    if data.purchase_count_30d >= 4:
        reasons.append(f"Highly frequent purchases detected ({data.purchase_count_30d} in last 30 days).")
    elif data.purchase_count_30d >= 2:
        reasons.append("Recent repeat purchases detected.")
    else:
        reasons.append("No recent purchases.")

    # Short gap
    if data.days_since_last_purchase < 7:
        reasons.append("Very short gap since last purchase.")

    # Prior fraud
    if data.previous_fraud_count >= 2:
        reasons.append("Farmer has multiple prior fraud flags.")
    elif data.previous_fraud_count == 1:
        reasons.append("Farmer has a prior fraud flag.")

    # Retailer risk
    if data.retailer_risk_score >= 0.7:
        reasons.append("High retailer risk.")
    elif data.retailer_risk_score >= 0.5:
        reasons.append("Moderate retailer risk.")
    else:
        reasons.append("Low retailer risk.")

    # Village risk
    if data.village_risk_score >= 0.7:
        reasons.append("Village has suspicious activity.")
    elif data.village_risk_score >= 0.5:
        reasons.append("Village has moderate risk activity.")
    else:
        reasons.append("Village has no suspicious activity.")

    # OTP missing for excess
    if quantity_ratio > green_max_pct / 100 and data.otp_verified == 0:
        reasons.append("OTP verification missing for excess purchase.")

    # Officer approval missing for RED
    if quantity_ratio > yellow_max_pct / 100 and data.officer_approved == 0:
        reasons.append("Officer approval missing for critical excess.")

    # Late-night transaction
    if data.transaction_hour < 7 or data.transaction_hour > 19:
        reasons.append("Transaction recorded at an unusual hour.")

    if not reasons:
        reasons.append("Transaction is within normal parameters.")

    return reasons


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": model is not None}


@app.post("/predict")
def predict(data: TransactionInput):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Run train_model.py first.")

    # 1. Recommendation
    recommended_quantity = get_recommendation(
        data.crop_type, data.fertilizer_type, data.season, data.land_size
    )
    quantity_ratio = get_quantity_ratio(data.requested_quantity, recommended_quantity)

    # 2. Rule engine
    rule_status, checks = run_rules(
        land_size=data.land_size,
        crop_type=data.crop_type,
        fertilizer_type=data.fertilizer_type,
        requested_quantity=data.requested_quantity,
        recommended_quantity=recommended_quantity,
        quantity_ratio=quantity_ratio,
        purchase_count_30d=data.purchase_count_30d,
        days_since_last_purchase=data.days_since_last_purchase,
        previous_fraud_count=data.previous_fraud_count,
        otp_verified=data.otp_verified,
        officer_approved=data.officer_approved,
        season=data.season,
    )

    # 3. ML prediction
    crop_enc   = safe_encode(encoders["crop_type"],      data.crop_type)
    fert_enc   = safe_encode(encoders["fertilizer_type"], data.fertilizer_type)
    season_enc = safe_encode(encoders["season"],          data.season)

    is_repeat = 1 if data.purchase_count_30d >= 2 else 0

    features = build_feature_vector(
        land_size=data.land_size,
        crop_type_enc=crop_enc,
        fertilizer_type_enc=fert_enc,
        season_enc=season_enc,
        month=data.month,
        recommended_quantity=recommended_quantity,
        requested_quantity=data.requested_quantity,
        quantity_ratio=quantity_ratio,
        days_since_last_purchase=data.days_since_last_purchase,
        purchase_count_30d=data.purchase_count_30d,
        previous_fraud_count=data.previous_fraud_count,
        retailer_risk_score=data.retailer_risk_score,
        village_risk_score=data.village_risk_score,
        otp_verified=data.otp_verified,
        officer_approved=data.officer_approved,
        transaction_hour=data.transaction_hour,
        is_repeat_purchase=is_repeat,
    )

    fraud_probability = float(model.predict_proba(features)[0][1])
    ml_risk_level     = get_ml_risk_level(fraud_probability)
    confidence        = round(max(fraud_probability, 1 - fraud_probability) * 100, 1)

    # 4. Final status: take the more severe of rule and ML
    severity_order = {"GREEN": 0, "YELLOW": 1, "RED": 2}
    final_status = (
        rule_status
        if severity_order[rule_status] >= severity_order[ml_risk_level]
        else ml_risk_level
    )

    # 5. Reasons
    reasons = build_reasons(data, recommended_quantity, quantity_ratio, fraud_probability)

    return {
        "fraud_probability":    round(fraud_probability * 100, 1),
        "risk_level":           final_status,
        "ml_risk_level":        ml_risk_level,
        "rule_risk_level":      rule_status,
        "confidence_score":     confidence,
        "recommended_quantity": recommended_quantity,
        "quantity_ratio":       round(quantity_ratio * 100, 1),
        "reasons":              reasons,
        "checks":               checks,
    }


@app.post("/recommend")
def recommend(crop_type: str, fertilizer_type: str, season: str, land_size: float):
    """Return recommended quantity without running fraud prediction."""
    if land_size <= 0:
        raise HTTPException(status_code=400, detail="land_size must be > 0")
    qty = get_recommendation(crop_type, fertilizer_type, season, land_size)
    return {
        "crop_type":       crop_type,
        "fertilizer_type": fertilizer_type,
        "season":          season,
        "land_size":       land_size,
        "recommended_kg":  qty,
    }
