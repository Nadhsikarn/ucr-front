import { readFileSync, writeFileSync } from 'fs';

import { mkdirSync } from 'fs';
mkdirSync('/vercel/share/v0-project/public/data', { recursive: true });
const raw = readFileSync('/vercel/share/v0-project/user_read_only_context/text_attachments/heat_index_summary(1)-v70eM.csv', 'utf-8');
const lines = raw.trim().split('\n');
const header = lines[0].split(',');
console.log('[v0] CSV header:', header);

// Parse rows with non-zero lat/lng and valid heat index
const rows = [];
for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split(',');
  const lat = parseFloat(cols[3]);
  const lng = parseFloat(cols[4]);
  if (lat === 0 && lng === 0) continue;
  const heatIndex = parseFloat(cols[5]);
  if (isNaN(heatIndex)) continue;
  rows.push({
    dateTime: cols[0],
    temp: parseFloat(cols[1]),
    humidity: parseFloat(cols[2]),
    lat,
    lng,
    heatIndex,
    riskLevel: cols[6],
  });
}

console.log(`[v0] Total rows with GPS: ${rows.length}`);
console.log(`[v0] Lat range: ${Math.min(...rows.map(r => r.lat)).toFixed(5)} - ${Math.max(...rows.map(r => r.lat)).toFixed(5)}`);
console.log(`[v0] Lng range: ${Math.min(...rows.map(r => r.lng)).toFixed(5)} - ${Math.max(...rows.map(r => r.lng)).toFixed(5)}`);
console.log(`[v0] Heat Index range: ${Math.min(...rows.map(r => r.heatIndex)).toFixed(2)} - ${Math.max(...rows.map(r => r.heatIndex)).toFixed(2)}`);
console.log(`[v0] Temp range: ${Math.min(...rows.map(r => r.temp)).toFixed(1)} - ${Math.max(...rows.map(r => r.temp)).toFixed(1)}`);

// Get unique risk levels
const riskLevels = [...new Set(rows.map(r => r.riskLevel))];
console.log('[v0] Risk levels:', riskLevels);

// Downsample: take every 30th reading (one per ~30 seconds) to get ~280 points
const step = 30;
const sampled = [];
for (let i = 0; i < rows.length; i += step) {
  const r = rows[i];
  sampled.push({
    id: `hi-${sampled.length}`,
    dateTime: r.dateTime,
    lat: Math.round(r.lat * 10000000) / 10000000,
    lng: Math.round(r.lng * 10000000) / 10000000,
    temp: r.temp,
    humidity: r.humidity,
    heatIndex: Math.round(r.heatIndex * 100) / 100,
    riskLevel: r.riskLevel,
  });
}

console.log(`[v0] Sampled points: ${sampled.length}`);

// Write to public JSON so it can be fetched client-side
writeFileSync('/vercel/share/v0-project/public/data/heat-index-readings.json', JSON.stringify(sampled, null, 2));
console.log('[v0] Written to public/data/heat-index-readings.json');
