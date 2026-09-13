"""
TreadTrace Synthetic Motorsport Telemetry Generator.
Generates realistic, physically grounded Formula 1 / GT3 practice and race session datasets
with known confounding variables (fuel load, track evolution, traffic, temperature, driver variation, flags).
All data generated is explicitly stamped with DATA_PROVENANCE = 'SYNTHETIC DEMONSTRATION DATA'.
"""

import math
import random
from typing import List, Dict, Any

DATA_PROVENANCE = "SYNTHETIC DEMONSTRATION DATA"

COMPOUND_SPECS = {
    "SOFT": {
        "code": "C4",
        "color": "#EF4444",
        "base_delta": -0.75,  # s vs baseline
        "deg_linear": 0.068,  # s/lap wear rate
        "deg_quadratic": 0.0025,
        "cliff_lap": 16,
        "opt_track_temp": 35.0,  # deg C
        "temp_sensitivity": 0.014,
    },
    "MEDIUM": {
        "code": "C3",
        "color": "#FBBF24",
        "base_delta": 0.00,  # baseline reference
        "deg_linear": 0.041,
        "deg_quadratic": 0.0012,
        "cliff_lap": 26,
        "opt_track_temp": 38.0,
        "temp_sensitivity": 0.010,
    },
    "HARD": {
        "code": "C2",
        "color": "#F1F5F9",
        "base_delta": 0.82,
        "deg_linear": 0.024,
        "deg_quadratic": 0.0006,
        "cliff_lap": 38,
        "opt_track_temp": 42.0,
        "temp_sensitivity": 0.007,
    },
}

CIRCUIT_INFO = {
    "name": "Silverstone GP Circuit",
    "country": "Great Britain",
    "length_km": 5.891,
    "baseline_lap_time": 87.850,  # seconds (clean car, zero fuel, perfect track)
    "fuel_penalty_per_kg": 0.033,  # seconds per kg fuel
    "fuel_burn_per_lap": 1.62,     # kg per lap
    "max_track_evolution": 0.68,   # max grip improvement over session (seconds)
}


