import zipfile
import pickle
import pandas as pd
import numpy as np

ZIP_PATH = "data tread trace.zip"

def ensure_timedelta(series):
    return pd.to_timedelta(series).astype('timedelta64[ns]')

def extract_session_laps(z, season, race, session):
    prefix = f"raw/fastf1_cache/{season}/{race}/{session}/"
    namelist = z.namelist()
    
    # Session info
    circuit = race.replace('_', ' ')
    try:
        raw_s = z.read(prefix + "session_info.ff1pkl")
        s_data = pickle.loads(raw_s).get('data', {})
        circuit = s_data.get('Meeting', {}).get('Circuit', {}).get('ShortName', circuit)
    except Exception:
        pass

    # Extended timing data (laps)
    try:
        raw_ext = z.read(prefix + "_extended_timing_data.ff1pkl")
        laps_raw = pickle.loads(raw_ext).get('data')[0].copy()
    except Exception as e:
        print(f"Error reading extended timing for {race}: {e}")
        return pd.DataFrame()

    if laps_raw.empty or 'LapTime' not in laps_raw.columns:
        return pd.DataFrame()

    laps_raw['Time'] = ensure_timedelta(laps_raw['Time'])

    # Timing app data (compounds, stints, tyre age)
    app_df = None
    try:
        raw_app = z.read(prefix + "timing_app_data.ff1pkl")
        app_df = pickle.loads(raw_app).get('data')
        if not isinstance(app_df, pd.DataFrame):
            app_df = None
        else:
            app_df['Time'] = ensure_timedelta(app_df['Time'])
    except Exception:
        pass

    # Weather data
    weather_df = None
    if (prefix + "weather_data.ff1pkl") in namelist:
        try:
            raw_w = z.read(prefix + "weather_data.ff1pkl")
            w_dict = pickle.loads(raw_w).get('data', {})
            if isinstance(w_dict, dict) and 'Time' in w_dict and 'TrackTemp' in w_dict:
                weather_df = pd.DataFrame(w_dict)
                weather_df['Time'] = ensure_timedelta(weather_df['Time'])
                weather_df = weather_df.sort_values('Time')
        except Exception:
            pass

    # Track status data
    track_status_df = None
    if (prefix + "track_status_data.ff1pkl") in namelist:
        try:
            raw_ts = z.read(prefix + "track_status_data.ff1pkl")
            ts_dict = pickle.loads(raw_ts).get('data', {})
            if isinstance(ts_dict, dict) and 'Time' in ts_dict and 'Status' in ts_dict:
                track_status_df = pd.DataFrame(ts_dict)
                track_status_df['Time'] = ensure_timedelta(track_status_df['Time'])
                track_status_df = track_status_df.sort_values('Time')
        except Exception:
            pass

    # Process driver by driver
    all_driver_laps = []
    
    for driver, d_laps in laps_raw.groupby('Driver'):
        d_laps = d_laps.sort_values('Time').copy()
        
        # Merge compound / stint if app_df available
        if app_df is not None and not app_df.empty:
            d_app = app_df[app_df['Driver'] == str(driver)].sort_values('Time').copy()
            if not d_app.empty:
                # Forward fill compound and stint
                d_app['Compound_ffill'] = d_app['Compound'].ffill()
                d_app['Stint_ffill'] = d_app['Stint'].ffill()
                # Rows with TotalLaps
                d_app_laps = d_app[d_app['TotalLaps'].notna()][['Time', 'Compound_ffill', 'Stint_ffill', 'TotalLaps']].copy()
                if not d_app_laps.empty:
                    d_laps = pd.merge_asof(
                        d_laps,
                        d_app_laps,
                        on='Time',
                        direction='nearest',
                        tolerance=pd.Timedelta(seconds=20)
                    )
                else:
                    d_laps['Compound_ffill'] = np.nan
                    d_laps['Stint_ffill'] = np.nan
                    d_laps['TotalLaps'] = np.nan
            else:
                d_laps['Compound_ffill'] = np.nan
                d_laps['Stint_ffill'] = np.nan
                d_laps['TotalLaps'] = np.nan
        else:
            d_laps['Compound_ffill'] = np.nan
            d_laps['Stint_ffill'] = np.nan
            d_laps['TotalLaps'] = np.nan

        all_driver_laps.append(d_laps)

    if not all_driver_laps:
        return pd.DataFrame()

    combined = pd.concat(all_driver_laps, ignore_index=True)
    combined = combined.sort_values('Time')

    # Merge weather
    if weather_df is not None and not weather_df.empty:
        combined = pd.merge_asof(
            combined,
            weather_df[['Time', 'TrackTemp', 'AirTemp', 'Humidity', 'Rainfall']],
            on='Time',
            direction='backward'
        )
    else:
        combined['TrackTemp'] = np.nan
        combined['AirTemp'] = np.nan
        combined['Humidity'] = np.nan
        combined['Rainfall'] = np.nan

    # Merge track status
    if track_status_df is not None and not track_status_df.empty:
        combined = pd.merge_asof(
            combined,
            track_status_df[['Time', 'Status']],
            on='Time',
            direction='backward'
        )
        combined.rename(columns={'Status': 'TrackStatus'}, inplace=True)
    else:
        combined['TrackStatus'] = '1'

    # Add metadata
    combined['Season'] = season
    combined['Race'] = race
    combined['Session'] = session
    combined['Circuit'] = circuit

    return combined

with zipfile.ZipFile(ZIP_PATH, 'r') as z:
    df_sample = extract_session_laps(z, "2022", "2022-03-20_Bahrain_Grand_Prix", "2022-03-20_Race")
    print("Sample extracted shape:", df_sample.shape)
    print("Sample columns:", df_sample.columns.tolist())
    print("\nNon-null counts:")
    print(df_sample[['NumberOfLaps', 'LapTime', 'Compound_ffill', 'TotalLaps', 'TrackTemp', 'TrackStatus']].notna().sum())
    print("\nSample records:")
    print(df_sample[['Driver', 'NumberOfLaps', 'LapTime', 'Compound_ffill', 'TotalLaps', 'TrackTemp', 'TrackStatus']].head(10))
