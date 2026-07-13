"""
train_model.py
Trains a Random Forest fraud detection model on the generated dataset.
Run: python train_model.py
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
import joblib
import os

from feature_engineering import FEATURE_NAMES, CATEGORICAL_COLS

DATA_PATH    = os.path.join(os.path.dirname(__file__), "data", "transactions.csv")
MODEL_PATH   = os.path.join(os.path.dirname(__file__), "model.pkl")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "encoders.pkl")


def train():
    print("Loading dataset...")
    df = pd.read_csv(DATA_PATH)
    print(f"  Rows: {len(df):,}  |  Fraud rate: {df['is_fraud'].mean()*100:.1f}%")

    # Encode categorical columns
    encoders = {}
    for col in CATEGORICAL_COLS:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le

    X = df[FEATURE_NAMES]
    y = df["is_fraud"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("\nTraining Random Forest model...")
    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=15,
        min_samples_split=4,
        min_samples_leaf=2,
        max_features="sqrt",
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    # Evaluation
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Legit", "Fraud"]))

    roc = roc_auc_score(y_test, y_prob)
    print(f"ROC-AUC Score : {roc:.4f}")

    cm = confusion_matrix(y_test, y_pred)
    print(f"Confusion Matrix:\n{cm}")

    # Cross-validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X, y, cv=cv, scoring="roc_auc", n_jobs=-1)
    print(f"\n5-Fold CV ROC-AUC: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # Feature importances
    importances = pd.Series(model.feature_importances_, index=FEATURE_NAMES).sort_values(ascending=False)
    print("\nTop Feature Importances:")
    print(importances.to_string())

    # Save
    joblib.dump(model, MODEL_PATH)
    joblib.dump(encoders, ENCODER_PATH)
    print(f"\nModel saved   : {MODEL_PATH}")
    print(f"Encoders saved: {ENCODER_PATH}")


if __name__ == "__main__":
    train()
