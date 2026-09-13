"""
TreadTrace Tyre Memory / Digital Twin Engine.
Maintains persistent digital performance histories for each physical tyre set across sessions,
storing accumulated wear, thermal cycles, observed degradation rates, remaining useful performance,
and calibration adjustments from post-race validation.
"""

from typing import List, Dict, Any, Optional
import datetime

DATA_PROVENANCE = "SYNTHETIC DEMONSTRATION DATA"


class TyreDigitalTwin:
    """Represents the digital twin lifecycle state of a specific tyre allocation."""

    def __init__(
        self,
        tyre_id: str,
        compound: str,
        initial_condition: str = "NEW",
        allocation_set: int = 1,
    ):
        self.tyre_id = tyre_id
        self.compound = compound
        self.initial_condition = initial_condition
        self.allocation_set = allocation_set
        self.accumulated_laps = 0
        self.heat_cycles = 0
        self.stint_history: List[Dict[str, Any]] = []
        self.estimated_degradation_rate = 0.068 if compound == "SOFT" else (0.041 if compound == "MEDIUM" else 0.024)
        self.peak_track_temp = 0.0
        self.avg_track_temp = 0.0
        self.current_health_pct = 100.0
        self.confidence_score = 88.0
        self.last_observed_state = "SCRUBBED / OPTIMAL" if initial_condition == "SCRUBBED" else "FACTORY_NEW"
        self.model_evidence_notes = [
            "Initial factory baseline prior loaded."
        ]

    def record_stint(
        self,
        session_id: str,
        stint_id: int,
        laps_completed: int,
        avg_lap_time: float,
        observed_deg_rate: float,
        avg_temp: float,
        peak_temp: float,
        end_state: str = "NORMAL_WEAR",
    ):
        """Appends a completed stint to the tyre's digital twin memory."""
        self.heat_cycles += 1
        self.accumulated_laps += laps_completed
        self.peak_track_temp = max(self.peak_track_temp, peak_temp)
        self.avg_track_temp = (
            avg_temp if self.heat_cycles == 1 else (self.avg_track_temp * 0.6 + avg_temp * 0.4)
        )

        # Exponential decay of remaining useful performance
        max_life_laps = 20 if self.compound == "SOFT" else (30 if self.compound == "MEDIUM" else 42)
        wear_fraction = min(1.0, self.accumulated_laps / max_life_laps)
        self.current_health_pct = max(5.0, round((1.0 - (wear_fraction ** 1.3)) * 100.0, 1))

        # Update running degradation rate using Bayesian-style blending
        self.estimated_degradation_rate = round(
            self.estimated_degradation_rate * 0.35 + observed_deg_rate * 0.65, 4
        )
        self.last_observed_state = end_state
        self.confidence_score = min(96.0, round(75.0 + self.accumulated_laps * 0.8, 1))

        stint_entry = {
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "session_id": session_id,
            "stint_id": stint_id,
            "laps_completed": laps_completed,
            "cumulative_laps": self.accumulated_laps,
            "avg_lap_time": round(avg_lap_time, 3),
            "observed_degradation_rate": round(observed_deg_rate, 4),
            "avg_track_temp": round(avg_temp, 1),
            "peak_track_temp": round(peak_temp, 1),
            "post_stint_health_pct": self.current_health_pct,
            "condition_verdict": end_state,
        }
        self.stint_history.append(stint_entry)
        self.model_evidence_notes.append(
            f"Stint {stint_id} ({session_id}): {laps_completed} laps completed. "
            f"Wear rate evaluated at {observed_deg_rate:.4f} s/lap under {avg_temp:.1f}°C."
        )

    def apply_post_race_learning(self, race_error_delta: float, calibration_factor: float):
        """Updates tyre twin after race validation analysis."""
        self.estimated_degradation_rate = round(self.estimated_degradation_rate * calibration_factor, 4)
        self.model_evidence_notes.append(
            f"Post-Race Calibration Applied: Adjusted wear rate to {self.estimated_degradation_rate:.4f} s/lap "
            f"(Race pace bias of {race_error_delta:+.3f}s corrected)."
        )
        self.confidence_score = min(98.0, self.confidence_score + 3.0)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tyre_id": self.tyre_id,
            "compound": self.compound,
            "initial_condition": self.initial_condition,
            "allocation_set": self.allocation_set,
            "accumulated_laps": self.accumulated_laps,
            "heat_cycles": self.heat_cycles,
            "estimated_degradation_rate": self.estimated_degradation_rate,
            "current_health_pct": self.current_health_pct,
            "confidence_score": self.confidence_score,
            "last_observed_state": self.last_observed_state,
            "avg_track_temp": round(self.avg_track_temp, 1),
            "peak_track_temp": round(self.peak_track_temp, 1),
            "stint_history": self.stint_history,
            "model_evidence_notes": self.model_evidence_notes,
            "definition": "Tyre Memory is a digital performance history representing the model's accumulated evidence about this tyre set.",
            "provenance": DATA_PROVENANCE,
        }


class TyreMemoryRegistry:
    """Manages the active digital twin garage for all tyre sets."""

    def __init__(self):
        self._twins: Dict[str, TyreDigitalTwin] = {}
        self._seed_default_twins()

    def _seed_default_twins(self):
        """Pre-populates digital twins for the practice and race session sets."""
        s1 = TyreDigitalTwin("SET-S01-FP2", "SOFT", initial_condition="NEW", allocation_set=1)
        s1.record_stint("FP2-SILVERSTONE-2026", 1, 10, 88.420, 0.068, 36.5, 37.8, "NORMAL_WEAR")
        self._twins["SET-S01-FP2"] = s1

        m1 = TyreDigitalTwin("SET-M01-FP2", "MEDIUM", initial_condition="NEW", allocation_set=2)
        m1.record_stint("FP2-SILVERSTONE-2026", 2, 16, 89.150, 0.041, 37.2, 38.4, "HEALTHY_STINT")
        self._twins["SET-M01-FP2"] = m1

        h1 = TyreDigitalTwin("SET-H01-FP2", "HARD", initial_condition="NEW", allocation_set=3)
        h1.record_stint("FP2-SILVERSTONE-2026", 3, 18, 90.050, 0.024, 38.0, 39.1, "LOW_DEGRADATION")
        self._twins["SET-H01-FP2"] = h1

        # Race sets (prepared for Sunday GP)
        self._twins["SET-S01-RACE"] = TyreDigitalTwin("SET-S01-RACE", "SOFT", "SCRUBBED", 4)
        self._twins["SET-M01-RACE"] = TyreDigitalTwin("SET-M01-RACE", "MEDIUM", "NEW", 5)
        self._twins["SET-H01-RACE"] = TyreDigitalTwin("SET-H01-RACE", "HARD", "NEW", 6)

    def get_all(self) -> List[Dict[str, Any]]:
        return [twin.to_dict() for twin in self._twins.values()]

    def get(self, tyre_id: str) -> Optional[TyreDigitalTwin]:
        return self._twins.get(tyre_id)

    def register_or_update(self, twin: TyreDigitalTwin):
        self._twins[twin.tyre_id] = twin


# Global singleton registry instance
tyre_memory_registry = TyreMemoryRegistry()
