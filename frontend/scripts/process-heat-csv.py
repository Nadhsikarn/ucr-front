import csv
import json
import os
import glob

# Find the CSV
csv_path = '/vercel/share/v0-project/scripts/heat_index_summary.csv'
if not os.path.exists(csv_path):
    # Search for it
    candidates = glob.glob('/vercel/**/heat_index_summary.csv', recursive=True)
    if candidates:
        csv_path = candidates[0]
    else:
        # Try CWD
        csv_path = 'heat_index_summary.csv'

print(f"CWD: {os.getcwd()}")
print(f"Reading from: {csv_path}")
print(f"File exists: {os.path.exists(csv_path)}")

rows = []
with open(csv_path, 'r') as f:
    reader = csv.DictReader(f)
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
            'lat': round(lat, 7),
            'lng': round(lng, 7),
            'heatIndex': round(float(hi), 2),
            'riskLevel': row['HI_Risk_Level'],
        })

print(f"Total rows with GPS: {len(rows)}")
if rows:
    temps = [r['temp'] for r in rows]
    his = [r['heatIndex'] for r in rows]
    print(f"Time range: {rows[0]['dateTime']} to {rows[-1]['dateTime']}")
    print(f"Temp range: {min(temps):.1f} - {max(temps):.1f}")
    print(f"Heat Index range: {min(his):.2f} - {max(his):.2f}")
    print(f"Risk levels: {list(set(r['riskLevel'] for r in rows))}")

# Downsample: take every 30th reading (~280 points)
step = 30
sampled = []
for i in range(0, len(rows), step):
    r = rows[i]
    sampled.append({
        'id': f'hi-{len(sampled)}',
        **r
    })

print(f"Sampled points: {len(sampled)}")

# Write output
out_path = '/vercel/share/v0-project/public/data/heat-index-readings.json'
with open(out_path, 'w') as f:
    json.dump(sampled, f, indent=2)

print(f"Written to {out_path}")
