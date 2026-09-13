import pandas as pd
import numpy as np
from sklearn.linear_model import HuberRegressor, LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

DATA_PATH = "backend/training/data/fastf1_processed_training_laps.csv"
df = pd.read_csv(DATA_PATH, low_memory=False)

df['Stint_ID'] = df['Season'].astype(str) + "_" + df['Race'] + "_" + df['DriverNumber'].astype(str) + "_s" + df['Stint'].astype(str)

# Initial stint baseline: median of first 3 valid laps in stint
stint_bases = df.groupby('Stint_ID')['NormalisedLapTime_sec'].transform(lambda s: s.iloc[:3].median() if len(s) >= 3 else s.iloc[0])
df['TrueTyreDeg_sec'] = np.maximum(0.0, df['NormalisedLapTime_sec'] - stint_bases)

train_mask = df['Season'].isin([2022, 2023, '2022', '2023'])
val_mask = df['Season'].isin([2024, '2024'])
test_mask = df['Season'].isin([2025, '2025'])

df_train = df[train_mask]
df_val = df[val_mask]
df_test = df[test_mask]

compounds = ["SOFT", "MEDIUM", "HARD"]
models = {}

print("Fitting on TRAIN (2022-2023):")
for comp in compounds:
    sub = df_train[df_train['TyreCompound'] == comp]
    X = sub['TyreAge'].values.reshape(-1, 1)
    y = sub['TrueTyreDeg_sec'].values
    # Force zero/small intercept since degradation at age 0/1 is 0
    reg = HuberRegressor(max_iter=300, alpha=0.5, fit_intercept=True)
    reg.fit(X, y)
    models[comp] = reg
    print(f"  {comp}: wear_rate = {reg.coef_[0]:.4f} s/lap, intercept = {reg.intercept_:.4f}")

for split_name, s_df in [("TRAIN", df_train), ("VAL", df_val), ("TEST", df_test)]:
    y_true_all = []
    y_pred_all = []
    for comp in compounds:
        sub = s_df[s_df['TyreCompound'] == comp]
        if sub.empty:
            continue
        X = sub['TyreAge'].values.reshape(-1, 1)
        y = sub['TrueTyreDeg_sec'].values
        preds = np.maximum(0.0, models[comp].predict(X))
        y_true_all.extend(y)
        y_pred_all.extend(preds)
    
    y_t = np.array(y_true_all)
    y_p = np.array(y_pred_all)
    mae = mean_absolute_error(y_t, y_p)
    rmse = np.sqrt(mean_squared_error(y_t, y_p))
    r2 = r2_score(y_t, y_p)
    print(f"{split_name}: MAE = {mae:.4f}s, RMSE = {rmse:.4f}s, R2 = {r2:.4f}")
