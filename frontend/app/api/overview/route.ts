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
    const [stats, signals, community, events] = await Promise.all([
      pool.query("SELECT * FROM survey_stats ORDER BY last_updated DESC LIMIT 1"),
      pool.query("SELECT * FROM climate_signals ORDER BY recorded_at DESC LIMIT 1"),
      pool.query("SELECT * FROM community_inputs ORDER BY recorded_at DESC LIMIT 1"),
      pool.query(`
        SELECT e.*, 
          array_agg(DISTINCT z.name) as zones
        FROM climate_events e
        LEFT JOIN climate_event_zones cez ON e.id = cez.climate_event_id
        LEFT JOIN zones z ON cez.zone_id = z.id
        GROUP BY e.id
        ORDER BY e.event_date DESC
        LIMIT 3
      `),
    ])

    return NextResponse.json({
      surveyStats: stats.rows[0],
      climateSignals: signals.rows[0],
      communityInputs: community.rows[0],
      climateEvents: events.rows,
    })
  } catch (err) {
    console.error("[overview] DB error:", err)
    return NextResponse.json({ error: "Failed to fetch overview data" }, { status: 500 })
  }
}