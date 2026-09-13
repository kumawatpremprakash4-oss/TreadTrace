import zipfile
import pickle
import os
import pandas as pd

ZIP_PATH = "data tread trace.zip"

def scan():
    with zipfile.ZipFile(ZIP_PATH, 'r') as z:
        namelist = z.namelist()
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

        sessions = {k: v for k, v in sessions.items() if len(v) > 0}
        print(f"Total sessions: {len(sessions)}\n")
        
        session_summary = []
        for (season, race, session), files in sorted(sessions.items()):
            prefix = f"raw/fastf1_cache/{season}/{race}/{session}/"
            
            # Read session info
            circuit = "Unknown"
            try:
                raw_s = z.read(prefix + "session_info.ff1pkl")
                s_data = pickle.loads(raw_s).get('data', {})
                circuit = s_data.get('Meeting', {}).get('Circuit', {}).get('ShortName', race.replace('_', ' '))
            except Exception:
                circuit = race.replace('_', ' ')
            
            # Read laps
            num_laps = 0
            drivers = 0
            try:
                raw_ext = z.read(prefix + "_extended_timing_data.ff1pkl")
                ext_data = pickle.loads(raw_ext).get('data')
                laps_df = ext_data[0]
                num_laps = len(laps_df)
                drivers = laps_df['Driver'].nunique()
            except Exception as e:
                pass
            
            # Read timing_app (compounds)
            compounds = []
            try:
                raw_app = z.read(prefix + "timing_app_data.ff1pkl")
                app_data = pickle.loads(raw_app).get('data')
                if isinstance(app_data, pd.DataFrame) and 'Compound' in app_data.columns:
                    compounds = app_data['Compound'].dropna().unique().tolist()
            except Exception:
                pass
                
            session_summary.append({
                "season": season,
                "race": race,
                "session": session,
                "circuit": circuit,
                "drivers": drivers,
                "total_laps": num_laps,
                "compounds": [c for c in compounds if c not in [None, 'UNKNOWN']],
                "has_weather": (prefix + "weather_data.ff1pkl") in namelist,
                "has_track_status": (prefix + "track_status_data.ff1pkl") in namelist,
            })
            
        df_summary = pd.DataFrame(session_summary)
        print(df_summary.to_string())
        print("\nTotal laps across all sessions:", df_summary['total_laps'].sum())
        print("Total unique circuits:", df_summary['circuit'].nunique())
        print("Seasons present:", df_summary['season'].unique().tolist())

if __name__ == "__main__":
    scan()
