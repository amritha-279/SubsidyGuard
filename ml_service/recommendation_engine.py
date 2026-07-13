"""
recommendation_engine.py
Calculates recommended fertilizer quantity (kg) from config file.
No hardcoded values — edit fertilizer_config.json to update recommendations.
"""

import json
import os

_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "fertilizer_config.json")

with open(_CONFIG_PATH, "r") as f:
    _CONFIG = json.load(f)

CROPS = list(_CONFIG["crops"].keys())
FERTILIZERS = ["Urea", "DAP", "MOP", "SSP"]
SEASONS = ["Kharif", "Rabi", "Summer"]
THRESHOLDS = _CONFIG["thresholds"]
SEASON_MONTHS = _CONFIG["season_months"]

def reload_config():
    global _CONFIG, CROPS, SEASON_MONTHS
    with open(_CONFIG_PATH, "r") as f:
        _CONFIG = json.load(f)
    CROPS = list(_CONFIG["crops"].keys())
    SEASON_MONTHS = _CONFIG["season_months"]
    # Update dictionary in-place so other modules importing THRESHOLDS get the new values
    THRESHOLDS.clear()
    THRESHOLDS.update(_CONFIG["thresholds"])


def get_season_for_month(month: int) -> str:
    for season, months in SEASON_MONTHS.items():
        if month in months:
            return season
    return "Rabi"


def get_recommendation(crop: str, fertilizer: str, season: str, land_size: float) -> float:
    """
    Returns recommended quantity in kg.
    Falls back gracefully for unknown crop/fertilizer/season combinations.
    """
    crop_key = crop.strip().lower()
    crops = _CONFIG["crops"]

    if crop_key not in crops:
        # Unknown crop: use average across all known crops for this fertilizer/season
        values = []
        for c in crops.values():
            if fertilizer in c and season in c[fertilizer]:
                values.append(c[fertilizer][season])
        kg_per_acre = sum(values) / len(values) if values else 50.0
    else:
        fert_map = crops[crop_key]
        if fertilizer not in fert_map:
            # Unknown fertilizer: use Urea as fallback
            fert_map = fert_map.get("Urea", {})
            kg_per_acre = fert_map.get(season, 50.0) if isinstance(fert_map, dict) else 50.0
        else:
            season_map = fert_map[fertilizer]
            kg_per_acre = season_map.get(season, list(season_map.values())[0])

    return round(kg_per_acre * land_size, 2)


def get_quantity_ratio(requested: float, recommended: float) -> float:
    if recommended <= 0:
        return 1.0
    return round(requested / recommended, 4)


def classify_by_ratio(ratio: float) -> str:
    """
    Percentage-based risk classification.
    GREEN  : ratio <= 1.05  (up to 105% of recommendation)
    YELLOW : ratio <= 1.20  (105%–120%)
    RED    : ratio >  1.20  (above 120%)
    """
    green_max = THRESHOLDS["green_max_pct"] / 100.0
    yellow_max = THRESHOLDS["yellow_max_pct"] / 100.0

    if ratio <= green_max:
        return "GREEN"
    elif ratio <= yellow_max:
        return "YELLOW"
    else:
        return "RED"
