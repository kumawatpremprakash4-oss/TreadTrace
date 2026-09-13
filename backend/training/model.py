"""
TreadTrace F1 Degradation Model Architecture
============================================
Defines the TreadTrace Degradation Model class for training,
inference, and serialization.
"""

import numpy as np
from sklearn.linear_model import HuberRegressor

class TreadTraceF1DegradationModel:
    """
    TreadTrace Degradation Model fitted on real FastF1 Grand Prix race data.
    Preserves the exact TreadTrace architecture:
    HuberRegressor on tyre age vs normalized tyre degradation loss per compound,
    with compound-specific cliff onset thresholds and residual confidence intervals.
    """
    def __init__(self):
        self.compound_regressors = {}
        self.cliff_laps = {"SOFT": 16, "MEDIUM": 26, "HARD": 38}
        self.cliff_factors = {"SOFT": 0.003, "MEDIUM": 0.0015, "HARD": 0.0010}
        self.residual_stds = {}
        self.deg_rates = {}
        self.intercepts = {}
        self.trained_date = None

    def fit_compound(self, compound: str, X_age: np.ndarray, y_deg: np.ndarray):
        reg = HuberRegressor(max_iter=300, alpha=0.5, epsilon=1.35)
        reg.fit(X_age, y_deg)
        preds = reg.predict(X_age)
        residuals = y_deg - preds
        res_std = float(np.std(residuals)) if len(residuals) > 2 else 0.05
        deg_rate = max(0.010, float(reg.coef_[0]))
        intercept = float(reg.intercept_)
        
        self.compound_regressors[compound] = reg
        self.deg_rates[compound] = deg_rate
        self.intercepts[compound] = intercept
        self.residual_stds[compound] = res_std

    def predict(self, compound: str, ages: np.ndarray) -> np.ndarray:
        if compound not in self.compound_regressors:
            default_rates = {"SOFT": 0.068, "MEDIUM": 0.041, "HARD": 0.024}
            rate = default_rates.get(compound, 0.040)
            return rate * ages

        reg = self.compound_regressors[compound]
        X = ages.reshape(-1, 1) if ages.ndim == 1 else ages
        base_preds = reg.predict(X)
        
        cliff_lap = self.cliff_laps.get(compound, 26)
        factor = self.cliff_factors.get(compound, 0.0015)
        cliff_penalties = np.where(ages > cliff_lap, factor * ((ages - cliff_lap) ** 2), 0.0)
        
        return np.maximum(0.0, base_preds + cliff_penalties)

    def predict_with_confidence(self, compound: str, ages: np.ndarray):
        preds = self.predict(compound, ages)
        res_std = self.residual_stds.get(compound, 0.05)
        ci_half = 1.96 * max(0.025, res_std)
        ci_lower = np.maximum(0.0, preds - ci_half)
        ci_upper = preds + ci_half
        return preds, ci_lower, ci_upper
