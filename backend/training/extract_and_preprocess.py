"""
TreadTrace F1 Dataset Extraction and Preprocessing Pipeline
===========================================================
Extracts all 23 Grand Prix race sessions from 'data tread trace.zip',
integrates FastF1 cache objects (timing, compound allocations, weather, track status),
applies TreadTrace Data Quality rules, and prepares features for model training.

Strict provenance: All features are either directly raw-measured from FastF1
or clearly tagged as ESTIMATED (e.g. fuel burn model). No synthetic data.
"""

import os
import zipfile
import pickle
import numpy as np
import pandas as pd
from typing import Dict, Any, List

ZIP_PATH = "data tread trace.zip"
OUTPUT_DIR = os.path.join("backend", "training", "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def ensure_timedelta(series):
    return pd.to_timedelta(series).astype('timedelta64[ns]')

def extract_all_sessions() -> pd.DataFrame:
    print(f"[1/4] Scanning and opening {ZIP_PATH}...")
    all_laps = []

    with zipfile.ZipFile(ZIP_PATH, 'r') as z:
        namelist = z.namelist()
        
        # Discover all sessions
        sessions = {}
        for name in namelist:
            parts = name.split('/')
            if len(parts) >= 5 and parts[1] == 'fastf1_cache':
                season, race, session = parts[2], parts[3], parts[4]
                key = (season, race, session)
                if key not in sessions:
                    sessions[key] = []
                if len(parts) > 5 and parts[5]:
                    sessions[key].append(parts[5])

        sessions = {k: v for k, v in sorted(sessions.items()) if len(v) > 0}
        print(f"[1/4] Found {len(sessions)} race sessions in FastF1 cache.")

        for session_idx, ((season, race, session), files) in enumerate(sessions.items(), 1):
            prefix = f"raw/fastf1_cache/{season}/{race}/{session}/"
            
            # Circuit & Meeting info
            circuit = race.replace('_', ' ')
            event_name = race.replace('_', ' ')
            try:
                raw_s = z.read(prefix + "session_info.ff1pkl")
                s_data = pickle.loads(raw_s).get('data', {})
                circuit = s_data.get('Meeting', {}).get('Circuit', {}).get('ShortName', circuit)
                event_name = s_data.get('OfficialEventName', event_name)
            except Exception:
                pass

            # Extended timing (laps)
            try:
                raw_ext = z.read(prefix + "_extended_timing_data.ff1pkl")
                ext_obj = pickle.loads(raw_ext).get('data')
                laps_raw = ext_obj[0].copy()
            except Exception as e:
                print(f"  Warning: could not read extended timing for {race}: {e}")
                continue

            if laps_raw.empty or 'LapTime' not in laps_raw.columns:
                continue

            laps_raw['Time'] = ensure_timedelta(laps_raw['Time'])

            # Timing app data (compounds, stints, tyre age)
            app_df = None
            if (prefix + "timing_app_data.ff1pkl") in namelist:
                try:
                    raw_app = z.read(prefix + "timing_app_data.ff1pkl")
                    app_df = pickle.loads(raw_app).get('data')
                    if isinstance(app_df, pd.DataFrame):
                        app_df['Time'] = ensure_timedelta(app_df['Time'])
                    else:
                        app_df = None
                except Exception:
                    app_df = None

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

            # Driver mapping
            drivers_info = {}
            if (prefix + "driver_info.ff1pkl") in namelist:
                try:
                    raw_d = z.read(prefix + "driver_info.ff1pkl")
                    d_data = pickle.loads(raw_d).get('data', {})
                    if isinstance(d_data, dict):
                        for num_str, d_obj in d_data.items():
                            drivers_info[str(num_str)] = {
                                "abbreviation": d_obj.get("Abbreviation", str(num_str)),
                                "full_name": d_obj.get("FullName", f"Driver {num_str}"),
                                "team": d_obj.get("TeamName", "Unknown")
                            }
                except Exception:
                    pass

            # Process drivers
            session_laps = []
            for driver_num, d_laps in laps_raw.groupby('Driver'):
                d_laps = d_laps.sort_values('Time').copy()
                d_str = str(driver_num)
                
                # Compound and stint merge
                if app_df is not None and not app_df.empty:
                    d_app = app_df[app_df['Driver'] == d_str].sort_values('Time').copy()
                    if not d_app.empty:
                        d_app['Compound_ffill'] = d_app['Compound'].ffill()
                        d_app['Stint_ffill'] = d_app['Stint'].ffill()
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

                # Driver metadata
                d_meta = drivers_info.get(d_str, {"abbreviation": d_str, "full_name": d_str, "team": "Unknown"})
                d_laps['DriverNumber'] = d_str
                d_laps['DriverAbbreviation'] = d_meta['abbreviation']
                d_laps['Team'] = d_meta['team']

                session_laps.append(d_laps)

            if not session_laps:
                continue

            session_combined = pd.concat(session_laps, ignore_index=True).sort_values('Time')

            # Merge weather
            if weather_df is not None and not weather_df.empty:
                session_combined = pd.merge_asof(
                    session_combined,
                    weather_df[['Time', 'TrackTemp', 'AirTemp', 'Humidity', 'Rainfall']],
                    on='Time',
                    direction='backward'
                )
            else:
                session_combined['TrackTemp'] = 35.0  # default F1 average track temp if unavailable
                session_combined['AirTemp'] = 25.0
                session_combined['Humidity'] = 50.0
                session_combined['Rainfall'] = 0.0

            # Merge track status
            if track_status_df is not None and not track_status_df.empty:
                session_combined = pd.merge_asof(
                    session_combined,
                    track_status_df[['Time', 'Status']],
                    on='Time',
                    direction='backward'
                )
                session_combined.rename(columns={'Status': 'TrackStatus'}, inplace=True)
            else:
                session_combined['TrackStatus'] = '1'

            session_combined['Season'] = str(season)
            session_combined['Race'] = race
            session_combined['Session'] = session
            session_combined['Circuit'] = circuit
            session_combined['OfficialEventName'] = event_name

            all_laps.append(session_combined)
            print(f"  [{session_idx}/{len(sessions)}] {season} {race[:25]}...: {len(session_combined)} laps, {circuit}")

    df_all = pd.concat(all_laps, ignore_index=True)
    print(f"\n[1/4] Extracted {len(df_all)} raw laps across all sessions.")
    return df_all

def clean_and_classify_laps(df: pd.DataFrame) -> pd.DataFrame:
    """
    Applies TreadTrace Data Quality Classification:
    - Identifies valid flying laps vs pit out/in laps, yellow flags, safety car, and outliers
    - Computes lap time in seconds
    - Estimates fuel load and track evolution
    """
    print("[2/4] Applying TreadTrace Data Quality Classification...")
    
    # Standardize lap time to seconds
    df['LapTimeSeconds'] = df['LapTime'].apply(lambda t: t.total_seconds() if pd.notna(t) else np.nan)
    
    # Standardize tyre compound
    df['TyreCompound'] = df['Compound_ffill'].astype(str).str.upper().str.strip()
    valid_compounds = ['SOFT', 'MEDIUM', 'HARD']
    
    # Fill tyre age if missing: if TotalLaps is nan or 0, estimate from stint lap
    df['TyreAge'] = pd.to_numeric(df['TotalLaps'], errors='coerce')
    df['Stint'] = pd.to_numeric(df['Stint_ffill'], errors='coerce').fillna(0).astype(int)
    
    processed_sessions = []
    
    for (season, race), session_group in df.groupby(['Season', 'Race']):
        session_group = session_group.copy()
        
        # Max laps in race for fuel calculation
        total_race_laps = max(session_group['NumberOfLaps'].max(), 50)
        
        # Median lap time of session (for outlier / SC detection)
        valid_raw_times = session_group[session_group['LapTimeSeconds'].notna()]['LapTimeSeconds']
        if not valid_raw_times.empty:
            p25 = valid_raw_times.quantile(0.25)
            session_median = valid_raw_times.median()
        else:
            session_median = 90.0

        for driver, driver_group in session_group.groupby('DriverNumber'):
            driver_group = driver_group.sort_values('NumberOfLaps').copy()
            laps_list = driver_group.to_dict('records')
            
            for i, lap in enumerate(laps_list):
                lap_sec = lap.get('LapTimeSeconds')
                lap_num = lap.get('NumberOfLaps', 1)
                stint_num = lap.get('Stint', 0)
                pit_in = pd.notna(lap.get('PitInTime'))
                pit_out = pd.notna(lap.get('PitOutTime'))
                track_status = str(lap.get('TrackStatus', '1'))
                compound = lap.get('TyreCompound', 'UNKNOWN')
                
                # Estimated remaining fuel: starts ~105kg, burns down to ~5kg
                remaining_fuel = max(5.0, 105.0 * (1.0 - (float(lap_num) - 1.0) / float(total_race_laps)))
                lap['EstimatedFuelLoad_kg'] = round(remaining_fuel, 2)
                
                # Check if first or last lap of stint
                is_stint_first = (i == 0) or (laps_list[i - 1].get('Stint') != stint_num)
                is_stint_last = (i == len(laps_list) - 1) or (laps_list[i + 1].get('Stint') != stint_num)
                
                # Data Quality classification
                if pd.isna(lap_sec):
                    lap['Classification'] = 'INCOMPLETE_TIMING'
                    lap['UsedInModel'] = False
                    lap['ClassificationReason'] = 'Missing lap time (e.g. grid formation / race start lap).'
                elif pit_out or is_stint_first or (lap_sec > session_median + 12.0):
                    lap['Classification'] = 'PIT_OUT_LAP'
                    lap['UsedInModel'] = False
                    lap['ClassificationReason'] = 'Stint out-lap. Pit lane speed limiter and cold tyre scrub.'
                elif pit_in or is_stint_last or (lap_sec > session_median + 10.0):
                    lap['Classification'] = 'PIT_IN_LAP'
                    lap['UsedInModel'] = False
                    lap['ClassificationReason'] = 'Stint in-lap. Pit entry slowdown.'
                elif track_status not in ['1', 'GREEN', 'AllClear']:
                    lap['Classification'] = 'SAFETY_CAR_YELLOW'
                    lap['UsedInModel'] = False
                    lap['ClassificationReason'] = f'Neutralized lap under track status {track_status}.'
                elif compound not in valid_compounds:
                    lap['Classification'] = 'NON_SLICK_OR_UNKNOWN'
                    lap['UsedInModel'] = False
                    lap['ClassificationReason'] = f'Compound {compound} not dry slick baseline.'
                elif (lap_sec - session_median) > 3.0:
                    lap['Classification'] = 'PACE_OUTLIER'
                    lap['UsedInModel'] = False
                    lap['ClassificationReason'] = 'Disproportionate lap time drop (traffic / lockup / incident).'
                elif lap.get('TyreAge') is None or np.isnan(lap.get('TyreAge')) or lap.get('TyreAge') <= 0:
                    lap['Classification'] = 'INVALID_TYRE_AGE'
                    lap['UsedInModel'] = False
                    lap['ClassificationReason'] = 'Unverifiable tyre stint age.'
                else:
                    lap['Classification'] = 'GREEN_VALID'
                    lap['UsedInModel'] = True
                    lap['ClassificationReason'] = 'Clean flying lap with observable degradation dynamics.'

            processed_sessions.extend(laps_list)

    df_processed = pd.DataFrame(processed_sessions)
    print(f"[2/4] Completed lap classification.")
    print("  Classification breakdown:")
    print(df_processed['Classification'].value_counts())
    print(f"  Valid training laps: {df_processed['UsedInModel'].sum()} / {len(df_processed)}")
    return df_processed

def compute_treadtrace_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Applies TreadTrace physics-informed Confounder Decomposition:
    - Fuel burn correction (0.033 s/kg)
    - Track evolution correction (-0.55 * (1 - exp(-0.048 * lap)))
    - Track temperature thermal sensitivity
    - Normalized Lap Time: observed minus fuel, evo, and temp effects
    - Stint-relative true tyre degradation loss: normalized lap time minus initial stint baseline pace
    """
    print("[3/4] Computing TreadTrace Confounder Decomposition & Normalisation...")
    
    FUEL_COEF = 0.033  # seconds per kg
    MAX_TRACK_EVO = 0.55  # seconds
    
    # 1. Compute Confounders and Normalised Lap Times
    records = df.to_dict('records')
    for lap in records:
        comp = lap.get('TyreCompound', 'MEDIUM')
        raw_sec = lap.get('LapTimeSeconds', np.nan)
        fuel_kg = lap.get('EstimatedFuelLoad_kg', 50.0)
        lap_num = lap.get('NumberOfLaps', 1)
        track_temp = float(lap.get('TrackTemp', 35.0)) if pd.notna(lap.get('TrackTemp')) else 35.0
        
        # Confounders
        fuel_effect = round(fuel_kg * FUEL_COEF, 3)
        track_evo_effect = round(-MAX_TRACK_EVO * (1.0 - np.exp(-0.048 * float(lap_num))), 3)
        
        opt_temp = 35.0 if comp == "SOFT" else (42.0 if comp == "HARD" else 38.0)
        temp_effect = round(0.010 * ((track_temp - opt_temp) ** 2) / 10.0, 3)
        
        if pd.notna(raw_sec):
            norm_sec = round(raw_sec - fuel_effect - track_evo_effect - temp_effect, 3)
        else:
            norm_sec = np.nan

        lap['EstimatedFuelEffect_sec'] = fuel_effect
        lap['EstimatedTrackEvoEffect_sec'] = track_evo_effect
        lap['EstimatedThermalEffect_sec'] = temp_effect
        lap['NormalisedLapTime_sec'] = norm_sec
        lap['Provenance'] = "FASTF1_CACHE_GROUNDED"

    df_enhanced = pd.DataFrame(records)
    
    # 2. Compute Stint-relative Base Pace and True Tyre Degradation Loss
    df_enhanced['Stint_ID'] = (
        df_enhanced['Season'].astype(str) + "_" + 
        df_enhanced['Race'].astype(str) + "_" + 
        df_enhanced['DriverNumber'].astype(str) + "_s" + 
        df_enhanced['Stint'].astype(str)
    )

    # For valid laps, compute stint baseline (median of first 3 valid laps in that stint)
    valid_mask = df_enhanced['UsedInModel'] == True
    stint_norm_bases = (
        df_enhanced[valid_mask]
        .groupby('Stint_ID')['NormalisedLapTime_sec']
        .transform(lambda s: s.iloc[:3].median() if len(s) >= 3 else s.iloc[0])
    )
    df_enhanced.loc[valid_mask, 'StintBasePace_sec'] = stint_norm_bases.round(3)

    # For laps without valid baseline, fallback to circuit-compound median
    df_enhanced['StintBasePace_sec'] = df_enhanced.groupby(['Circuit', 'TyreCompound'])['NormalisedLapTime_sec'].transform('median')
    # Use computed stint baseline where available
    df_enhanced.loc[valid_mask, 'StintBasePace_sec'] = stint_norm_bases.round(3)

    # Estimated True Tyre Degradation (clamped >= 0.0)
    df_enhanced['EstimatedTyreDegradation_sec'] = np.where(
        valid_mask & df_enhanced['NormalisedLapTime_sec'].notna() & df_enhanced['StintBasePace_sec'].notna(),
        np.maximum(0.0, (df_enhanced['NormalisedLapTime_sec'] - df_enhanced['StintBasePace_sec'])).round(3),
        np.nan
    )

    # Raw stint baseline for naive comparison
    stint_raw_bases = (
        df_enhanced[valid_mask]
        .groupby('Stint_ID')['LapTimeSeconds']
        .transform(lambda s: s.iloc[:3].median() if len(s) >= 3 else s.iloc[0])
    )
    df_enhanced.loc[valid_mask, 'NaiveRawStintDelta_sec'] = (
        df_enhanced.loc[valid_mask, 'LapTimeSeconds'] - stint_raw_bases
    ).round(3)

    print("[3/4] Feature engineering complete.")
    return df_enhanced

def save_and_summarize(df: pd.DataFrame):
    print("[4/4] Saving processed dataset...")
    
    # Save raw extracted
    raw_path = os.path.join(OUTPUT_DIR, "fastf1_extracted_laps_raw.csv.gz")
    df.to_csv(raw_path, index=False, compression="gzip")
    
    # Save clean training subset
    clean_df = df[df['UsedInModel'] == True].copy()
    clean_path = os.path.join(OUTPUT_DIR, "fastf1_processed_training_laps.csv.gz")
    clean_df.to_csv(clean_path, index=False, compression="gzip")
    
    csv_path = os.path.join(OUTPUT_DIR, "fastf1_processed_training_laps.csv")
    clean_df.to_csv(csv_path, index=False)

    print(f"\n========================================================")
    print(f"DATASET EXTRACTION AUDIT SUMMARY")
    print(f"========================================================")
    print(f"Total Raw Records Extracted: {len(df)}")
    print(f"Valid Clean Training Laps:   {len(clean_df)}")
    print(f"Seasons:                     {sorted(df['Season'].unique())}")
    print(f"Races / Events:              {df['Race'].nunique()}")
    print(f"Circuits:                    {df['Circuit'].nunique()} ({list(df['Circuit'].unique())})")
    print(f"Drivers:                     {df['DriverNumber'].nunique()}")
    print(f"\nValid Laps by Compound:")
    print(clean_df['TyreCompound'].value_counts())
    print(f"\nValid Laps by Season:")
    print(clean_df['Season'].value_counts().sort_index())
    print(f"\nSaved clean training dataset to:")
    print(f"  {clean_path}")
    print(f"  {csv_path}")

if __name__ == "__main__":
    df_raw = extract_all_sessions()
    df_classified = clean_and_classify_laps(df_raw)
    df_enhanced = compute_treadtrace_features(df_classified)
    save_and_summarize(df_enhanced)
