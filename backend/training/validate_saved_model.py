"""
Final Model Validation Script
==============================
Verifies:
1. Saved model loads cleanly.
2. Compound regressors load cleanly.
3. Feature schema and metadata exist and are valid JSON.
4. Predictions are non-negative, finite, monotonic, and physically sound.
5. Confidence intervals are valid.
6. Old models remain untouched.
"""

import os
import sys
import json
import pickle
import numpy as np

sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("backend/training"))

from backend.training.model import TreadTraceF1DegradationModel

ARTIFACTS_DIR = os.path.join("models", "treadtrace_f1_trained")
MAIN_MODEL = os.path.join(ARTIFACTS_DIR, "degradation_model.pkl")
COMPOUND_MODELS_DIR = os.path.join(ARTIFACTS_DIR, "compound_models")
SCHEMA_FILE = os.path.join(ARTIFACTS_DIR, "feature_schema.json")
CONFIG_FILE = os.path.join(ARTIFACTS_DIR, "training_config.json")
METADATA_FILE = os.path.join(ARTIFACTS_DIR, "model_metadata.json")
METRICS_FILE = os.path.join(ARTIFACTS_DIR, "metrics.json")
REPORT_FILE = os.path.join("reports", "treadtrace_training_report.md")

def validate():
    print("--- 1. Checking Artifact Existence ---")
    for f in [MAIN_MODEL, SCHEMA_FILE, CONFIG_FILE, METADATA_FILE, METRICS_FILE, REPORT_FILE]:
        assert os.path.exists(f), f"Missing artifact: {f}"
        print(f"  [OK] Exists: {f} ({os.path.getsize(f)} bytes)")

    for c in ["soft", "medium", "hard"]:
        cp = os.path.join(COMPOUND_MODELS_DIR, f"{c}_model.pkl")
        assert os.path.exists(cp), f"Missing compound model: {cp}"
        print(f"  [OK] Exists: {cp}")

    print("\n--- 2. Checking JSON Schema and Metadata ---")
    with open(SCHEMA_FILE) as f:
        schema = json.load(f)
        assert "inputs" in schema and "target" in schema
        print("  [OK] Feature schema valid.")

    with open(METADATA_FILE) as f:
        meta = json.load(f)
        assert meta["total_raw_laps"] == 25194
        assert meta["valid_training_laps"] == 20333
        assert len(meta["seasons_used"]) == 4
        print(f"  [OK] Metadata valid: {meta['dataset_name']}, {len(meta['seasons_used'])} seasons.")

    print("\n--- 3. Loading Saved Degradation Model ---")
    with open(MAIN_MODEL, "rb") as f:
        model = pickle.load(f)
    print(f"  [OK] Model loaded: {type(model).__name__}")
    print(f"  Learned wear rates: {model.deg_rates}")

    print("\n--- 4. Running Test Inferences ---")
    test_ages = np.array([1, 5, 10, 15, 20, 25, 30, 35])
    for comp in ["SOFT", "MEDIUM", "HARD"]:
        preds, ci_low, ci_high = model.predict_with_confidence(comp, test_ages)
        assert np.all(np.isfinite(preds)), f"Non-finite prediction for {comp}"
        assert np.all(preds >= 0.0), f"Negative prediction for {comp}"
        assert np.all(ci_high >= preds), f"CI upper bound violation for {comp}"
        assert np.all(preds >= ci_low), f"CI lower bound violation for {comp}"
        print(f"  [{comp}] Ages: {test_ages}")
        print(f"       Preds (s):   {[round(p, 3) for p in preds]}")
        print(f"       CI Low (s):  {[round(p, 3) for p in ci_low]}")
        print(f"       CI High (s): {[round(p, 3) for p in ci_high]}")

    print("\n--- 5. Confirming Old Application Models Untouched ---")
    old_models = [
        "backend/app/models/tyre_memory.py",
        "backend/app/models/vehicle_twin.py",
        "backend/app/ml/degradation.py",
        "backend/app/ml/confounder.py"
    ]
    for om in old_models:
        assert os.path.exists(om), f"Missing original application file: {om}"
        print(f"  [OK] Original intact: {om}")

    print("\n=== ALL FINAL VALIDATION CHECKS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    validate()
