import { NextResponse } from "next/server"
import { readFileSync } from "fs"
import { join } from "path"

export const dynamic = "force-dynamic"

function calcHeatRisk(svf: number, shade: number): string {
  const score = svf - shade
  if (score > 0.7) return "extreme"
  if (score > 0.5) return "high"
  if (score > 0.3) return "moderate"
  return "low"
}

function transformFeatures(features: any[]) {
  return features.map((f: any) => {
    const morph  = typeof f.properties.urban_morphology === "string"
      ? JSON.parse(f.properties.urban_morphology) : f.properties.urban_morphology
    const veg    = typeof f.properties.vegetation === "string"
      ? JSON.parse(f.properties.vegetation) : f.properties.vegetation
    const surf   = typeof f.properties.surface_and_flood === "string"
      ? JSON.parse(f.properties.surface_and_flood) : f.properties.surface_and_flood
    const health = typeof f.properties.health_livability === "string"
      ? JSON.parse(f.properties.health_livability) : f.properties.health_livability

    return {
      ...f,
      properties: {
        segment_id:           f.id ?? f.properties.segment_id,
        route_id:             f.properties.route_id,        // ← เพิ่ม
        order_index:          f.properties.order_index,     // ← เพิ่ม
        segment_name:         f.properties.address,
        neighborhood:         f.properties.address,
        walkway_width_m:      morph.street_width === "very_narrow" ? 1.5
                        : morph.street_width === "narrow" ? 2.5
                        : morph.street_width === "wide" ? 4.0
                        : morph.street_width === "very_wide" ? 6.0 : 3.0,
        height_width_ratio:   parseFloat(morph.height_width_ratio),   // ← parseFloat
        sky_view_factor_est:  parseFloat(morph.sky_view_factor),      // ← parseFloat
        shade_fraction_est:   parseFloat(veg.shade_fraction),         // ← parseFloat
        vegetation_canopy_m:  veg.shade_fraction * 10,
        material_ground:      surf.surface_material,
        heat_risk_proxy:      calcHeatRisk(morph.sky_view_factor, veg.shade_fraction),
        avg_heat_index:       38.0,
        max_heat_index:       42.0,
        streetview_image_url: f.properties.streetview_image_url === "UPLOADED"
            ? `http://47.129.159.61:8000/static/${f.properties.image_path}`
            : f.properties.streetview_image_url,
        scene_description:    f.properties.scene_description,
        shade_fraction:       veg.shade_fraction,
        green_view_index:     veg.green_view_index,
        sky_view_factor:      morph.sky_view_factor,
        surface_material:     surf.surface_material,
        drainage:             surf.drainage_infrastructure_presence,
        walkability:          health.walkability_obstruction,
        created_at:           f.properties.created_at,
        evidence:          typeof f.properties.evidence === "string"
            ? JSON.parse(f.properties.evidence) : f.properties.evidence,
        observed_features: typeof f.properties.observed_features === "string"
            ? JSON.parse(f.properties.observed_features) : f.properties.observed_features
      }
    }
  })
}

function loadMockData() {
  const filePath = join(process.cwd(), "public", "data", "street_analyses_mock.json")
  const raw = readFileSync(filePath, "utf-8")
  const geojson = JSON.parse(raw)
  return transformFeatures(geojson.features)
}

export async function GET() {
  // ถ้าไอเบนไม่เปิด ngrok ใช้ mock เลย
  if (!process.env.FRIEND_GEOSERVER_URL) {
    console.log("[street-analyses] No FRIEND_GEOSERVER_URL → using mock data")
    return NextResponse.json({
      type: "FeatureCollection",
      features: loadMockData()
    })
  }

  try {
    const res = await fetch(
      `${process.env.FRIEND_GEOSERVER_URL}/geoserver/wfs?service=wfs&version=2.0.0&request=GetFeature&typeNames=ne:street_analyses&outputFormat=application/json`,
      {
        headers: { "ngrok-skip-browser-warning": "true" },
        cache: "no-store",
        signal: AbortSignal.timeout(5000) // timeout 5 วิ
      }
    )

    if (!res.ok) throw new Error(`GeoServer error: ${res.status}`)

    const geojson = await res.json()
    console.log("[street-analyses] Using live GeoServer data")
    return NextResponse.json({
      type: "FeatureCollection",
      features: transformFeatures(geojson.features)
    })

  } catch (err) {
    // ngrok ปิดหรือ error → fallback ใช้ mock
    console.log("[street-analyses] GeoServer unavailable → falling back to mock data")
    return NextResponse.json({
      type: "FeatureCollection",
      features: loadMockData()
    })
  }
}