import csv
import json
import sys

# Read from stdin
reader = csv.DictReader(sys.stdin)
rows = []
for row in reader:
    lat = float(row['Latitude'])
    lng = float(row['Longitude'])
    if lat == 0 and lng == 0:
        continue
    hi = row['Heat_Index_C']
    if not hi:
        continue
    rows.append({
        'dateTime': row['DateTime'],
        'temp': round(float(row['Temp_C']), 1),
        'humidity': round(float(row['Humidity_pct']), 1),
        'lat': round(lat, 5),
        'lng': round(lng, 5),
        'heatIndex': round(float(hi), 2),
        'riskLevel': row['HI_Risk_Level'],
    })

# Downsample: every 30th reading
step = 30
sampled = [{'id': f'hi-{i//step}', **rows[i]} for i in range(0, len(rows), step)]

print(f"Total GPS rows: {len(rows)}, Sampled: {len(sampled)}", file=sys.stderr)
print(json.dumps(sampled, indent=2))
