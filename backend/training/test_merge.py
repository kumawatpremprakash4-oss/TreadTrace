import zipfile
import pickle
import pandas as pd

ZIP_PATH = "data tread trace.zip"

with zipfile.ZipFile(ZIP_PATH, 'r') as z:
    prefix = "raw/fastf1_cache/2022/2022-03-20_Bahrain_Grand_Prix/2022-03-20_Race/"
    raw_app = z.read(prefix + "timing_app_data.ff1pkl")
    raw_ext = z.read(prefix + "_extended_timing_data.ff1pkl")
    
    app_data = pickle.loads(raw_app).get('data')
    laps_df = pickle.loads(raw_ext).get('data')[0]
    
    # Check driver 16
    d16_laps = laps_df[laps_df['Driver'] == '16'].copy().sort_values('Time')
    d16_app = app_data[app_data['Driver'] == '16'].copy().sort_values('Time')
    
    # Look at stint definitions: rows where Compound is not null
    stints = d16_app[d16_app['Compound'].notna()][['Time', 'Stint', 'Compound', 'New', 'StartLaps']]
    print("Stint starts for Driver 16:")
    print(stints)
    
    # In timing_app_data, forward fill Compound and Stint?
    d16_app['Compound_ffill'] = d16_app['Compound'].ffill()
    d16_app['Stint_ffill'] = d16_app['Stint'].ffill()
    
    # Rows where TotalLaps is updated
    laps_app = d16_app[d16_app['TotalLaps'].notna()][['Time', 'Stint_ffill', 'Compound_ffill', 'TotalLaps']]
    print("\nFirst 10 laps in timing_app_data for Driver 16:")
    print(laps_app.head(10))
    
    print("\nFirst 10 laps in laps_df for Driver 16:")
    print(d16_laps[['Time', 'NumberOfLaps', 'LapTime', 'PitInTime', 'PitOutTime']].head(10))
    
    # Try pd.merge_asof
    merged = pd.merge_asof(
        d16_laps,
        laps_app,
        on='Time',
        direction='nearest',
        tolerance=pd.Timedelta(seconds=15)
    )
    print("\nMerged sample (first 10):")
    print(merged[['Time', 'NumberOfLaps', 'LapTime', 'Compound_ffill', 'Stint_ffill', 'TotalLaps']].head(10))
    print("\nMerged sample around pit stop (laps 14-18):")
    print(merged[merged['NumberOfLaps'].between(14, 18)][['Time', 'NumberOfLaps', 'LapTime', 'Compound_ffill', 'Stint_ffill', 'TotalLaps']])
    print("\nMerged sample around pit stop 2 (laps 30-34):")
    print(merged[merged['NumberOfLaps'].between(30, 34)][['Time', 'NumberOfLaps', 'LapTime', 'Compound_ffill', 'Stint_ffill', 'TotalLaps']])
