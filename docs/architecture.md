# TreadTrace Architecture

## Closed-Loop Intelligence Architecture

```
PRACTICE TELEMETRY (FP1 / FP2 / FP3)
            ↓
DATA QUALITY & LAP CLASSIFIER (Filter in/out laps, flags, turbulent wake)
            ↓
CONFOUNDER DETECTION ENGINE (Huber robust regression decoupling fuel, track, weather)
            ↓
NORMALISATION PIPELINE (Strip external non-tyre noise)
            ↓
TRUE TYRE DEGRADATION MODEL (Extract pure mechanical & thermal wear curves)
            ↓
CLEAN DEGRADATION CURVE (With 95% Confidence / Prediction Intervals)
            ↓
TYRE MEMORY / DIGITAL TWIN (Persistent physical allocation state & RUL)
            ↓
FORWARD PREDICTION ENGINE (Pace simulation & compound crossover matrix)
            ↓
RACE DAY TELEMETRY (Sunday Grand Prix execution)
            ↓
POST-RACE VALIDATION ENGINE (Predicted vs Actual comparison)
            ↓
ATTRIBUTION ERROR ANALYSIS (Why did pace diverge? Temperature, VSC, cliff?)
            ↓
UPDATED TYRE MEMORY (Continuous learning applied to next grand prix)
```

## Technical Components

1. **Frontend**: React 19 + TypeScript + Vite + TailwindCSS + Recharts telemetry visualizer.
2. **Backend**: Python 3.14 + FastAPI + Pydantic.
3. **Machine Learning / Statistics**:
   - `HuberRegressor` for robust sensitivity estimation resistant to driver errors and traffic anomalies.
   - Closed-form multivariate normalisation.
   - Non-linear thermal cliff modeling.
   - Empirical Bayesian state updating for persistent digital twin memory.
4. **Data Provenance**:
   - Explicit labeling: `SYNTHETIC DEMONSTRATION DATA`.
   - Formula 1 Silverstone GP circuit physics parameters (5.891 km, ~87.85s base pace, ~0.033 s/kg fuel penalty).
