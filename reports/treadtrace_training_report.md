# TreadTrace F1 Model Training & Evaluation Report

**Generated Date:** None  
**Dataset Source:** `data tread trace.zip`  
**Model Architecture:** `TreadTrace Confounder-Aware Huber Robust Regression`  
**Model Artifact Location:** `models/treadtrace_f1_trained/`  

---

## 1. Dataset Overview

* **Dataset Archive:** `data tread trace.zip`
* **Total Raw Records Extracted:** 25,194 laps
* **Valid Clean Training Records:** 20,333 laps (80.7% retention after TreadTrace Data Quality filtering)
* **Seasons Covered:** 2022, 2023, 2024, 2025
* **Grand Prix Races:** 23 events
* **Circuits:** 8 circuits (Catalunya, Jeddah, Melbourne, Monza, Sakhir, Shanghai, Spielberg, Suzuka)
* **Drivers Analyzed:** 32 drivers across all 10 Formula 1 constructor teams

### Laps by Compound (Clean Valid Dataset)
* **HARD:** 9,486 laps
* **MEDIUM:** 7,266 laps
* **SOFT:** 3,581 laps

---

## 2. Feature Provenance & Engineering

Strict physical provenance adherence: no synthetic telemetry or fabricated variables were created.

| Feature Name | Type | Provenance | Method / Role |
| :--- | :--- | :--- | :--- |
| `LapTimeSeconds` | float | **RAW FASTF1** | Measured official timing transponder time |
| `TyreAge` | float | **RAW FASTF1** | Accumulated laps on current tyre set from `timing_app_data` |
| `TyreCompound` | categorical | **RAW FASTF1** | Official Pirelli tyre allocation (SOFT, MEDIUM, HARD) |
| `TrackTemp` | float | **RAW FASTF1** | Measured track surface temperature (°C) from `weather_data` |
| `AirTemp` | float | **RAW FASTF1** | Measured ambient air temperature (°C) from `weather_data` |
| `TrackStatus` | string | **RAW FASTF1** | Official race control flags (1=Green, 2=Yellow, 4=SC, 6=VSC) |
| `EstimatedFuelLoad_kg` | float | **ESTIMATED** | FIA 105kg starting capacity linear burn-off model |
| `EstimatedTrackEvo_sec`| float | **ESTIMATED** | Asymptotic track grip saturation curve: $-0.55 \times (1 - e^{-0.048 \times L})$ |
| `NormalisedLapTime_sec`| float | **ESTIMATED** | Confounder-stripped lap time: $T_{obs} - \Delta T_{fuel} - \Delta T_{evo} - \Delta T_{thermal}$ |
| `EstimatedTyreDeg_sec` | float | **ESTIMATED** | True tyre wear penalty relative to circuit compound base pace |

---

## 3. Data Quality & Preprocessing Filtering

The TreadTrace Data Quality engine evaluated all 25,194 raw laps and identified unusable laps to prevent bias:

* **GREEN_VALID (Eligible for Training):** 20,333 laps
* **PIT_OUT_LAP (Pit Lane Limiter / Cold Scrub):** 1,631 laps excluded
* **PIT_IN_LAP (Pit Entry Deceleration):** 1,127 laps excluded
* **NON_SLICK_OR_UNKNOWN (Wet / Inter Weather):** 978 laps excluded
* **INCOMPLETE_TIMING (Grid Formation / Start Lap):** 659 laps excluded
* **SAFETY_CAR_YELLOW (Caution Neutralized):** 266 laps excluded
* **PACE_OUTLIER (Lockups / Incidents / Major Traffic):** 200 laps excluded

---

## 4. Train / Validation / Test Split Strategy

A strict temporal out-of-season holdout was executed to guarantee **zero data leakage**:

* **TRAIN SPLIT (2022 & 2023 Seasons):** 10 Races, 8,741 valid laps
  * Sakhir, Jeddah, Catalunya, Spielberg, Monza (2022 & 2023)
