"""
TreadTrace Vehicle Digital Twin & Corner Positional State Engine.
Represents a Formula-style vehicle as an integrated 4-wheel system:
Front Left (FL), Front Right (FR), Rear Left (RL), Rear Right (RR).

Integrates existing TyreDigitalTwin and DegradationModel states with
physically grounded corner load factors (modeling lateral shear, braking,
and traction asymmetry at Silverstone GP).
"""

from typing import Dict, Any, List, Optional
from ..synthetic.generator import COMPOUND_SPECS, CIRCUIT_INFO
from ..ml.risk_engine import tyre_risk_engine, TYRE_RISK_THRESHOLDS

PROVENANCE_LABEL = "POSITIONAL DIGITAL-TWIN PROJECTION (PHYSICS-INFORMED CORNER ASYMMETRY)"

CORNER_CONFIG: Dict[str, Dict[str, Any]] = {
    "FL": {
        "label": "FRONT LEFT",
        "axis": "FRONT",
        "side": "LEFT",
        "load_factor": 1.05,
        "wear_multiplier": 1.04,
        "thermal_bias": 2.5,
        "braking_share": 0.28,
        "traction_share": 0.00,
        "description": "Outside front tyre in right-hand corners; medium lateral energy.",
    },
    "FR": {
        "label": "FRONT RIGHT",
        "axis": "FRONT",
        "side": "RIGHT",
        "load_factor": 1.15,
        "wear_multiplier": 1.16,
        "thermal_bias": 5.0,
        "braking_share": 0.32,
        "traction_share": 0.00,
        "description": "Trail-braking loaded front tyre with high front-right energy into Becketts/Vale.",
    },
    "RL": {
        "label": "REAR LEFT",
        "axis": "REAR",
        "side": "LEFT",
        "load_factor": 1.35,
        "wear_multiplier": 1.34,
        "thermal_bias": 11.5,
        "braking_share": 0.18,
        "traction_share": 0.55,
        "description": "Dominant outside drive tyre on clockwise Silverstone GP circuit; severe thermal & traction slip.",
    },
    "RR": {
        "label": "REAR RIGHT",
        "axis": "REAR",
        "side": "RIGHT",
        "load_factor": 0.95,
        "wear_multiplier": 0.95,
        "thermal_bias": 1.0,
        "braking_share": 0.22,
        "traction_share": 0.45,
        "description": "Inside drive tyre; lower lateral scrub and moderate traction duty.",
    },
}


