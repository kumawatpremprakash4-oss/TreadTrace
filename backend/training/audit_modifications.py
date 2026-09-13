import os
import time

def check_dirs(dirs):
    recent_files = []
    threshold = time.time() - 3600 * 2  # modified in last 2 hours
    for d in dirs:
        for root, _, files in os.walk(d):
            for f in files:
                path = os.path.join(root, f)
                try:
                    mtime = os.path.getmtime(path)
                    if mtime > threshold:
                        recent_files.append((path, mtime))
                except Exception:
                    pass
    return sorted(recent_files, key=lambda x: x[1])

app_dirs = ["frontend", "backend/app"]
touched = check_dirs(app_dirs)
print("Files modified in frontend/ and backend/app/ in the last 2 hours:")
if not touched:
    print("  NONE! Zero application files were touched.")
else:
    for p, t in touched:
        print(f"  {p}")

print("\nFiles in backend/training/, models/, reports/:")
training_dirs = ["backend/training", "models", "reports"]
training_files = check_dirs(training_dirs)
for p, t in training_files:
    print(f"  {p}")
