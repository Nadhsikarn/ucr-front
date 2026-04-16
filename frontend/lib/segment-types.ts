export type HeatRisk = "low" | "moderate" | "high" | "extreme"

export interface SegmentProperties {
  segment_id: string
  route_id: number          // ← เพิ่ม
  order_index: number       // ← เพิ่ม
  segment_name?: string
  neighborhood?: string
  walkway_width_m: number
  height_width_ratio: number
  sky_view_factor_est: number
  shade_fraction_est: number
  vegetation_canopy_m: number
  material_ground: string
  heat_risk_proxy: HeatRisk
  avg_heat_index: number
  max_heat_index: number
  streetview_image_url: string
  scene_description: string
  shade_fraction: number
  green_view_index: number
  sky_view_factor: number
  surface_material: string
  drainage: string
  walkability: string
  observed_features: string[]
  evidence: Record<string, string>
  created_at: string
}

export interface SegmentFeature {
  type: "Feature"
  geometry: {
    type: "Point"           // ← เปลี่ยนจาก LineString
    coordinates: number[]   // ← เปลี่ยนจาก number[][]
  }
  properties: SegmentProperties
}

export interface SegmentsGeoJSON {
  type: "FeatureCollection"
  features: SegmentFeature[]
}

export const RISK_COLORS: Record<HeatRisk, string> = {
  low: "#3b9a5b",
  moderate: "#d4a028",
  high: "#d46a28",
  extreme: "#c43030",
}

export const RISK_LABELS: Record<HeatRisk, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  extreme: "Extreme",
}