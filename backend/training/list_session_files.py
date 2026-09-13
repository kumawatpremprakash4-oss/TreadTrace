import zipfile
import pickle

ZIP_PATH = "data tread trace.zip"

with zipfile.ZipFile(ZIP_PATH, 'r') as z:
    prefix = "raw/fastf1_cache/2022/2022-03-20_Bahrain_Grand_Prix/2022-03-20_Race/"
    files = [name for name in z.namelist() if name.startswith(prefix)]
    print("Files in session:")
    for f in sorted(files):
        print(" ", f[len(prefix):])
