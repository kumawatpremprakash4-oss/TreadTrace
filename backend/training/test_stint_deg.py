import pandas as pd
import numpy as np

DATA_PATH = "backend/training/data/fastf1_processed_training_laps.csv"
df = pd.read_csv(DATA_PATH, low_memory=False)

print("Columns:", df.columns.tolist())

# Check a sample stint: driver 16 in Bahrain 2022 stint 0
sample = df[(df['Season'] == 2022) & (df['DriverNumber'] == 16) & (df['Stint'] == 0)]
print("\nSample stint (Driver 16, Bahrain 2022, Stint 0):")
print(sample[['NumberOfLaps', 'TyreAge', 'LapTimeSeconds', 'EstimatedFuelLoad_kg', 'NormalisedLapTime_sec', 'EstimatedTyreDegradation_sec']].head(10))

# If we compute stint-relative degradation:
# For each (Season, Race, DriverNumber, Stint), base_norm = NormalisedLapTime_sec at min(TyreAge)
df['Stint_ID'] = df['Season'].astype(str) + "_" + df['Race'] + "_" + df['DriverNumber'].astype(str) + "_s" + df['Stint'].astype(str)

stint_bases = df.groupby('Stint_ID')['NormalisedLapTime_sec'].transform(lambda s: s.iloc[:3].median() if len(s) >= 3 else s.iloc[0])
df['StintRelativeTyreDeg_sec'] = np.maximum(0.0, df['NormalisedLapTime_sec'] - stint_bases)

sample2 = df[(df['Season'] == 2022) & (df['DriverNumber'] == 16) & (df['Stint'] == 0)]
print("\nWith StintRelativeTyreDeg_sec:")
print(sample2[['NumberOfLaps', 'TyreAge', 'NormalisedLapTime_sec', 'StintRelativeTyreDeg_sec']].head(12))

print("\nMean stint-relative degradation by tyre age (Medium):")
med = df[df['TyreCompound'] == 'MEDIUM']
print(med.groupby(pd.cut(med['TyreAge'], bins=[0, 5, 10, 15, 20, 25, 30, 35]))['StintRelativeTyreDeg_sec'].mean())
