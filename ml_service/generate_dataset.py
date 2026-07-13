"""
generate_dataset.py
Generates a realistic synthetic fertilizer subsidy transaction dataset.
Fraud labels emerge from combinations of risk factors — not single rules.
Run: python generate_dataset.py
"""

import pandas as pd
import numpy as np
import random
import os
import json

random.seed(42)
np.random.seed(42)

# Load config so dataset uses the same crop/fertilizer values as the live system
_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "fertilizer_config.json")
with open(_CONFIG_PATH) as f:
    CONFIG = json.load(f)

CROPS = list(CONFIG["crops"].keys())
FERTILIZERS = ["Urea", "DAP", "MOP", "SSP"]
SEASONS = ["Kharif", "Rabi", "Summer"]
SEASON_MONTHS = CONFIG["season_months"]

VILLAGES = [f"Village_{chr(65 + i)}" for i in range(25)]
# Mark some villages as high-risk clusters
HIGH_RISK_VILLAGES = {"Village_C", "Village_G", "Village_M", "Village_R", "Village_W"}

RETAILERS = [f"RET{str(i).zfill(3)}" for i in range(1, 41)]
# Retailer risk scores: 0.0 (clean) – 1.0 (very risky)
RETAILER_RISK = {r: round(random.uniform(0.0, 1.0), 2) for r in RETAILERS}
# Boost a few retailers to be clearly high-risk
for r in ["RET003", "RET007", "RET015", "RET022", "RET028", "RET035"]:
    RETAILER_RISK[r] = round(random.uniform(0.7, 1.0), 2)

VILLAGE_RISK = {v: round(random.uniform(0.0, 1.0), 2) for v in VILLAGES}
for v in HIGH_RISK_VILLAGES:
    VILLAGE_RISK[v] = round(random.uniform(0.65, 1.0), 2)


def get_recommendation(crop: str, fertilizer: str, season: str) -> float:
    crops = CONFIG["crops"]
    if crop not in crops or fertilizer not in crops[crop]:
        return 50.0
    season_map = crops[crop][fertilizer]
    return season_map.get(season, list(season_map.values())[0])


def get_season(month: int) -> str:
    for s, months in SEASON_MONTHS.items():
        if month in months:
            return s
    return "Rabi"


rows = []
N = 20000

for i in range(N):
    land_size = round(random.uniform(0.5, 12.0), 1)
    crop = random.choice(CROPS)
    fertilizer = random.choice(FERTILIZERS)
    month = random.randint(1, 12)
    season = get_season(month)
    transaction_hour = random.randint(6, 20)

    kg_per_acre = get_recommendation(crop, fertilizer, season)
    recommended_qty = round(kg_per_acre * land_size, 2)

    retailer_id = random.choice(RETAILERS)
    village = random.choice(VILLAGES)
    retailer_risk = RETAILER_RISK[retailer_id]
    village_risk = VILLAGE_RISK[village]

    purchase_count_30d = random.randint(0, 6)
    days_since_last = random.randint(1, 365)
    previous_fraud_count = random.choices([0, 1, 2, 3], weights=[70, 18, 8, 4])[0]
    otp_verified = random.choices([0, 1], weights=[30, 70])[0]
    officer_approved = random.choices([0, 1], weights=[40, 60])[0]
    is_repeat_purchase = 1 if purchase_count_30d >= 2 else 0

    # ---- Fraud score: additive risk factors ----
    fraud_score = 0.0

    # Quantity ratio — the primary signal
    # Fraudsters tend to request 1.3x–3x the recommendation
    if retailer_risk > 0.6 or village_risk > 0.6:
        qty_ratio = random.choices(
            [random.uniform(0.5, 1.05), random.uniform(1.05, 1.20), random.uniform(1.20, 3.0)],
            weights=[40, 25, 35]
        )[0]
    else:
        qty_ratio = random.choices(
            [random.uniform(0.5, 1.05), random.uniform(1.05, 1.20), random.uniform(1.20, 3.0)],
            weights=[70, 20, 10]
        )[0]

    if qty_ratio > 1.20:
        fraud_score += 3.0
    elif qty_ratio > 1.05:
        fraud_score += 1.0

    # Frequent purchases
    if purchase_count_30d >= 4:
        fraud_score += 2.5
    elif purchase_count_30d >= 2:
        fraud_score += 1.0

    # Short gap between purchases
    if days_since_last < 7:
        fraud_score += 2.0
    elif days_since_last < 15:
        fraud_score += 1.0

    # Prior fraud history
    fraud_score += previous_fraud_count * 1.5

    # High-risk retailer
    if retailer_risk > 0.7:
        fraud_score += 2.0
    elif retailer_risk > 0.5:
        fraud_score += 1.0

    # High-risk village cluster
    if village_risk > 0.7:
        fraud_score += 1.5
    elif village_risk > 0.5:
        fraud_score += 0.5

    # No OTP for excess purchase
    if qty_ratio > 1.05 and otp_verified == 0:
        fraud_score += 1.0

    # No officer approval for large excess
    if qty_ratio > 1.20 and officer_approved == 0:
        fraud_score += 1.0

    # Late-night transactions are slightly suspicious
    if transaction_hour < 7 or transaction_hour > 19:
        fraud_score += 0.5

    # Repeat purchase with excess
    if is_repeat_purchase and qty_ratio > 1.05:
        fraud_score += 1.0

    # Seasonal anomaly: buying off-season crop
    off_season = (season == "Summer" and crop in ["paddy", "wheat"])
    if off_season:
        fraud_score += 0.5

    # Fraud label: threshold 5.0 with small noise
    noise = random.gauss(0, 0.3)
    is_fraud = 1 if (fraud_score + noise) >= 5.0 else 0

    # 2% random label flip to simulate real-world noise
    if random.random() < 0.02:
        is_fraud = 1 - is_fraud

    requested_qty = round(recommended_qty * qty_ratio, 2)

    rows.append({
        "land_size": land_size,
        "crop_type": crop,
        "fertilizer_type": fertilizer,
        "season": season,
        "month": month,
        "recommended_quantity": recommended_qty,
        "requested_quantity": requested_qty,
        "quantity_ratio": round(qty_ratio, 4),
        "days_since_last_purchase": days_since_last,
        "purchase_count_30d": purchase_count_30d,
        "previous_fraud_count": previous_fraud_count,
        "retailer_risk_score": retailer_risk,
        "village_risk_score": village_risk,
        "otp_verified": otp_verified,
        "officer_approved": officer_approved,
        "transaction_hour": transaction_hour,
        "is_repeat_purchase": is_repeat_purchase,
        "is_fraud": is_fraud,
    })

df = pd.DataFrame(rows)
output_path = os.path.join(os.path.dirname(__file__), "data", "transactions.csv")
os.makedirs(os.path.dirname(output_path), exist_ok=True)
df.to_csv(output_path, index=False)

fraud_rate = df["is_fraud"].mean() * 100
print(f"Dataset generated : {len(df):,} rows")
print(f"Fraud rate        : {fraud_rate:.1f}%")
print(f"Saved to          : {output_path}")
print("\nFeature summary:")
print(df[["quantity_ratio", "retailer_risk_score", "village_risk_score",
          "purchase_count_30d", "previous_fraud_count"]].describe().round(3))
