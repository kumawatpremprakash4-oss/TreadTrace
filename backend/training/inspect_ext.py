import zipfile
import pickle

ZIP_PATH = "data tread trace.zip"

with zipfile.ZipFile(ZIP_PATH, 'r') as z:
    prefix = "raw/fastf1_cache/2022/2022-03-20_Bahrain_Grand_Prix/2022-03-20_Race/"
    raw_ext = z.read(prefix + "_extended_timing_data.ff1pkl")
    ext_obj = pickle.loads(raw_ext)
    data = ext_obj.get('data', ext_obj)
    print(f"Type: {type(data)}")
    if isinstance(data, (tuple, list)):
        for idx, item in enumerate(data):
            print(f"\nItem {idx}:")
            print(f"  Type: {type(item)}")
            if hasattr(item, 'shape'):
                print(f"  Shape: {item.shape}")
                print(f"  Columns: {item.columns.tolist() if hasattr(item, 'columns') else ''}")
                print(f"  Head:\n{item.head(2)}")
            elif hasattr(item, '__len__'):
                print(f"  Len: {len(item)}")
