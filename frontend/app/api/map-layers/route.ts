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
    const result = await pool.query(
      "SELECT layer_key as id, name, group_name as group, enabled, description FROM map_layers ORDER BY group_name"
    )
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error("[map-layers] DB error:", err)
    return NextResponse.json(
      { error: "Failed to fetch map layers" },
      { status: 500 }
    )
  }
}