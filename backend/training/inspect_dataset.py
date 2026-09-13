"""
Inspects the FastF1 cache dataset inside 'data tread trace.zip'.
Extracts session metadata, timing data structures, lap times, compounds, and weather data.
"""

import zipfile
import pickle
import os
import pandas as pd

ZIP_PATH = "data tread trace.zip"

def inspect():
    if not os.path.exists(ZIP_PATH):
        print(f"Error: {ZIP_PATH} not found.")
        return

    with zipfile.ZipFile(ZIP_PATH, 'r') as z:
        namelist = z.namelist()
        print(f"Total entries in zip: {len(namelist)}")

        # Find all race sessions
        sessions = {}
        for name in namelist:
            parts = name.split('/')
            if len(parts) >= 5 and parts[1] == 'fastf1_cache':
                season = parts[2]
                race = parts[3]
                session = parts[4]
                key = (season, race, session)
                if key not in sessions:
                    sessions[key] = []
                if len(parts) > 5 and parts[5]:
                    sessions[key].append(parts[5])

        # Filter out directory keys that have no files
        sessions = {k: v for k, v in sessions.items() if len(v) > 0}

        print(f"\nFound {len(sessions)} unique race sessions:")
        for (season, race, session), files in sorted(sessions.items()):
            print(f"  {season} | {race} | {session} ({len(files)} files)")

        # Inspect first session in detail
        first_key = sorted(sessions.items())[0][0]
        season, race, session = first_key
        prefix = f"raw/fastf1_cache/{season}/{race}/{session}/"
        print(f"\n--- Inspecting First Session: {season} {race} {session} ---")

        # Session info
        try:
            raw = z.read(prefix + "session_info.ff1pkl")
            s_info = pickle.loads(raw)
            data = s_info.get('data', s_info)
            print("Session Info Keys:", list(data.keys()) if isinstance(data, dict) else type(data))
            if isinstance(data, dict):
                for k in ['Meeting', 'Name', 'Type', 'StartDate', 'EndDate', 'OfficialEventName']:
                    if k in data:
                        print(f"  {k}: {data[k]}")
        except Exception as e:
            print(f"Error reading session_info: {e}")

        # Timing app data
        try:
            raw = z.read(prefix + "timing_app_data.ff1pkl")
            obj = pickle.loads(raw)
            data = obj.get('data', obj)
            print("\nTiming App Data:")
            print(f"  Type: {type(data)}")
            if isinstance(data, pd.DataFrame):
                print(f"  Shape: {data.shape}")
                print(f"  Columns: {data.columns.tolist()}")
                print("  Sample rows:")
                print(data.head(3))
        except Exception as e:
            print(f"Error reading timing_app_data: {e}")

        # Extended timing data
        try:
            raw = z.read(prefix + "_extended_timing_data.ff1pkl")
            obj = pickle.loads(raw)
            data = obj.get('data', obj)
            print("\nExtended Timing Data:")
            print(f"  Type: {type(data)}, Length: {len(data)}")
            if isinstance(data, (tuple, list)):
                for idx, item in enumerate(data):
                    print(f"  Item {idx}: type={type(item)}, shape/len={getattr(item, 'shape', len(item) if hasattr(item, '__len__') else 'N/A')}")
                    if isinstance(item, pd.DataFrame):
                        print(f"    Columns: {item.columns.tolist()[:15]}")
                        print(item.head(2))
        except Exception as e:
            print(f"Error reading _extended_timing_data: {e}")

        # Weather data
        try:
            raw = z.read(prefix + "weather_data.ff1pkl")
            obj = pickle.loads(raw)
            data = obj.get('data', obj)
            print("\nWeather Data:")
            print(f"  Type: {type(data)}")
            if isinstance(data, dict):
                print(f"  Keys: {list(data.keys())}")
                if 'AirTemp' in data:
                    print(f"  Sample AirTemp: {list(data['AirTemp'].items())[:3] if isinstance(data['AirTemp'], dict) else data['AirTemp'][:3]}")
                if 'TrackTemp' in data:
                    print(f"  Sample TrackTemp: {list(data['TrackTemp'].items())[:3] if isinstance(data['TrackTemp'], dict) else data['TrackTemp'][:3]}")
        except Exception as e:
            print(f"Error reading weather_data: {e}")

        # Track status data
        try:
            raw = z.read(prefix + "track_status_data.ff1pkl")
            obj = pickle.loads(raw)
            data = obj.get('data', obj)
            print("\nTrack Status Data:")
            print(f"  Type: {type(data)}")
            if isinstance(data, dict):
                print(f"  Keys: {list(data.keys())}")
                print(f"  Sample: {data}")
        except Exception as e:
            print(f"Error reading track_status_data: {e}")

if __name__ == "__main__":
    inspect()
