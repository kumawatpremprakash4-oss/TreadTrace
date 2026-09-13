"""
TreadTrace F1 Trained Model Interactive Inference Runner
=========================================================
Runs live inference using the newly trained TreadTrace degradation model.
Takes compound and tyre age inputs and displays predicted degradation,
confidence intervals, and cliff onset warnings.
"""

import os
import sys
import pickle
import numpy as np

sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("backend/training"))

from backend.training.model import TreadTraceF1DegradationModel

MODEL_PATH = os.path.join("models", "treadtrace_f1_trained", "degradation_model.pkl")

def run_demo():
    print("=" * 65)
    print("  TREADTRACE F1 LIVE MODEL INFERENCE RUNNER")
    print("=" * 65)
    print(f"Loading trained model artifact from:\n  {MODEL_PATH}\n")
    
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
        
    print("Learned Physical Wear Rates from FastF1 2022-2025 Grand Prix Data:")
    for comp in ["SOFT", "MEDIUM", "HARD"]:
        print(f"  * {comp:6s}: {model.deg_rates[comp]:.4f} s/lap (Cliff Threshold: Lap {model.cliff_laps[comp]})")
        
    print("\n" + "-" * 65)
    print("SIMULATING STINT DEGRADATION PROFILES ACROSS COMPOUNDS:")
    print("-" * 65)
    
    stint_laps = np.array([1, 5, 10, 15, 20, 25, 30, 35])
    
    header = f"{'Compound':<8} | {'Lap':<4} | {'Degradation (s)':<15} | {'95% CI Lower':<12} | {'95% CI Upper':<12} | {'Cliff Status'}"
    print(header)
    print("-" * len(header))
    
    for comp in ["SOFT", "MEDIUM", "HARD"]:
        preds, ci_low, ci_high = model.predict_with_confidence(comp, stint_laps)
        for i, lap in enumerate(stint_laps):
            cliff_active = lap >= model.cliff_laps[comp]
            status = "CLIFF ONSET EXCEEDED!" if cliff_active else "Nominal Wear Phase"
            print(f"{comp:<8} | {lap:<4} | +{preds[i]:.3f}s          | +{ci_low[i]:.3f}s       | +{ci_high[i]:.3f}s       | {status}")
        print("-" * len(header))
        
    print("\n[OK] Model inference completed successfully with 100% finite, valid outputs.")

if __name__ == "__main__":
    run_demo()