* **VALIDATION SPLIT (2024 Season):** 5 Races, 5,050 valid laps
  * Sakhir, Jeddah, Catalunya, Spielberg, Monza (2024)
* **TEST HOLDOUT SPLIT (2025 Season):** 8 Races, 6,542 valid laps
  * Melbourne, Shanghai, Suzuka, Sakhir, Jeddah, Catalunya, Spielberg, Monza (2025)

---

## 5. Model Training & Learned Wear Rates

The TreadTrace `HuberRegressor` was trained on normalized tyre degradation loss per compound:

* **SOFT Compound Wear Rate:** `0.0769` s/lap (Cliff onset: Lap 16)
* **MEDIUM Compound Wear Rate:** `0.063` s/lap (Cliff onset: Lap 26)
* **HARD Compound Wear Rate:** `0.0486` s/lap (Cliff onset: Lap 38)

---

## 6. Evaluation Metrics

### Split-by-Split Performance

| Split | Laps | MAE (s) | RMSE (s) | $R^2$ Score | Bias (s) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TRAIN (2022-2023)** | 8,741 | **0.5317s** | 0.7521s | 0.171 | -0.0647s |
| **VALIDATION (2024)** | 5,050 | **0.5055s** | 0.6891s | 0.2247 | -0.0891s |
| **TEST (2025)** | 6,542 | **0.5018s** | 0.6793s | 0.129 | 0.1019s |

### Performance by Compound (Test Split - 2025 Season)

| Compound | Laps | MAE (s) | RMSE (s) | $R^2$ Score |
| :--- | :--- | :--- | :--- | :--- |
| **SOFT** | 872 | 0.4826s | 0.628s | 0.313 |
| **MEDIUM** | 2724 | 0.4636s | 0.6591s | 0.1833 |
| **HARD** | 2946 | 0.5428s | 0.7117s | 0.0143 |

---

## 7. Baseline Comparison: Naive vs TreadTrace Confounder Model

A direct A/B benchmark was conducted against naive linear regression on raw lap times:

* **Naive Linear Regression MAE:** `0.7256s`
* **TreadTrace Confounder-Aware Huber Model MAE:** `0.5018s`
* **Absolute Error Reduction:** `0.2238s`
* **Relative Accuracy Improvement:** `30.84%`

**Analytical Finding:** Naive regression fails because fuel burn-off (~0.033 s/kg, totaling up to ~3.3s over a full race) masks tyre degradation, causing naive models to severely underestimate true tyre degradation. TreadTrace strips non-tyre confounders, exposing the true wear dynamics.

---

## 8. Artifacts & Reproducibility

All artifacts have been verified and saved to `models/treadtrace_f1_trained/`:

1. `degradation_model.pkl`: Full serialised TreadTrace model with compound regressors and cliff functions.
2. `compound_models/soft_model.pkl`: Soft compound HuberRegressor.
3. `compound_models/medium_model.pkl`: Medium compound HuberRegressor.
4. `compound_models/hard_model.pkl`: Hard compound HuberRegressor.
5. `feature_schema.json`: Input feature contract and provenance tags.
6. `training_config.json`: Hyperparameters and configuration.
7. `metrics.json`: Full numerical evaluation results across all splits.
8. `model_metadata.json`: Dataset metadata, provenance, and audit logs.

---

## 9. Known Limitations

1. **Per-Wheel Telemetry:** FastF1 public timing feeds provide car-level lap times and sector splits. Per-wheel load, carcass temperature, and tread depths are computed via TreadTrace physics digital twin equations.
2. **Wet Weather Conditions:** Intermediate and Full Wet laps (e.g. Australian GP 2025) were excluded from dry-slick degradation training.
3. **Fuel Measurement:** Fuel masses are calculated from FIA 105kg baseline race capacities and fuel burn rates rather than direct flow-meter telemetry.
