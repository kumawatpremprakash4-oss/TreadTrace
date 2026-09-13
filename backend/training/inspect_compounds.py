import zipfile
import pickle
import os
import pandas as pd

ZIP_PATH = "data tread trace.zip"

with zipfile.ZipFile(ZIP_PATH, 'r') as z:
    prefix = "raw/fastf1_cache/2022/2022-03-20_Bahrain_Grand_Prix/2022-03-20_Race/"
    
    # Check timing_app_data
    raw = z.read(prefix + "timing_app_data.ff1pkl")
    obj = pickle.loads(raw)
    data = obj.get('data', obj)
    print("timing_app_data shape:", data.shape)
    print("timing_app_data columns:", data.columns.tolist())
    print("Non-null Compound counts:")
    print(data['Compound'].value_counts(dropna=False))
    print("\nSample rows with Compound notna:")
    print(data[data['Compound'].notna()][['Time', 'Driver', 'LapNumber', 'Stint', 'TotalLaps', 'Compound', 'New']].head(10))
    
    # Check extended_timing_data
    raw_ext = z.read(prefix + "_extended_timing_data.ff1pkl")
    ext_obj = pickle.loads(raw_ext)
    ext_data = ext_obj.get('data', ext_obj)
    laps_df = ext_data[0]
    print("\nlaps_df (item 0) shape:", laps_df.shape)
    print("laps_df columns:", laps_df.columns.tolist())
    print("\nSample laps_df:")
    print(laps_df[['Time', 'Driver', 'NumberOfLaps', 'LapTime', 'PitInTime', 'PitOutTime', 'Sector1Time', 'Sector2Time', 'Sector3Time']].head(10))
    print("\nlaps_df Driver counts:")
    print(laps_df['Driver'].value_counts().head(5))
    print("\nlaps_df NumberOfLaps summary:")
    print(laps_df['NumberOfLaps'].describe())
