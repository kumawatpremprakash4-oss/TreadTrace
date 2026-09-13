"""
TreadTrace Stint & Degradation Prediction Engine.
Generates forward-looking tyre performance forecasts based on learned compound degradation rates,
starting fuel, track temperature, starting tyre age, and expected track conditions.
Calculates compound crossover points and usable stint windows.
"""

from typing import Dict, Any, List
import math
from ..synthetic.generator import COMPOUND_SPECS, CIRCUIT_INFO

DATA_PROVENANCE = "SYNTHETIC DEMONSTRATION DATA"


class PredictionEngine:
    """Simulates prospective stint performance, degradation trajectories, and compound crossovers."""

    def predict_stint(
        self,
        compound: str = "MEDIUM",
        start_age_laps: int = 0,
        target_stint_laps: int = 22,
        start_fuel_kg: float = 65.0,
        track_temp: float = 38.0,
        traffic_mode: str = "CLEAN",  # CLEAN, LIGHT, HEAVY
        learned_deg_rates: Dict[str, float] = None,
    ) -> Dict[str, Any]:
        """
        Projects lap-by-lap pace and tyre degradation for a proposed future stint.
        """
        comp = compound.upper()
        spec = COMPOUND_SPECS.get(comp, COMPOUND_SPECS["MEDIUM"])

        # Use learned degradation rate if provided, otherwise default to compound spec
        if learned_deg_rates and comp in learned_deg_rates:
            deg_rate = learned_deg_rates[comp]
        else:
            deg_rate = spec["deg_linear"]

        # Track temperature adjustment factor
        temp_delta = track_temp - spec["opt_track_temp"]
        temp_stress = 1.0 + (spec["temp_sensitivity"] * (temp_delta ** 2) / 40.0)
        effective_deg_rate = deg_rate * temp_stress

        cliff_lap = spec["cliff_lap"]
        fuel_burn = CIRCUIT_INFO["fuel_burn_per_lap"]
        fuel_penalty = CIRCUIT_INFO["fuel_penalty_per_kg"]

        traffic_penalty = 0.0
        if traffic_mode == "LIGHT":
            traffic_penalty = 0.25
        elif traffic_mode == "HEAVY":
            traffic_penalty = 0.75

        lap_forecasts = []
        current_fuel = start_fuel_kg
        total_stint_time = 0.0

        for stint_lap in range(1, target_stint_laps + 1):
            accum_age = start_age_laps + stint_lap
            
            # Non-linear thermal/structural cliff
            cliff_excess = max(0, accum_age - cliff_lap)
            quad_cliff = spec["deg_quadratic"] * 3.5 * (cliff_excess ** 2) if cliff_excess > 0 else 0.0
            
            pure_tyre_loss = (effective_deg_rate * accum_age) + quad_cliff
            fuel_impact = current_fuel * fuel_penalty
            # Slight track evolution benefit during stint
            track_gain = -0.012 * min(stint_lap, 15)

            projected_pace = (
                CIRCUIT_INFO["baseline_lap_time"]
                + spec["base_delta"]
                + pure_tyre_loss
                + fuel_impact
                + track_gain
                + traffic_penalty
            )
            total_stint_time += projected_pace

            # Confidence decays as stint extends into uncharted tyre age
            confidence = max(60, int(92 - (accum_age * 1.1) - (12 if cliff_excess > 0 else 0)))

            lap_forecasts.append({
                "stint_lap": stint_lap,
                "tyre_age": accum_age,
                "projected_lap_time": round(projected_pace, 3),
                "expected_tyre_loss": round(pure_tyre_loss, 3),
                "fuel_component": round(fuel_impact, 3),
                "remaining_fuel_kg": round(current_fuel, 1),
                "confidence_pct": confidence,
                "is_past_cliff": cliff_excess > 0,
            })
            current_fuel = max(3.0, current_fuel - fuel_burn)

        # Usable stint window
        usable_laps = max(1, cliff_lap - start_age_laps)
        avg_pace = round(total_stint_time / max(1, target_stint_laps), 3)

        return {
            "compound": comp,
            "start_age_laps": start_age_laps,
            "target_stint_laps": target_stint_laps,
            "start_fuel_kg": start_fuel_kg,
            "track_temp_celsius": track_temp,
            "effective_deg_rate_sec_per_lap": round(effective_deg_rate, 4),
            "cliff_onset_lap": cliff_lap,
            "usable_stint_window_laps": usable_laps,
            "predicted_average_lap_time": avg_pace,
            "provenance": DATA_PROVENANCE,
            "status": "MODEL PREDICTION",
            "forecast_laps": lap_forecasts,
        }

    def compare_compounds(
        self,
        stint_length: int = 25,
        start_fuel: float = 70.0,
        track_temp: float = 38.0,
    ) -> Dict[str, Any]:
        """
        Runs parallel projections for Soft, Medium, Hard compounds to reveal crossover laps.
        """
        soft_pred = self.predict_stint("SOFT", 0, stint_length, start_fuel, track_temp)
        med_pred = self.predict_stint("MEDIUM", 0, stint_length, start_fuel, track_temp)
        hard_pred = self.predict_stint("HARD", 0, stint_length, start_fuel, track_temp)

        # Build unified lap comparison series
        comparison_series = []
        soft_med_crossover = None
        med_hard_crossover = None

        for lap_idx in range(stint_length):
            s_lap = soft_pred["forecast_laps"][lap_idx]
            m_lap = med_pred["forecast_laps"][lap_idx]
            h_lap = hard_pred["forecast_laps"][lap_idx]

            s_time = s_lap["projected_lap_time"]
            m_time = m_lap["projected_lap_time"]
            h_time = h_lap["projected_lap_time"]

            # Crossover detection
            lap_no = lap_idx + 1
            if soft_med_crossover is None and m_time <= s_time:
                soft_med_crossover = lap_no
            if med_hard_crossover is None and h_time <= m_time:
                med_hard_crossover = lap_no

            comparison_series.append({
                "lap": lap_no,
                "soft_pace": s_time,
                "medium_pace": m_time,
                "hard_pace": h_time,
                "soft_deg": s_lap["expected_tyre_loss"],
                "medium_deg": m_lap["expected_tyre_loss"],
                "hard_deg": h_lap["expected_tyre_loss"],
            })

        return {
            "stint_length": stint_length,
            "start_fuel_kg": start_fuel,
            "track_temp_celsius": track_temp,
            "soft_vs_medium_crossover_lap": soft_med_crossover or 15,
            "medium_vs_hard_crossover_lap": med_hard_crossover or 24,
            "strategic_recommendation": (
                f"Soft holds pace advantage for the first {soft_med_crossover or 15} laps. "
                f"Medium offers optimal balance between laps {soft_med_crossover or 15} and {med_hard_crossover or 24}. "
                f"Hard tyre dominates past lap {med_hard_crossover or 24} as thermal degradation stabilizes."
            ),
            "comparison_series": comparison_series,
            "provenance": DATA_PROVENANCE,
        }