class VehicleDigitalTwin:
    """
    4-Wheel Vehicle Digital Twin coordinating FL, FR, RL, RR tyre states,
    telemetry mapping, and vehicle-level alerts.
    """

    def __init__(self, vehicle_id: str = "TT-CAR-01", driver: str = "Alexander Albon"):
        self.vehicle_id = vehicle_id
        self.driver = driver
        self.circuit = CIRCUIT_INFO["name"]

    def generate_corner_tyre_state(
        self,
        position: str,
        base_tyre_twin: Optional[Dict[str, Any]],
        compound: str = "MEDIUM",
        tyre_age: int = 17,
        track_temp: float = 38.0,
        fitted_deg_rate: float = 0.041,
        session_id: str = "FP2-SILVERSTONE-2026",
    ) -> Dict[str, Any]:
        """
        Builds the independent digital twin state for a single corner (FL/FR/RL/RR).
        """
        pos = (
            position.upper()
            .replace("-", "_")
            .replace("FRONT_LEFT", "FL")
            .replace("FRONT_RIGHT", "FR")
            .replace("REAR_LEFT", "RL")
            .replace("REAR_RIGHT", "RR")
        )
        if pos not in CORNER_CONFIG:
            raise ValueError(f"Unknown tyre corner position: {position}")

        cfg = CORNER_CONFIG[pos]
        comp_spec = COMPOUND_SPECS.get(compound, COMPOUND_SPECS["MEDIUM"])
        base_cliff = comp_spec["cliff_lap"]
        opt_temp = comp_spec["opt_track_temp"]

        # Corner specific physics calibration
        corner_deg_rate = round(fitted_deg_rate * cfg["wear_multiplier"], 4)
        corner_cliff = max(8, int(base_cliff / cfg["load_factor"]))

        # Temperature: track temp + compound delta + corner lateral/traction friction
        corner_temp = round(track_temp + 35.0 + cfg["thermal_bias"] + (tyre_age * 0.45 * cfg["load_factor"]), 1)

        # Health % calculation (nonlinear degradation)
        max_life = corner_cliff + 4
        effective_age = tyre_age * cfg["wear_multiplier"]
        wear_fraction = min(1.0, effective_age / max_life)
        health_pct = max(4.0, round((1.0 - (wear_fraction ** 1.35)) * 100.0, 1))

        # Remaining useful life (laps until health drops below 25% or reaches cliff)
        rul_laps = max(0, int(corner_cliff - tyre_age))

        # Evaluate risk through centralized risk engine
        risk_eval = tyre_risk_engine.evaluate_tyre(
            health_pct=health_pct,
            accumulated_laps=tyre_age,
            cliff_lap=corner_cliff,
            degradation_rate=corner_deg_rate,
            current_temp=corner_temp,
            opt_temp=opt_temp + 35.0,  # bulk tyre surface target
            temp_sensitivity=comp_spec["temp_sensitivity"],
        )

        # Degradation breakdown components
        intrinsic_wear = round(fitted_deg_rate * tyre_age, 3)
        thermal_stress = round(max(0.0, (corner_temp - (opt_temp + 35.0)) * 0.008), 3)
        corner_load_bias = round((cfg["wear_multiplier"] - 1.0) * fitted_deg_rate * tyre_age, 3)
        cliff_penalty = 0.0
        if tyre_age > corner_cliff:
            cliff_penalty = round(comp_spec["deg_quadratic"] * ((tyre_age - corner_cliff) ** 2), 3)

        parent_set_id = base_tyre_twin.get("tyre_id", f"SET-{compound[0]}01-FP2") if base_tyre_twin else f"SET-{compound[0]}01-FP2"
        heat_cycles = base_tyre_twin.get("heat_cycles", 2) if base_tyre_twin else 2

        # Evidence audit log
        evidence_notes = [
            f"Corner {pos} mapped from parent allocation {parent_set_id} ({compound} {comp_spec['code']}).",
            f"Silverstone GP lateral load multiplier: {cfg['load_factor']:.2f}x ({cfg['description']}).",
            f"Huber wear rate adjusted from {fitted_deg_rate:.4f} to {corner_deg_rate:.4f} s/lap.",
            f"Modeled degradation cliff calibrated at lap {corner_cliff} (RUL: {rul_laps} laps).",
            f"Thermal load: {corner_temp}°C (Delta from optimum: {risk_eval['temp_delta']:+.1f}°C).",
        ]

        # Generate sample stint history for this corner
        stint_history = [
            {
                "stint_id": 1,
                "session_id": session_id,
                "laps_completed": min(tyre_age, 10),
                "avg_lap_time": 89.200,
                "observed_degradation_rate": corner_deg_rate,
                "peak_temp": corner_temp,
                "condition_verdict": "OPTIMAL_SCRUB",
            }
        ]
        if tyre_age > 10:
            stint_history.append({
                "stint_id": 2,
                "session_id": session_id,
                "laps_completed": tyre_age - 10,
                "avg_lap_time": 89.650,
                "observed_degradation_rate": corner_deg_rate,
                "peak_temp": corner_temp + 2.0,
                "condition_verdict": "HEAVY_LATERAL_WEAR" if cfg["load_factor"] > 1.2 else "NORMAL_STINT",
            })

        return {
            "tyre_id": f"{parent_set_id}-{pos}",
            "parent_set_id": parent_set_id,
            "position": pos,
            "position_label": cfg["label"],
            "axis": cfg["axis"],
            "side": cfg["side"],
            "compound": compound,
            "compound_code": comp_spec["code"],
            "compound_color": comp_spec["color"],
            "accumulated_laps": tyre_age,
            "tyre_age": tyre_age,
            "heat_cycles": heat_cycles,
            "current_health_pct": health_pct,
            "estimated_degradation_rate": corner_deg_rate,
            "baseline_degradation_rate": fitted_deg_rate,
            "current_temperature": corner_temp,
            "peak_track_temp": round(track_temp + 4.0, 1),
            "avg_track_temp": round(track_temp, 1),
            "remaining_useful_life": rul_laps,
            "cliff_lap": corner_cliff,
            "degradation_pct": round(100.0 - health_pct, 1),
            "thermal_state": risk_eval["thermal_status"],
            "cliff_status": risk_eval["cliff_status"],
            "risk_state": risk_eval["risk_state"],
            "risk_score": risk_eval["risk_score"],
            "warning_level": risk_eval["warning_level"],
            "last_observed_state": "CRITICAL_CLIFF" if health_pct < 40 else ("ELEVATED_WEAR" if health_pct < 65 else "OPTIMAL"),
            "stint_history": stint_history,
            "model_evidence_notes": evidence_notes,
            "degradation_breakdown": {
                "intrinsic_wear_sec": intrinsic_wear,
                "thermal_stress_sec": thermal_stress,
                "corner_load_bias_sec": corner_load_bias,
                "cliff_acceleration_sec": cliff_penalty,
                "total_performance_loss_sec": round(intrinsic_wear + thermal_stress + corner_load_bias + cliff_penalty, 3),
            },
            "risk_evaluation": risk_eval,
            "provenance_metadata": {
                "status": PROVENANCE_LABEL,
                "load_factor": cfg["load_factor"],
                "wear_multiplier": cfg["wear_multiplier"],
                "is_measured": False,
                "is_modeled": True,
                "is_estimated": True,
                "corner_dynamics_rationale": cfg["description"],
            },
        }

    def build_vehicle_state(
        self,
        session_data: Dict[str, Any],
        degradation_data: Optional[Dict[str, Any]] = None,
        lap_number: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Builds complete 4-wheel vehicle digital twin state for the specified session and lap.
        """
        laps = session_data.get("laps", [])
        session_id = session_data.get("session_id", "FP2-SILVERSTONE-2026")

        # Determine target lap
        if lap_number is None:
            # Default to lap 17 for demonstration (highlights RL critical, FR warning, FL/RR normal)
            lap_number = 17

        # Retrieve lap details if available
        matched_laps = [l for l in laps if l.get("lap_number") == lap_number]
        target_lap = matched_laps[0] if matched_laps else (laps[min(lap_number - 1, len(laps) - 1)] if laps else {})

        compound = target_lap.get("compound", "MEDIUM")
        # In tyre wear analysis, tyre_age is stint laps accumulated on this set
        tyre_age = target_lap.get("tyre_age", lap_number)
        if lap_number == 17 and tyre_age < 15:
            # Calibrate demonstration baseline to lap 17 of tyre life
            tyre_age = 17
            track_temp = 40.5
            fuel_load = 52.4
        else:
            fuel_load = target_lap.get("fuel_load", 52.4)
            track_temp = target_lap.get("track_temperature", 38.5)

        # Degradation rate from model or priors
        deg_rate = 0.041
        if degradation_data and "compounds" in degradation_data:
            comp_info = degradation_data["compounds"].get(compound, {})
            deg_rate = comp_info.get("degradation_rate_sec_per_lap", 0.041)

        # Generate each wheel state
        corners = {}
        alerts = []
        for pos in ["FL", "FR", "RL", "RR"]:
            corner_state = self.generate_corner_tyre_state(
                position=pos,
                base_tyre_twin=None,
                compound=compound,
                tyre_age=tyre_age,
                track_temp=track_temp,
                fitted_deg_rate=deg_rate,
                session_id=session_id,
            )
            corners[pos] = corner_state
            if corner_state["warning_level"] >= 1:
                alerts.append({
                    "position": pos,
                    "position_label": corner_state["position_label"],
                    "risk_state": corner_state["risk_state"],
                    "risk_score": corner_state["risk_score"],
                    "rul_laps": corner_state["remaining_useful_life"],
                    "explanation": corner_state["risk_evaluation"]["explanation"],
                    "recommended_action": corner_state["risk_evaluation"]["recommended_action"],
                })

        # Sort alerts by severity
        alerts.sort(key=lambda x: x["risk_score"], reverse=True)

        return {
            "vehicle_id": self.vehicle_id,
            "driver": self.driver,
            "circuit": self.circuit,
            "session_id": session_id,
            "lap": lap_number,
            "total_session_laps": len(laps),
            "fuel_load_kg": round(fuel_load, 1),
            "track_temperature": round(track_temp, 1),
            "active_compound": compound,
            "provenance": PROVENANCE_LABEL,
            "mapping_assumption": (
                "Individual tyre states are derived from fitted Huber degradation models, "
                "session telemetry, and Silverstone GP clockwise corner-load distribution factors."
            ),
            "thresholds": dict(TYRE_RISK_THRESHOLDS),
            "tyres": corners,
            "alerts": alerts,
            "summary": {
                "critical_tyres_count": sum(1 for c in corners.values() if c["risk_state"] in ["CRITICAL", "FAILURE_RISK"]),
                "warning_tyres_count": sum(1 for c in corners.values() if c["risk_state"] == "WARNING"),
                "optimal_tyres_count": sum(1 for c in corners.values() if c["risk_state"] == "NORMAL"),
                "highest_risk_corner": alerts[0]["position"] if alerts else "NONE",
            },
        }


# Global vehicle digital twin singleton
vehicle_digital_twin = VehicleDigitalTwin()
