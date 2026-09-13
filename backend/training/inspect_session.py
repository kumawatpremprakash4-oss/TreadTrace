import zipfile
import pickle

ZIP_PATH = "data tread trace.zip"

with zipfile.ZipFile(ZIP_PATH, 'r') as z:
    prefix = "raw/fastf1_cache/2022/2022-03-20_Bahrain_Grand_Prix/2022-03-20_Race/"
    
    # Driver info
    raw_d = z.read(prefix + "driver_info.ff1pkl")
    d_data = pickle.loads(raw_d).get('data')
    print("Driver info:")
    for k, v in list(d_data.items())[:5]:
        print(f"  Driver {k}: {v.get('Abbreviation', '')} - {v.get('FullName', '')} ({v.get('TeamName', '')})")
        
    # Session info
    raw_s = z.read(prefix + "session_info.ff1pkl")
    s_data = pickle.loads(raw_s).get('data')
    print("\nSession info:")
    meeting = s_data.get('Meeting', {})
    print("  Circuit:", meeting.get('Circuit', {}).get('ShortName', ''))
    print("  Country:", meeting.get('Country', {}).get('Name', ''))
    print("  OfficialEventName:", s_data.get('OfficialEventName', ''))
