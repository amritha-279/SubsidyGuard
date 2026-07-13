"""
feature_engineering.py
Builds the ML feature vector from raw transaction inputs.
Keeps all feature construction in one place so train and predict use identical logic.
"""

import numpy as np


FEATURE_NAMES = [
    "land_size",
    "crop_type",
    "fertilizer_type",
    "season",
    "month",
    "recommended_quantity",
    "requested_quantity",
    "quantity_ratio",
    "days_since_last_purchase",
    "purchase_count_30d",
    "previous_fraud_count",
    "retailer_risk_score",
    "village_risk_score",
    "otp_verified",
    "officer_approved",
    "transaction_hour",
    "is_repeat_purchase",
]

CATEGORICAL_COLS = ["crop_type", "fertilizer_type", "season"]


def build_feature_vector(
    land_size: float,
    crop_type_enc: int,
    fertilizer_type_enc: int,
    season_enc: int,
    month: int,
    recommended_quantity: float,
    requested_quantity: float,
    quantity_ratio: float,
    days_since_last_purchase: int,
    purchase_count_30d: int,
    previous_fraud_count: int,
    retailer_risk_score: float,
    village_risk_score: float,
    otp_verified: int,
    officer_approved: int,
    transaction_hour: int,
    is_repeat_purchase: int,
) -> np.ndarray:
    return np.array([[
        land_size,
        crop_type_enc,
        fertilizer_type_enc,
        season_enc,
        month,
        recommended_quantity,
        requested_quantity,
        quantity_ratio,
        days_since_last_purchase,
        purchase_count_30d,
        previous_fraud_count,
        retailer_risk_score,
        village_risk_score,
        otp_verified,
        officer_approved,
        transaction_hour,
        is_repeat_purchase,
    ]])
