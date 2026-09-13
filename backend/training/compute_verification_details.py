import os
import sys
import hashlib
import json
import pickle
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("backend/training"))

from backend.training.model import TreadTraceF1DegradationModel

# Hash of zip
ZIP_PATH = "data tread trace.zip"
with open(ZIP_PATH, "rb") as f:
    zip_hash = hashlib.sha256(f.read()).hexdigest()

# Load model
with open("models/treadtrace_f1_trained/degradation_model.pkl", "rb") as f:
    model = pickle.load(f)

# Load data
df = pd.read_csv("backend/training/data/fastf1_processed_training_laps.csv", low_memory=False)

train_df = df[df['Season'].isin([2022, 2023, '2022', '2023'])]
test_df = df[df['Season'].isin([2025, '2025'])]

train_circuits = set(train_df['Circuit'].unique())
test_circuits = set(test_df['Circuit'].unique())
unseen_circuits = test_circuits - train_circuits

train_drivers = set(train_df['DriverNumber'].unique())
test_drivers = set(test_df['DriverNumber'].unique())
unseen_drivers = test_drivers - train_drivers

test_races = test_df['Race'].nunique()

print("Zip Hash:", zip_hash)
print("Unseen circuits in test set:", unseen_circuits)
print("Unseen drivers in test set:", unseen_drivers)
print("Test races:", test_races)

# Model predictions for ages 1, 5, 10, 15
print("\nPredictions for ages 1, 5, 10, 15:")
for comp in ["SOFT", "MEDIUM", "HARD"]:
    preds = model.predict(comp, np.array([1, 5, 10, 15]))
    print(f"  {comp}: age 1={preds[0]:.3f}s, age 5={preds[1]:.3f}s, age 10={preds[2]:.3f}s, age 15={preds[3]:.3f}s")

# Check file sizes and mtime
model_path = "models/treadtrace_f1_trained/degradation_model.pkl"
print(f"Model file size: {os.path.getsize(model_path)} bytes")
print(f"Model mtime: {os.path.getmtime(model_path)}")
