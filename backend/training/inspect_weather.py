import zipfile
import pickle
import pandas as pd

ZIP_PATH = "data tread trace.zip"

with zipfile.ZipFile(ZIP_PATH, 'r') as z:
    prefix = "raw/fastf1_cache/2022/2022-03-20_Bahrain_Grand_Prix/2022-03-20_Race/"
    
    # Weather data
    raw_w = z.read(prefix + "weather_data.ff1pkl")
    w_data = pickle.loads(raw_w).get('data')
    print("Weather data type:", type(w_data))
    if isinstance(w_data, pd.DataFrame):
        print("Weather df columns:", w_data.columns.tolist())
        print(w_data.head(3))
    elif isinstance(w_data, dict):
        print("Weather dict keys:", list(w_data.keys()))
        for k in ['Time', 'AirTemp', 'TrackTemp', 'Humidity', 'Rainfall']:
            if k in w_data:
                val = w_data[k]
                print(f"  {k}: type={type(val)}, len={len(val)}")
        w_df = pd.DataFrame(w_data)
        print("Weather df from dict:")
        print(w_df.head(3))
        
    # Track status data
    raw_ts = z.read(prefix + "track_status_data.ff1pkl")
    ts_data = pickle.loads(raw_ts).get('data')
    print("\nTrack status data type:", type(ts_data))
    if isinstance(ts_data, pd.DataFrame):
        print("Track status columns:", ts_data.columns.tolist())
        print(ts_data.head(5))
    elif isinstance(ts_data, dict):
        print("Track status dict keys:", list(ts_data.keys()))
        ts_df = pd.DataFrame(ts_data)
        print("Track status df:")
        print(ts_df.head(10))
