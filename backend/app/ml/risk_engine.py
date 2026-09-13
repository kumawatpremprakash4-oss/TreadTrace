"""
TreadTrace Tyre Risk Engine.
Centralized, configurable risk evaluation layer computing multi-factor risk scores,
thermal stress states, degradation cliff proximity, and failure-risk classifications
for individual tyre digital twins.
"""

from typing import Dict, Any, Optional

DATA_PROVENANCE = "SYNTHETIC DEMONSTRATION DATA"

# Centralized configurable risk thresholds (0 - 100 score)
TYRE_RISK_THRESHOLDS = {
    "NORMAL_MAX": 49,
    "WARNING_MAX": 79,
    "CRITICAL_MAX": 94,
    "FAILURE_RISK_MIN": 95,
}


class TyreRiskEngine:
    """
    Evaluates individual tyre physical state against multi-dimensional risk criteria:
    wear progression, thermal overload, degradation rate, and cliff proximity.
    """

    def __init__(self, thresholds: Optional[Dict[str, int]] = None):
        self.thresholds = thresholds or dict(TYRE_RISK_THRESHOLDS)

    def classify_risk_score(self, risk_score: float) -> tuple[str, int]:
        """
        Classifies numeric risk score against configurable threshold boundaries:
        <= NORMAL_MAX (49): NORMAL
        <= WARNING_MAX (79): WARNING
        <= CRITICAL_MAX (94): CRITICAL
        >= FAILURE_RISK_MIN (95): FAILURE_RISK
        """
        if risk_score <= self.thresholds["NORMAL_MAX"]:
            return "NORMAL", 0
        elif risk_score <= self.thresholds["WARNING_MAX"]:
            return "WARNING", 1
        elif risk_score <= self.thresholds["CRITICAL_MAX"]:
            return "CRITICAL", 2
        else:
            return "FAILURE_RISK", 3

    def evaluate_tyre(
        self,
        health_pct: float,
        accumulated_laps: int,
        cliff_lap: int,
        degradation_rate: float,
        current_temp: float,
        opt_temp: float = 38.0,
        temp_sensitivity: float = 0.010,
    ) -> Dict[str, Any]:
        """
        Evaluates risk score and categorical state for a given tyre.
        Returns composite score (0-100), risk_state, thermal_status, cliff_status,
        and human-readable physical explanations.
        """
        # 1. Wear / Health Risk Component (0 - 45 pts)
        health_deficit = max(0.0, 100.0 - health_pct)
        wear_component = (health_deficit / 100.0) * 45.0

        # 2. Cliff Proximity Component (0 - 35 pts)
        laps_to_cliff = cliff_lap - accumulated_laps
        if laps_to_cliff > 5:
            cliff_status = "PRE_CLIFF"
            cliff_component = max(0.0, 15.0 - laps_to_cliff)
        elif laps_to_cliff > 0:
            cliff_status = "APPROACHING_CLIFF"
            cliff_component = 15.0 + (5 - laps_to_cliff) * 3.0  # 15 to 30 pts
        elif laps_to_cliff == 0:
            cliff_status = "CLIFF_ONSET"
            cliff_component = 30.0
        else:
            cliff_status = "POST_CLIFF"
            over_cliff = abs(laps_to_cliff)
            cliff_component = min(35.0, 30.0 + over_cliff * 1.5)

        # 3. Thermal Stress Component (0 - 20 pts)
        temp_delta = current_temp - opt_temp
        if temp_delta <= 2.0:
            thermal_status = "OPTIMAL"
            thermal_component = 0.0
        elif temp_delta <= 8.0:
            thermal_status = "WARM"
            thermal_component = (temp_delta / 8.0) * 8.0
        elif temp_delta <= 18.0:
            thermal_status = "STRESSED"
            thermal_component = 8.0 + ((temp_delta - 8.0) / 10.0) * 7.0
        else:
            thermal_status = "CRITICAL"
            thermal_component = min(20.0, 15.0 + (temp_delta - 18.0) * 0.5)

        # Composite raw score clamped to [0, 100]
        raw_score = wear_component + cliff_component + thermal_component
        risk_score = round(min(100.0, max(0.0, raw_score)), 1)

        # Categorical state classification using strict threshold boundaries
        risk_state, warning_level = self.classify_risk_score(risk_score)

        if risk_state == "NORMAL":
            explanation = "Tyre operating within nominal wear and thermal parameters."
            action = "CONTINUE STINT"
        elif risk_state == "WARNING":
            explanation = (
                f"Elevated tyre stress detected ({thermal_status.lower()} thermal state, "
                f"{laps_to_cliff} laps from modeled cliff)."
            )
            action = "MONITOR SECTOR DELTAS / COOL IN DIRTY AIR"
        elif risk_state == "CRITICAL":
            explanation = (
                f"Severe tyre degradation near cliff ({cliff_status.replace('_', ' ').lower()}). "
                f"Tread performance loss exceeds +{degradation_rate:.3f}s/lap."
            )
            action = "PREPARE BOX / PIT WINDOW OPEN"
        else:
            explanation = (
                "Critical modeled thermal/structural degradation cliff reached. "
                "Significant risk of blister propagation and terminal grip loss."
            )
            action = "BOX THIS LAP / INSPECT TYRE"

        return {
            "risk_score": risk_score,
            "risk_state": risk_state,
            "warning_level": warning_level,
            "thermal_status": thermal_status,
            "cliff_status": cliff_status,
            "laps_to_cliff": laps_to_cliff,
            "current_temperature": round(current_temp, 1),
            "optimal_temperature": round(opt_temp, 1),
            "temp_delta": round(temp_delta, 1),
            "explanation": explanation,
            "recommended_action": action,
            "credibility_disclaimer": (
                "Risk classification is model-derived from Huber degradation slope, "
                "thermal deviation, and cliff proximity. Configurable engineering thresholds applied. "
                "Does not indicate guaranteed catastrophic burst."
            ),
        }


# Global singleton instance
tyre_risk_engine = TyreRiskEngine()
