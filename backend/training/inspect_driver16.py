import zipfile
import pickle
import pandas as pd

ZIP_PATH = "data tread trace.zip"

with zipfile.ZipFile(ZIP_PATH, 'r') as z:
    prefix = "raw/fastf1_cache/2022/2022-03-20_Bahrain_Grand_Prix/2022-03-20_Race/"
    raw = z.read(prefix + "timing_app_data.ff1pkl")
    obj = pickle.loads(raw)
    data = obj.get('data', obj)
    
    # Check driver 16 (Leclerc)
    d16 = data[data['Driver'] == '16']
    print(f"Driver 16 timing_app_data rows: {len(d16)}")
    print(d16[['Time', 'LapNumber', 'Stint', 'TotalLaps', 'Compound', 'New', 'StartLaps', 'Outlap']].to_string())
