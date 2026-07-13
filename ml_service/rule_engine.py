"""
rule_engine.py
Applies deterministic business rules to a transaction.
Returns a list of check dicts and a rule-based status (GREEN/YELLOW/RED).
Thresholds are read from fertilizer_config.json — not hardcoded here.
"""

from recommendation_engine import THRESHOLDS


def run_rules(
    land_size: float,
    crop_type: str,
    fertilizer_type: str,
    requested_quantity: float,
    recommended_quantity: float,
    quantity_ratio: float,
    purchase_count_30d: int,
    days_since_last_purchase: int,
    previous_fraud_count: int,
    otp_verified: int,
    officer_approved: int,
    season: str,
) -> tuple[str, list[dict]]:
    """
    Returns (status, checks_list).
    status  : 'GREEN' | 'YELLOW' | 'RED'
    checks  : list of check dicts for the frontend verification panel
    """
    checks = []
    status = "GREEN"

    green_max = THRESHOLDS["green_max_pct"] / 100.0   # 1.05
    yellow_max = THRESHOLDS["yellow_max_pct"] / 100.0  # 1.20

    # --- Land size validation ---
    if land_size <= 0:
        checks.append({
            "id": "land_size_invalid", "name": "Invalid Land Size",
            "passed": False, "color": "red",
            "details": "Land size must be greater than zero."
        })
        return "RED", checks

    checks.append({
        "id": "land_size", "name": "Land Size Verified",
        "passed": True, "color": "green",
        "details": f"Farmer registered with {land_size} acres."
    })

    # --- Quantity validation ---
    if requested_quantity <= 0:
        checks.append({
            "id": "qty_invalid", "name": "Invalid Quantity",
            "passed": False, "color": "red",
            "details": "Requested quantity must be greater than zero."
        })
        return "RED", checks

    # --- Recommendation check ---
    excess_pct = round((quantity_ratio - 1) * 100, 1)
    checks.append({
        "id": "recommendation", "name": "Crop Requirement Calculated",
        "passed": True, "color": "green",
        "details": (
            f"Recommended for {land_size} acres of {crop_type} ({fertilizer_type}, {season}): "
            f"{recommended_quantity} kg. Requested: {requested_quantity} kg "
            f"({quantity_ratio * 100:.1f}% of recommendation)."
        )
    })

    # --- Quantity ratio classification ---
    if quantity_ratio <= green_max:
        pass  # GREEN — no flag
    elif quantity_ratio <= yellow_max:
        status = "YELLOW"
        checks.append({
            "id": "excess_moderate", "name": "Moderate Excess Detected",
            "passed": False, "color": "yellow",
            "details": (
                f"Requested quantity exceeds the recommended quantity by {excess_pct}%, "
                f"which is within the warning threshold. OTP verification required."
            )
        })
    else:
        status = "RED"
        checks.append({
            "id": "excess_high", "name": "Critical Over-limit Detected",
            "passed": False, "color": "red",
            "details": (
                f"Requested quantity exceeds the recommended quantity by {excess_pct}%, "
                f"which is in the critical threshold. Officer approval required."
            )
        })

    # --- Frequent purchase ---
    frequent_count = THRESHOLDS.get("frequent_count", 2)
    if purchase_count_30d > frequent_count:
        if status == "GREEN":
            status = "YELLOW"
        checks.append({
            "id": "frequent_purchase", "name": "Frequent Purchase Warning",
            "passed": False, "color": "yellow",
            "details": (
                f"Farmer has made {purchase_count_30d} purchases in the last 30 days "
                f"(limit: {frequent_count}, last purchase: {days_since_last_purchase} days ago)."
            )
        })
    elif purchase_count_30d == frequent_count:
        checks.append({
            "id": "repeat_purchase", "name": "Repeat Purchase Noted",
            "passed": False, "color": "yellow",
            "details": f"Farmer has made {purchase_count_30d} purchases in the last 30 days."
        })

    # --- Previous fraud history ---
    if previous_fraud_count >= 2:
        status = "RED"
        checks.append({
            "id": "fraud_history", "name": "Prior Fraud History",
            "passed": False, "color": "red",
            "details": f"Farmer has {previous_fraud_count} previously flagged transactions."
        })
    elif previous_fraud_count == 1:
        if status == "GREEN":
            status = "YELLOW"
        checks.append({
            "id": "fraud_history_warn", "name": "Prior Fraud Warning",
            "passed": False, "color": "yellow",
            "details": "Farmer has 1 previously flagged transaction."
        })

    # --- OTP check for excess ---
    if quantity_ratio > green_max and otp_verified == 0:
        checks.append({
            "id": "otp_missing", "name": "OTP Not Verified",
            "passed": False, "color": "yellow",
            "details": "OTP verification is required for purchases exceeding the recommendation."
        })

    # --- Officer approval for RED ---
    if status == "RED" and officer_approved == 0:
        checks.append({
            "id": "officer_approval", "name": "Officer Approval Required",
            "passed": False, "color": "red",
            "details": "Transactions flagged RED require officer approval before processing."
        })

    return status, checks