def generate_practice_session(seed: int = 42) -> Dict[str, Any]:
    """Generates realistic FP2 practice telemetry containing multiple stints and compounds."""
    rng = random.Random(seed)
    
    session_meta = {
        "session_id": "FP2-SILVERSTONE-2026",
        "session_type": "Free Practice 2",
        "provenance": DATA_PROVENANCE,
        "circuit": CIRCUIT_INFO["name"],
        "driver": "Alexander Albon",
        "car_number": 23,
        "team": "TreadTrace Dynamics",
        "weather": "Dry / Clear",
        "ambient_temp_start": 22.5,
        "track_temp_start": 36.2,
        "total_laps_planned": 48,
    }

    stints_config = [
        # Stint 1: Out-lap + Soft evaluation + In-lap (Qualifying simulation)
        {"stint_id": 1, "compound": "SOFT", "tyre_id": "SET-S01-FP2", "start_fuel": 32.0, "laps": 10, "mode": "push"},
        # Stint 2: Medium tyre baseline evaluation
        {"stint_id": 2, "compound": "MEDIUM", "tyre_id": "SET-M01-FP2", "start_fuel": 55.0, "laps": 16, "mode": "race_sim"},
        # Stint 3: Hard tyre long run endurance evaluation
        {"stint_id": 3, "compound": "HARD", "tyre_id": "SET-H01-FP2", "start_fuel": 72.0, "laps": 18, "mode": "high_fuel"},
    ]

    laps = []
    global_lap = 1
    track_temp = session_meta["track_temp_start"]

    for stint in stints_config:
        compound = stint["compound"]
        spec = COMPOUND_SPECS[compound]
        fuel = stint["start_fuel"]
        stint_len = stint["laps"]

        for stint_lap in range(1, stint_len + 1):
            # Track temperature slow drift
            track_temp += (rng.uniform(-0.15, 0.22))
            air_temp = 22.0 + (track_temp - 35.0) * 0.2

            # Track evolution: session gets faster as rubber is deposited
            track_evo_effect = -CIRCUIT_INFO["max_track_evolution"] * (1.0 - math.exp(-0.055 * global_lap))

            # Fuel effect: positive penalty proportional to remaining fuel
            fuel_effect = fuel * CIRCUIT_INFO["fuel_penalty_per_kg"]

            # Temperature effect: penalty if track temp deviates from compound optimum
            temp_delta = track_temp - spec["opt_track_temp"]
            temp_effect = spec["temp_sensitivity"] * (temp_delta ** 2) / 10.0

            # True tyre degradation effect: linear wear + quadratic cliff if past cliff_lap
            tyre_age = stint_lap
            pure_tyre_deg = spec["deg_linear"] * tyre_age
            if tyre_age > spec["cliff_lap"]:
                cliff_excess = tyre_age - spec["cliff_lap"]
                pure_tyre_deg += spec["deg_quadratic"] * (cliff_excess ** 2) * 5.0

            # Traffic & Event anomalies
            traffic_level = 0
            traffic_effect = 0.0
            is_yellow = False
            is_outlier = False
            lap_classification = "GREEN"
            clean_air = True

            # In-lap and Out-lap classification
            if stint_lap == 1:
                lap_classification = "PIT / OUT-LAP"
                observed_lap_time = CIRCUIT_INFO["baseline_lap_time"] + spec["base_delta"] + 18.5 + rng.uniform(0.2, 1.0)
            elif stint_lap == stint_len:
                lap_classification = "PIT / IN-LAP"
                observed_lap_time = CIRCUIT_INFO["baseline_lap_time"] + spec["base_delta"] + 14.2 + rng.uniform(0.1, 0.8)
            else:
                # Occasional traffic encounter (dirty air)
                if global_lap in [6, 19, 23, 38]:
                    traffic_level = rng.choice([2, 3])
                    traffic_effect = rng.uniform(0.45, 1.25)
                    lap_classification = "TRAFFIC"
                    clean_air = False
                elif global_lap == 14:
                    # Sector 2 yellow flag
                    is_yellow = True
                    traffic_effect = 4.80
                    lap_classification = "YELLOW FLAG"
                elif global_lap == 31:
                    # Driver mistake / lockup
                    is_outlier = True
                    traffic_effect = 1.65
                    lap_classification = "OUTLIER"
                else:
                    lap_classification = "VALID"

                # Driver variation (noise epsilon)
                driver_variation = rng.gauss(0.0, 0.08)

                # Observed lap time composition
                observed_lap_time = (
                    CIRCUIT_INFO["baseline_lap_time"]
                    + spec["base_delta"]
                    + pure_tyre_deg
                    + fuel_effect
                    + track_evo_effect
                    + temp_effect
                    + traffic_effect
                    + driver_variation
                )

            # Sectors partition
            sector_1 = observed_lap_time * 0.315 + rng.uniform(-0.05, 0.05)
            sector_2 = observed_lap_time * 0.395 + rng.uniform(-0.06, 0.06)
            sector_3 = observed_lap_time - (sector_1 + sector_2)

            lap_record = {
                "lap_number": global_lap,
                "stint_id": stint["stint_id"],
                "stint_lap": stint_lap,
                "tyre_id": stint["tyre_id"],
                "compound": compound,
                "tyre_age": tyre_age,
                "lap_time": round(observed_lap_time, 3),
                "sector_1": round(sector_1, 3),
                "sector_2": round(sector_2, 3),
                "sector_3": round(sector_3, 3),
                "fuel_load": round(fuel, 1),
                "track_temperature": round(track_temp, 1),
                "air_temperature": round(air_temp, 1),
                "traffic_level": traffic_level,
                "clean_air": clean_air,
                "yellow_flag": is_yellow,
                "classification": lap_classification,
                # Ground truth parameters (for evaluation and explainability)
                "ground_truth_tyre_deg": round(pure_tyre_deg, 3),
                "ground_truth_fuel_effect": round(fuel_effect, 3),
                "ground_truth_track_evo": round(track_evo_effect, 3),
                "ground_truth_traffic_effect": round(traffic_effect, 3),
            }
            laps.append(lap_record)

            # Burn fuel
            fuel = max(5.0, fuel - CIRCUIT_INFO["fuel_burn_per_lap"])
            global_lap += 1

    session_meta["laps"] = laps
    session_meta["total_laps"] = len(laps)
    return session_meta


