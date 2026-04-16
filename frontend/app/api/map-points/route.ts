import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const res = await fetch(
      `${process.env.FRIEND_GEOSERVER_URL}/geoserver/wfs?service=wfs&version=2.0.0&request=GetFeature&typeNames=ne:street_analyses&outputFormat=application/json`,
      {
        headers: {
          "ngrok-skip-browser-warning": "true"
        },
        cache: "no-store"
      }
    )

    if (!res.ok) {
      throw new Error(`GeoServer error: ${res.status}`)
    }

    const data = await res.json()

    // แตก nested JSON string ออกมา
    const parsed = {
      ...data,
      features: data.features.map((f: any) => ({
        ...f,
        properties: {
          ...f.properties,
          urban_morphology:  JSON.parse(f.properties.urban_morphology),
          vegetation:        JSON.parse(f.properties.vegetation),
          surface_and_flood: JSON.parse(f.properties.surface_and_flood),
          health_livability: JSON.parse(f.properties.health_livability),
          confidence_scores: JSON.parse(f.properties.confidence_scores),
          observed_features: JSON.parse(f.properties.observed_features),
          reference_objects: JSON.parse(f.properties.reference_objects),
          evidence:          JSON.parse(f.properties.evidence),
        }
      }))
    }

    return NextResponse.json(parsed)

  } catch (err) {
    console.error("[map-points] error:", err)
    return NextResponse.json(
      { error: "Failed to fetch from GeoServer" },
      { status: 500 }
    )
  }
}