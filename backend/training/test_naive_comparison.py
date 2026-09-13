import pandas as pd
import numpy as np
from sklearn.linear_model import HuberRegressor, LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

DATA_PATH = "backend/training/data/fastf1_processed_training_laps.csv"
df = pd.read_csv(DATA_PATH, low_memory=False)
df['Stint_ID'] = df['Season'].astype(str) + "_" + df['Race'] + "_" + df['DriverNumber'].astype(str) + "_s" + df['Stint'].astype(str)

# Confounder-aware TreadTrace degradation
stint_bases_norm = df.groupby('Stint_ID')['NormalisedLapTime_sec'].transform(lambda s: s.iloc[:3].median() if len(s) >= 3 else s.iloc[0])
df['TreadTrace_TyreDeg_sec'] = np.maximum(0.0, df['NormalisedLapTime_sec'] - stint_bases_norm)

# Naive degradation (raw lap times relative to raw stint start, without fuel or track evo correction)
stint_bases_raw = df.groupby('Stint_ID')['LapTimeSeconds'].transform(lambda s: s.iloc[:3].median() if len(s) >= 3 else s.iloc[0])
df['Naive_Raw_Delta_sec'] = df['LapTimeSeconds'] - stint_bases_raw

train_mask = df['Season'].isin([2022, 2023, '2022', '2023'])
test_mask = df['Season'].isin([2025, '2025'])

df_train = df[train_mask]
df_test = df[test_mask]

compounds = ["SOFT", "MEDIUM", "HARD"]
tt_models = {}
naive_models = {}

for comp in compounds:
    sub = df_train[df_train['TyreCompound'] == comp]
    X = sub['TyreAge'].values.reshape(-1, 1)
    
    # TreadTrace
    tt_reg = HuberRegressor(max_iter=300, alpha=0.5)
    tt_reg.fit(X, sub['TreadTrace_TyreDeg_sec'].values)
    tt_models[comp] = tt_reg
    
    # Naive
    n_reg = LinearRegression()
    n_reg.fit(X, sub['Naive_Raw_Delta_sec'].values)
    naive_models[comp] = n_reg
    print(f"{comp}: TreadTrace Rate = {tt_reg.coef_[0]:.4f} s/lap | Naive Rate = {n_reg.coef_[0]:.4f} s/lap")

# Compare on TEST set (2025 season)
y_true = df_test['TreadTrace_TyreDeg_sec'].values
tt_preds = np.array([tt_models[row['TyreCompound']].predict([[row['TyreAge']]])[0] for _, row in df_test.iterrows()])
tt_preds = np.maximum(0.0, tt_preds)

naive_preds = np.array([naive_models[row['TyreCompound']].predict([[row['TyreAge']]])[0] for _, row in df_test.iterrows()])

tt_mae = mean_absolute_error(y_true, tt_preds)
naive_mae = mean_absolute_error(y_true, naive_preds)

print(f"\nTEST SET (2025 Season) RESULTS:")
print(f"  Naive Linear Regression MAE: {naive_mae:.4f}s")
print(f"  TreadTrace Huber Model MAE:  {tt_mae:.4f}s")
print(f"  Absolute Improvement:        {naive_mae - tt_mae:.4f}s")
print(f"  Error Reduction:             {(naive_mae - tt_mae) / naive_mae * 100:.1f}%")