def generate_race_session(seed: int = 101) -> Dict[str, Any]:
    """
    Generates actual Race Day session telemetry.
    Used for Post-Race Validation against practice predictions.
    Includes race-day condition shifts: higher ambient temp (+3.5C) and a Virtual Safety Car on lap 28.
    """
    rng = random.Random(seed)

    race_meta = {
        "session_id": "RACE-SILVERSTONE-2026",
        "session_type": "Grand Prix Race",
        "provenance": DATA_PROVENANCE,
        "circuit": CIRCUIT_INFO["name"],
        "driver": "Alexander Albon",
        "car_number": 23,
        "track_temp_avg": 40.5,
        "air_temp_avg": 25.8,
        "total_laps": 52,
    }

    # Race Strategy: 2-Stop: Stint 1 (Soft, 15 laps), Stint 2 (Medium, 22 laps), Stint 3 (Hard, 15 laps)
    race_stints = [
        {"stint_id": 1, "compound": "SOFT", "tyre_id": "SET-S01-RACE", "start_fuel": 105.0, "laps": 15},
        {"stint_id": 2, "compound": "MEDIUM", "tyre_id": "SET-M01-RACE", "start_fuel": 80.5, "laps": 22},
        {"stint_id": 3, "compound": "HARD", "tyre_id": "SET-H01-RACE", "start_fuel": 44.8, "laps": 15},
    ]

    laps = []
    global_lap = 1
    fuel = 105.0
    track_temp = 39.8

    for stint in race_stints:
        compound = stint["compound"]
        spec = COMPOUND_SPECS[compound]
        stint_len = stint["laps"]

        for stint_lap in range(1, stint_len + 1):
            track_temp += rng.uniform(-0.1, 0.15)
            # Track is heavily rubbered during race
            track_evo = -0.55 - 0.15 * (global_lap / 52.0)
            fuel_effect = fuel * CIRCUIT_INFO["fuel_penalty_per_kg"]

            # Ground truth tyre deg in race:
            # Note: slightly elevated wear because track temp is 40.5C (hotter than practice)
            temp_stress = 1.08 if compound == "SOFT" else 1.03
            pure_tyre_deg = (spec["deg_linear"] * temp_stress) * stint_lap
            if stint_lap > (spec["cliff_lap"] - 1):
                pure_tyre_deg += spec["deg_quadratic"] * 6.0 * ((stint_lap - spec["cliff_lap"] + 1) ** 2)

            is_pit = (stint_lap == 1 and global_lap > 1) or (stint_lap == stint_len and global_lap < 52)
            is_vsc = (global_lap in [28, 29])

            classification = "VALID"
            traffic_effect = 0.0

            if is_vsc:
                classification = "VIRTUAL SAFETY CAR"
                observed_lap_time = CIRCUIT_INFO["baseline_lap_time"] + 24.5
            elif is_pit:
                classification = "PIT STOP"
                observed_lap_time = CIRCUIT_INFO["baseline_lap_time"] + 19.8
            elif global_lap in [8, 24, 44]:
                classification = "OVERTAKE / TRAFFIC"
                traffic_effect = rng.uniform(0.6, 1.4)
                observed_lap_time = CIRCUIT_INFO["baseline_lap_time"] + spec["base_delta"] + pure_tyre_deg + fuel_effect + track_evo + traffic_effect + rng.gauss(0, 0.06)
            else:
                observed_lap_time = CIRCUIT_INFO["baseline_lap_time"] + spec["base_delta"] + pure_tyre_deg + fuel_effect + track_evo + rng.gauss(0, 0.05)

            laps.append({
                "lap_number": global_lap,
                "stint_id": stint["stint_id"],
                "stint_lap": stint_lap,
                "tyre_id": stint["tyre_id"],
                "compound": compound,
                "tyre_age": stint_lap,
                "lap_time": round(observed_lap_time, 3),
                "fuel_load": round(fuel, 1),
                "track_temperature": round(track_temp, 1),
                "classification": classification,
                "ground_truth_tyre_deg": round(pure_tyre_deg, 3),
                "fuel_effect": round(fuel_effect, 3),
                "track_evo": round(track_evo, 3),
            })

            fuel = max(4.0, fuel - CIRCUIT_INFO["fuel_burn_per_lap"])
            global_lap += 1

    race_meta["laps"] = laps
    return race_meta
