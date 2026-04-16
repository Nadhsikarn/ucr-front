import { NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        e.*,
        array_agg(DISTINCT z.name) as zones,
        array_agg(DISTINCT t.theme) as themes
      FROM climate_events e
      LEFT JOIN climate_event_zones cez ON e.id = cez.climate_event_id
      LEFT JOIN zones z ON cez.zone_id = z.id
      LEFT JOIN climate_event_themes t ON e.id = t.climate_event_id
      GROUP BY e.id
      ORDER BY e.event_date DESC
    `)
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error("[climate-events] DB error:", err)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}