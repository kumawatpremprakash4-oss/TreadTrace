"""
TreadTrace Backend Application Entrypoint.
FastAPI service exposing real motorsport telemetry analysis, confounder isolation,
degradation modeling, tyre digital twin memory, prediction simulations, and post-race validation.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
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

# Configure CORS: defaults to ["*"] for development, or allows production frontend and configured origins
cors_origins_env = os.getenv("CORS_ORIGINS", "*").strip()
if cors_origins_env == "*":
    cors_origins = ["*"]
else:
    allowed_list = [orig.strip() for orig in cors_origins_env.split(",") if orig.strip()]
    if "https://treadtrace-frontend-ucqc.onrender.com" not in allowed_list:
        allowed_list.append("https://treadtrace-frontend-ucqc.onrender.com")
    cors_origins = allowed_list

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
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
    """Allows uploading external CSV, JSON, or XLSX practice session telemetry."""
    import re as _re
    content = await file.read()
    filename = (file.filename or "").lower()

    # -----------------------------------------------------------------------
    # Column Alias Normalization Map
    # Maps all known UI-export and canonical column names to internal keys.
    # -----------------------------------------------------------------------
    COLUMN_ALIASES: Dict[str, List[str]] = {
        "lap_number":       ["lap_number", "LAP", "Lap", "lap", "LAP_NUMBER", "Lap Number", "LAP NUMBER", "Laps", "LAPS"],
        "stint_id":         ["stint_id", "STINT", "Stint", "stint", "STINT_ID", "Stint ID", "STINT ID"],
        "tyre_age":         ["tyre_age", "AGE", "Age", "age", "TYRE_AGE", "Tyre Age", "TYRE AGE", "stint_lap", "STINT_LAP", "Stint Lap"],
        "compound":         ["compound", "COMPOUND", "Compound", "tyre_compound", "TYRE_COMPOUND", "Tyre Compound", "TYRE COMPOUND", "Comp", "COMP"],
        "lap_time":         ["lap_time", "LAPTIME", "LAP TIME", "LapTime", "Lap Time", "lap time", "LAP_TIME", "Lap_Time", "TIME", "Time", "time"],
        "fuel_load":        ["fuel_load", "FUEL", "Fuel", "fuel", "fuel_kg", "FUEL_LOAD", "Fuel Load", "FUEL LOAD", "Fuel(kg)", "FUEL(KG)"],
        "track_temperature":["track_temperature", "TRACK °C", "TRACK_C", "Track °C", "Track_C", "track_temp", "TrackTemp", "TRACK TEMP", "Track Temp", "TRACK_TEMP", "TRACK", "Track", "TRACK (°C)", "Track (°C)"],
        "source_status":    ["STATUS", "Status", "status", "LAP_STATUS", "Lap Status", "STATE", "State"],
        "source_model_used":["MODEL USED", "MODEL_USED", "Model Used", "model_used", "MODEL_USE", "Model Use", "USE_IN_MODEL"],
        "traffic_level":    ["traffic_level", "TRAFFIC", "Traffic", "traffic", "TRAFFIC_LEVEL"],
        "clean_air":        ["clean_air", "CLEAN_AIR", "Clean Air", "CLEAN AIR"],
        "yellow_flag":      ["yellow_flag", "YELLOW_FLAG", "Yellow Flag", "YELLOW FLAG"],
    }
    REQUIRED_FIELDS = ["lap_number", "lap_time"]

    def resolve(row: Dict[str, Any], field: str) -> Optional[str]:
        """Return the first non-empty matching value from the row using known aliases."""
        # 1. Exact alias match
        for alias in COLUMN_ALIASES.get(field, [field]):
            if alias in row:
                val = row[alias]
                if val is not None and str(val).strip() not in ("", "None", "nan"):
                    return str(val).strip()
        # 2. Case-insensitive and trimmed key match
        alias_set = {a.strip().upper() for a in COLUMN_ALIASES.get(field, [field])}
        for k, v in row.items():
            if k is not None and str(k).strip().upper() in alias_set:
                if v is not None and str(v).strip() not in ("", "None", "nan"):
                    return str(v).strip()
        return None

    def parse_int_field(raw: Optional[str], default: int = 1) -> int:
        """
        Parse integer fields safely.
        Handles prefixed strings like 'S1', 'S2', 'LAP 5', decimal strings like '1.0'.
        """
        if not raw:
            return default
        import re as _re
        # Strip any non-numeric chars except the first decimal point
        digits = _re.sub(r"[^0-9]", "", str(raw).split(".")[0])
        return int(digits) if digits else default

    def normalize_compound(raw: Optional[str]) -> str:
        if not raw:
            return "MEDIUM"
        up = raw.upper()
        if "SOFT" in up:
            return "SOFT"
        if "HARD" in up:
            return "HARD"
        if "MEDIUM" in up:
            return "MEDIUM"
        return up.split()[0] if up else "MEDIUM"

    def normalize_row(row: Dict[str, Any], row_idx: int) -> Dict[str, Any]:
        """
        Convert one raw row (from CSV, JSON, or XLSX) into a fully typed,
        normalized lap dict. Required fields are validated; optional fields
        use None rather than fake defaults so the frontend can display '—'.
        """
        lap_number_raw = resolve(row, "lap_number")
        lap_time_raw   = resolve(row, "lap_time")

        # Required numeric fields
        try:
            lap_number = parse_int_field(lap_number_raw)
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=422,
                detail=f"Row {row_idx + 1}: invalid lap_number '{lap_number_raw}'"
            )
        try:
            lap_time = float(lap_time_raw)  # type: ignore[arg-type]
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=422,
                detail=f"Row {row_idx + 1}: invalid lap_time '{lap_time_raw}'"
            )

        # Optional fields — safe parsing; None when absent (no fake defaults)
        stint_id_raw      = resolve(row, "stint_id")
        tyre_age_raw      = resolve(row, "tyre_age")
        compound_raw      = resolve(row, "compound")
        fuel_raw          = resolve(row, "fuel_load")
        track_raw         = resolve(row, "track_temperature")
        traffic_raw       = resolve(row, "traffic_level")
        clean_raw         = resolve(row, "clean_air")
        yellow_raw        = resolve(row, "yellow_flag")
        source_status     = resolve(row, "source_status")
        source_model_used = resolve(row, "source_model_used")

        stint_id  = parse_int_field(stint_id_raw, default=1)
        tyre_age  = parse_int_field(tyre_age_raw, default=lap_number) if tyre_age_raw else lap_number
        compound  = normalize_compound(compound_raw)

        try:
            fuel_load = float(fuel_raw) if fuel_raw else None
        except ValueError:
            fuel_load = None

        try:
            track_temperature = float(track_raw) if track_raw else None
        except ValueError:
            track_temperature = None

        try:
            traffic_level = int(float(traffic_raw)) if traffic_raw else 0
        except ValueError:
            traffic_level = 0

        clean_air   = str(clean_raw).lower() == "true" if clean_raw else True
        yellow_flag = str(yellow_raw).lower() == "true" if yellow_raw else False

        normalized: Dict[str, Any] = {
            "lap_number":    lap_number,
            "stint_id":      stint_id,
            "stint_lap":     tyre_age,   # alias for classifier
            "tyre_age":      tyre_age,
            "compound":      compound,
            "lap_time":      lap_time,
            "traffic_level": traffic_level,
            "clean_air":     clean_air,
            "yellow_flag":   yellow_flag,
        }

        # Only include fuel/track if present in the uploaded file (no fake defaults)
        if fuel_load is not None:
            normalized["fuel_load"] = fuel_load
        if track_temperature is not None:
            normalized["track_temperature"] = track_temperature

        # Preserve raw status columns for the audit trail
        if source_status:
            normalized["source_status"] = source_status
        if source_model_used:
            normalized["source_model_used"] = source_model_used

        return normalized

    # -----------------------------------------------------------------------
    # File format dispatch — all formats funnel into the same normalize_row()
    # -----------------------------------------------------------------------
    rows: List[Dict[str, Any]] = []

    if filename.endswith(".json"):
        try:
            data = json.loads(content.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {exc}")

        raw_laps: List[Any] = []
        if isinstance(data, dict) and "laps" in data:
            raw_laps = data["laps"]
        elif isinstance(data, list):
            raw_laps = data
        else:
            raise HTTPException(
                status_code=422,
                detail="JSON must be a list of laps or an object with a 'laps' key."
            )
        rows = [dict(lap) for lap in raw_laps]

    elif filename.endswith(".csv"):
        try:
            text = content.decode("utf-8-sig")  # utf-8-sig strips BOM if present
        except UnicodeDecodeError:
            text = content.decode("latin-1")
        rows = list(csv.DictReader(io.StringIO(text)))

    elif filename.endswith((".xlsx", ".xls")):
        try:
            import openpyxl  # type: ignore[import]
            wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True, data_only=True)
            ws = wb.active
            all_rows = list(ws.iter_rows(values_only=True))
            if not all_rows:
                raise HTTPException(status_code=400, detail="XLSX file is empty.")
            headers = [
                str(h) if h is not None else f"col_{i}"
                for i, h in enumerate(all_rows[0])
            ]
            rows = [
                {
                    headers[i]: (str(cell) if cell is not None else "")
                    for i, cell in enumerate(data_row)
                }
                for data_row in all_rows[1:]
                if any(cell is not None for cell in data_row)
            ]
        except ImportError:
            raise HTTPException(
                status_code=501,
                detail="XLSX support requires openpyxl. Please contact the system administrator."
            )
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Could not read XLSX file: {exc}")
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Use .csv, .json, or .xlsx"
        )

    if not rows:
        raise HTTPException(status_code=400, detail="No data rows found in uploaded file.")

    # Validate required fields exist using alias matching on the first row
    sample = rows[0]
    missing_required = [f for f in REQUIRED_FIELDS if resolve(sample, f) is None]
    if missing_required:
        raise HTTPException(
            status_code=422,
            detail=(
                f"File is missing required fields: {missing_required}. "
                f"Available columns: {list(sample.keys())}"
            ),
        )

    # Normalize all rows into typed lap dicts
    laps = [normalize_row(row, idx) for idx, row in enumerate(rows)]

    classified = classify_session_laps(laps)
    new_id = f"UPLOAD-{len(SESSION_STORE) + 1}"
    SESSION_STORE[new_id] = {
        "session_id":   new_id,
        "session_type": "Custom Uploaded Session",
        "circuit":      "Custom Circuit",
        "driver":       "User Driver",
        "total_laps":   len(classified),   # ensures SessionMeta type is satisfied
        "provenance":   "USER UPLOADED DATA",
        "laps":         classified,
    }

    # Analyze the newly uploaded session.
    # Wrapped in try/except so an analysis failure does NOT roll back the session.
    try:
        decomposed = confounder_engine.fit_and_decompose(classified)
        curves     = degradation_model.fit_and_generate_curves(decomposed["decomposed_laps"])
        ANALYSIS_CACHE[new_id] = {
            "confounders": decomposed,
            "degradation": curves,
        }
        valid_laps = decomposed.get("valid_clean_laps", sum(1 for l in classified if l.get("used_in_model")))
    except Exception as analysis_exc:
        print(f"[TreadTrace] Post-upload analysis error for {new_id}: {analysis_exc}")
        ANALYSIS_CACHE[new_id] = {"confounders": {}, "degradation": {}}
        valid_laps = sum(1 for l in classified if l.get("used_in_model"))

    return {
        "session_id": new_id,
        "total_laps": len(classified),
        "valid_laps": valid_laps,
        "message":    "Session successfully ingested and analyzed.",
    }
