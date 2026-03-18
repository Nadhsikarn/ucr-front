import { NextResponse } from "next/server"
import { readFileSync, existsSync } from "fs"
import { join } from "path"

export const dynamic = "force-dynamic"

type HeatRow = {
  id: string
  dateTime: string
  temp: number
  humidity: number
  lat: number
  lng: number
  heatIndex: number
  riskLevel: string
}

let cachedData: HeatRow[] | null = null

function parseCSV(): HeatRow[] {
  if (cachedData) return cachedData

  const csvPath = join(process.cwd(), "public", "data", "heat_index_summary.csv")
  if (!existsSync(csvPath)) {
    throw new Error(`CSV not found at ${csvPath}`)
  }

  const raw = readFileSync(csvPath, "utf-8")
  const lines = raw.split("\n").filter(Boolean)

  const rows: Omit<HeatRow, "id">[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",")
    if (cols.length < 7) continue
    const lat = parseFloat(cols[3])
    const lng = parseFloat(cols[4])
    // Skip rows with zero coordinates
    if (lat === 0 && lng === 0) continue
    const hi = parseFloat(cols[5])
    if (isNaN(hi)) continue

    rows.push({
      dateTime: cols[0],
      temp: Math.round(parseFloat(cols[1]) * 10) / 10,
      humidity: Math.round(parseFloat(cols[2]) * 10) / 10,
      lat: Math.round(lat * 100000) / 100000,
      lng: Math.round(lng * 100000) / 100000,
      heatIndex: Math.round(hi * 100) / 100,
      riskLevel: cols[6]?.trim() || "",
    })
  }

  // Downsample: every 30th reading (~280 points from ~8400)
  const step = 30
  const sampled: HeatRow[] = []
  for (let i = 0; i < rows.length; i += step) {
    sampled.push({ id: `hi-${sampled.length}`, ...rows[i] })
  }

  cachedData = sampled
  return sampled
}

export async function GET() {
  try {
    const data = parseCSV()
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=3600" },
    })
  } catch (err) {
    console.error("[v0] Heat data API error:", err)
    return NextResponse.json(
      { error: "Failed to process CSV", detail: String(err) },
      { status: 500 }
    )
  }
}
