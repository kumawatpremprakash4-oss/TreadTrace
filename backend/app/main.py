"""
TreadTrace Backend Application Entrypoint.
FastAPI service exposing real motorsport telemetry analysis, confounder isolation,
degradation modeling, tyre digital twin memory, prediction simulations, and post-race validation.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import csv
import io

from .synthetic.generator import generate_practice_session, generate_race_session, COMPOUND_SPECS, CIRCUIT_INFO
from .preprocessing.classifier import classify_session_laps
from .ml.confounder import ConfounderEngine
from .ml.degradation import DegradationModel
from .models.tyre_memory import tyre_memory_registry
from .models.vehicle_twin import vehicle_digital_twin, CORNER_CONFIG
from .ml.risk_engine import tyre_risk_engine, TYRE_RISK_THRESHOLDS
from .ml.prediction import PredictionEngine
from .validation.validator import PostRaceValidator

app = FastAPI(
    title="TreadTrace: AI Tyre Intelligence & Digital Twin",
    version="1.0.0",
    description="Isolating true tyre degradation from confounding motorsport practice variables.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Persistent in-memory session store for sessions and analysis caches
SESSION_STORE: Dict[str, Dict[str, Any]] = {}
ANALYSIS_CACHE: Dict[str, Dict[str, Any]] = {}

# Initialize default synthetic sessions
default_practice = generate_practice_session(seed=42)
default_practice["laps"] = classify_session_laps(default_practice["laps"])
SESSION_STORE[default_practice["session_id"]] = default_practice

default_race = generate_race_session(seed=101)
SESSION_STORE[default_race["session_id"]] = default_race

# Precompute initial analysis for fast demo loading
confounder_engine = ConfounderEngine()
degradation_model = DegradationModel()
prediction_engine = PredictionEngine()
post_race_validator = PostRaceValidator()

decomposed_summary = confounder_engine.fit_and_decompose(default_practice["laps"])
degradation_curves = degradation_model.fit_and_generate_curves(decomposed_summary["decomposed_laps"])

ANALYSIS_CACHE[default_practice["session_id"]] = {
    "confounders": decomposed_summary,
    "degradation": degradation_curves,
}


class PredictionRequest(BaseModel):
    compound: str = "MEDIUM"
    start_age_laps: int = 0
    target_stint_laps: int = 22
    start_fuel_kg: float = 65.0
    track_temp: float = 38.0
    traffic_mode: str = "CLEAN"


class CompoundCompareRequest(BaseModel):
    stint_length: int = 25
    start_fuel: float = 70.0
    track_temp: float = 38.0


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "TreadTrace AI Engine",
        "version": "1.0.0",
        "data_provenance": "SYNTHETIC DEMONSTRATION DATA",
    }


@app.get("/api/sessions")
def list_sessions():
    """Lists available practice and race telemetry sessions."""
    return [
        {
            "session_id": s["session_id"],
            "session_type": s["session_type"],
            "circuit": s["circuit"],
            "driver": s.get("driver", "Alexander Albon"),
            "total_laps": len(s.get("laps", [])),
            "provenance": s.get("provenance", "SYNTHETIC DEMONSTRATION DATA"),
        }
        for s in SESSION_STORE.values()
    ]


@app.get("/api/sessions/{session_id}")
def get_session_details(session_id: str):
    """Retrieves full telemetry laps and quality classifications for a session."""
    session = SESSION_STORE.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@app.get("/api/analysis/{session_id}/confounders")
def get_confounder_analysis(session_id: str):
    """Returns decomposed physical confounders (fuel, traffic, track evolution, temperature) per lap."""
    if session_id in ANALYSIS_CACHE:
        return ANALYSIS_CACHE[session_id]["confounders"]

    session = SESSION_STORE.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    laps = session.get("laps", [])
    summary = confounder_engine.fit_and_decompose(laps)
    return summary


@app.get("/api/analysis/{session_id}/degradation")
def get_degradation_analysis(session_id: str):
    """Returns clean degradation curves with confidence intervals and A/B comparison metrics."""
    if session_id in ANALYSIS_CACHE:
        return ANALYSIS_CACHE[session_id]["degradation"]

    session = SESSION_STORE.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    laps = session.get("laps", [])
    decomposed = confounder_engine.fit_and_decompose(laps)
    curves = degradation_model.fit_and_generate_curves(decomposed["decomposed_laps"])
    return curves


@app.get("/api/tyres")
def get_tyre_twins():
    """Returns digital twin states for all tracked tyre allocations."""
    return tyre_memory_registry.get_all()


@app.get("/api/tyres/{tyre_id}/memory")
def get_tyre_memory(tyre_id: str):
    """Returns detailed history, heat cycles, and model evidence notes for a single tyre set."""
    twin = tyre_memory_registry.get(tyre_id)
    if not twin:
        raise HTTPException(status_code=404, detail="Tyre Digital Twin not found")
    return twin.to_dict()


@app.get("/api/vehicle/tyres")
def get_vehicle_tyres(session_id: Optional[str] = None, lap: Optional[int] = None):
    """
    Returns the complete 4-wheel vehicle digital twin state (FL, FR, RL, RR)
    including corner load dynamics, thermal deviations, and active alerts.
    """
    sid = session_id or list(SESSION_STORE.keys())[0]
    session = SESSION_STORE.get(sid)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    deg_data = ANALYSIS_CACHE.get(sid, {}).get("degradation")
    return vehicle_digital_twin.build_vehicle_state(
        session_data=session,
        degradation_data=deg_data,
        lap_number=lap,
    )


@app.get("/api/tyres/{position}")
def get_tyre_corner_detail(position: str, session_id: Optional[str] = None, lap: Optional[int] = None):
    """
    Returns deep forensic analytical state for an individual tyre corner:
    FL (Front Left), FR (Front Right), RL (Rear Left), or RR (Rear Right),
    including dedicated degradation curve with 95% confidence intervals and cliff onset.
    """
    norm_pos = position.upper().replace("-", "_").replace("FRONT_LEFT", "FL").replace("FRONT_RIGHT", "FR").replace("REAR_LEFT", "RL").replace("REAR_RIGHT", "RR")
    if norm_pos not in CORNER_CONFIG:
        # Fallback to tyre memory check if someone requested a tyre_id like SET-S01-FP2
        twin = tyre_memory_registry.get(position)
        if twin:
            return twin.to_dict()
        raise HTTPException(status_code=404, detail=f"Tyre corner position or ID '{position}' not found. Use FL, FR, RL, or RR.")

    sid = session_id or list(SESSION_STORE.keys())[0]
    session = SESSION_STORE.get(sid)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    deg_data = ANALYSIS_CACHE.get(sid, {}).get("degradation")
    vehicle_state = vehicle_digital_twin.build_vehicle_state(
        session_data=session,
        degradation_data=deg_data,
        lap_number=lap,
    )
    
    corner_state = vehicle_state["tyres"].get(norm_pos)
    if not corner_state:
        raise HTTPException(status_code=404, detail=f"Corner {norm_pos} state unavailable")

    # Generate corner-specific degradation trajectory points for forensic plotting
    corner_deg_rate = corner_state["estimated_degradation_rate"]
    corner_cliff = corner_state["cliff_lap"]
    comp_spec = COMPOUND_SPECS.get(corner_state["compound"], COMPOUND_SPECS["MEDIUM"])

    curve_points = []
    max_plot_age = max(corner_cliff + 8, corner_state["tyre_age"] + 6)
    for age_i in range(1, max_plot_age + 1):
        cliff_penalty = 0.0
        if age_i > corner_cliff:
            cliff_penalty = comp_spec["deg_quadratic"] * ((age_i - corner_cliff) ** 2)
        model_deg = round(corner_deg_rate * age_i + cliff_penalty, 3)
        curve_points.append({
            "tyre_age": age_i,
            "model_degradation": model_deg,
            "ci_lower": round(max(0.0, model_deg - 0.045), 3),
            "ci_upper": round(model_deg + 0.045, 3),
            "cliff_onset": age_i >= corner_cliff,
            "is_current_lap": age_i == corner_state["tyre_age"],
        })

    response_data = dict(corner_state)
    response_data["curve"] = curve_points
    response_data["vehicle_context"] = {
        "vehicle_id": vehicle_state["vehicle_id"],
        "lap": vehicle_state["lap"],
        "fuel_load_kg": vehicle_state["fuel_load_kg"],
        "track_temp_celsius": vehicle_state["track_temperature"],
        "active_alerts_count": len(vehicle_state["alerts"]),
    }
    return response_data


@app.post("/api/prediction/stint")
def predict_stint(req: PredictionRequest):
    """Simulates prospective stint performance and usable tyre window."""
    rates = {
        comp: data["degradation_rate_sec_per_lap"]
        for comp, data in ANALYSIS_CACHE[default_practice["session_id"]]["degradation"]["compounds"].items()
    }
    result = prediction_engine.predict_stint(
        compound=req.compound,
        start_age_laps=req.start_age_laps,
        target_stint_laps=req.target_stint_laps,
        start_fuel_kg=req.start_fuel_kg,
        track_temp=req.track_temp,
        traffic_mode=req.traffic_mode,
        learned_deg_rates=rates,
    )
    return result


@app.post("/api/prediction/compare")
def compare_compounds(req: CompoundCompareRequest):
    """Compares Soft, Medium, and Hard compounds over a stint to pinpoint crossover laps."""
    return prediction_engine.compare_compounds(
        stint_length=req.stint_length,
        start_fuel=req.start_fuel,
        track_temp=req.track_temp,
    )


@app.get("/api/validation/{race_id}")
def get_race_validation(race_id: str):
    """Compares practice predictions against actual race day performance and explains divergence."""
    rates = {
        comp: data["degradation_rate_sec_per_lap"]
        for comp, data in ANALYSIS_CACHE[default_practice["session_id"]]["degradation"]["compounds"].items()
    }
    validation_result = post_race_validator.run_validation(rates)
    return validation_result


@app.post("/api/validation/update-memory")
def update_tyre_memory():
    """Applies closed-loop learning from race validation back into tyre digital twins."""
    rates = {
        comp: data["degradation_rate_sec_per_lap"]
        for comp, data in ANALYSIS_CACHE[default_practice["session_id"]]["degradation"]["compounds"].items()
    }
    validation_result = post_race_validator.run_validation(rates)
    update_response = post_race_validator.apply_feedback_to_memory(validation_result)
    return update_response


@app.post("/api/sessions/upload")
async def upload_session(file: UploadFile = File(...)):
    """Allows uploading external CSV or JSON practice session telemetry."""
    content = await file.read()
    filename = file.filename.lower()
    
    laps = []
    if filename.endswith(".json"):
        data = json.loads(content.decode("utf-8"))
        if isinstance(data, dict) and "laps" in data:
            laps = data["laps"]
        elif isinstance(data, list):
            laps = data
    elif filename.endswith(".csv"):
        text_stream = io.StringIO(content.decode("utf-8"))
        reader = csv.DictReader(text_stream)
        for row in reader:
            laps.append({
                "lap_number": int(row.get("lap_number", 1)),
                "stint_id": int(row.get("stint_id", 1)),
                "stint_lap": int(row.get("stint_lap", 1)),
                "compound": row.get("compound", "MEDIUM").upper(),
                "lap_time": float(row.get("lap_time", 90.0)),
                "fuel_load": float(row.get("fuel_load", 30.0)),
                "track_temperature": float(row.get("track_temperature", 38.0)),
                "traffic_level": int(row.get("traffic_level", 0)),
                "clean_air": row.get("clean_air", "true").lower() == "true",
                "yellow_flag": row.get("yellow_flag", "false").lower() == "true",
            })
    else:
        raise HTTPException(status_code=400, detail="Only .csv and .json files supported.")

    classified = classify_session_laps(laps)
    new_id = f"UPLOAD-{len(SESSION_STORE) + 1}"
    SESSION_STORE[new_id] = {
        "session_id": new_id,
        "session_type": "Custom Uploaded Session",
        "circuit": "Custom Circuit",
        "driver": "User Driver",
        "provenance": "USER UPLOADED DATA",
        "laps": classified,
    }

    # Analyze newly uploaded session
    decomposed = confounder_engine.fit_and_decompose(classified)
    curves = degradation_model.fit_and_generate_curves(decomposed["decomposed_laps"])
    ANALYSIS_CACHE[new_id] = {
        "confounders": decomposed,
        "degradation": curves,
    }

    return {
        "session_id": new_id,
        "total_laps": len(classified),
        "valid_laps": decomposed["valid_clean_laps"],
        "message": "Session successfully ingested and analyzed.",
    }
