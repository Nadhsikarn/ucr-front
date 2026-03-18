export type HeatRisk = "low" | "moderate" | "high" | "extreme"

export interface SegmentProperties {
  segment_id: string
  segment_name?: string
  neighborhood?: string
  start_time: string
  end_time: string
  walkway_width_m: number
  height_width_ratio: number
  sky_view_factor_est: number
  shade_fraction_est: number
  vegetation_canopy_m: number
  material_ground: string
  heat_risk_proxy: HeatRisk
  img_urls: string[]
}

export interface SegmentFeature {
  type: "Feature"
  geometry: {
    type: "LineString"
    coordinates: number[][]
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
