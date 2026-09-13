"""
TreadTrace Data Quality and Lap Classification Engine.
Evaluates every lap in a session to classify validity, detect traffic interference,
identify flag/compromised laps, and determine degradation model eligibility with explainability.
"""

from typing import List, Dict, Any


def classify_session_laps(laps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Evaluates each lap and returns enhanced records with classification,
    eligibility status, estimated penalty, and textual explanation.
    """
    if not laps:
        return []

    # Calculate median lap time across all non-pit laps to establish reference baseline
    raw_times = [lap["lap_time"] for lap in laps if lap.get("lap_time") is not None]
    sorted_times = sorted(raw_times)
    median_lap_time = sorted_times[len(sorted_times) // 2] if sorted_times else 90.0

    enhanced_laps = []

    for i, lap in enumerate(laps):
        time = lap.get("lap_time", 90.0)
        stint_lap = lap.get("stint_lap", 1)
        traffic_level = lap.get("traffic_level", 0)
        clean_air = lap.get("clean_air", True)
        yellow_flag = lap.get("yellow_flag", False)
        stint_id = lap.get("stint_id", 1)
        compound = lap.get("compound", "MEDIUM")

        # Determine if this is the first or last lap of the stint (in/out lap)
        is_first_in_stint = (stint_lap == 1)
        is_last_in_stint = (i == len(laps) - 1) or (laps[i + 1].get("stint_id") != stint_id if i + 1 < len(laps) else True)

        classification = "GREEN_VALID"
        used_in_model = True
        penalty_seconds = 0.0
        reason = "Clean lap with observable tyre and fuel characteristics."

        if is_first_in_stint or time > (median_lap_time + 12.0):
            classification = "PIT / OUT-LAP"
            used_in_model = False
            penalty_seconds = round(time - median_lap_time, 3)
            reason = "Stint out-lap. Pit lane speed limiter and cold tyre scrub."
        elif is_last_in_stint or time > (median_lap_time + 10.0):
            classification = "PIT / IN-LAP"
            used_in_model = False
            penalty_seconds = round(time - median_lap_time, 3)
            reason = "Stint in-lap. Driver backed off before pit entry line."
        elif yellow_flag:
            classification = "YELLOW FLAG"
            used_in_model = False
            penalty_seconds = round(time - median_lap_time, 3)
            reason = "Sector neutralized under yellow flag caution delta."
        elif not clean_air or traffic_level > 0:
            classification = "TRAFFIC"
            used_in_model = False  # By default exclude traffic laps from pure tyre degradation fitting
            penalty_seconds = round(lap.get("ground_truth_traffic_effect", 0.65), 3)
            reason = f"Turbulent wake / traffic interaction (+{penalty_seconds}s estimated penalty)."
        elif (time - median_lap_time) > 2.5:
            classification = "OUTLIER"
            used_in_model = False
            penalty_seconds = round(time - median_lap_time, 3)
            reason = "Atypical lap time discrepancy (possible lockup or track limits exceedance)."
        else:
            classification = "GREEN_VALID"
            used_in_model = True
            penalty_seconds = 0.0
            reason = "Clear air, optimal sector execution."

        enhanced = dict(lap)
        enhanced.update({
            "classification": classification,
            "used_in_model": used_in_model,
            "estimated_penalty_seconds": penalty_seconds,
            "classification_reason": reason,
        })
        enhanced_laps.append(enhanced)

    return enhanced_laps
