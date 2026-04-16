"use client"

import { useEffect, useRef, useMemo } from "react"
import type {
  SegmentsGeoJSON,
  SegmentFeature,
  HeatRisk,
} from "@/lib/segment-types"
import { RISK_COLORS } from "@/lib/segment-types"
import { computeBBox } from "@/lib/geo"

export type BaseMapStyle = "minimal" | "satellite"

interface CesiumMapProps {
  data: SegmentsGeoJSON
  layers: { corridor: boolean; canyon: boolean; canopy: boolean }
  filters: {
    widthRange: [number, number]
    svfRange: [number, number]
    shadeRange: [number, number]
    riskLevels: HeatRisk[]
  }
  baseMap: BaseMapStyle
  selectedSegmentId: string | null
  hoveredSegmentId: string | null
  onSelectSegment: (id: string | null) => void
  onHoverSegment: (id: string | null) => void
  onResetView: () => void
  resetViewTrigger: number
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function CesiumMap({
  data,
  layers,
  filters,
  baseMap,
  selectedSegmentId,
  hoveredSegmentId,
  onSelectSegment,
  onHoverSegment,
  resetViewTrigger,
}: CesiumMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const baseTileRef = useRef<L.TileLayer | null>(null)
  //เดิมเปน L.Polyline
  const corridorLayersRef = useRef<Map<string, L.CircleMarker>>(new Map())
  const outlineLayersRef = useRef<Map<string, L.CircleMarker>>(new Map())
  const canyonMarkersRef = useRef<Map<string, L.LayerGroup>>(new Map())
  const canopyMarkersRef = useRef<Map<string, L.LayerGroup>>(new Map())
  const segmentTooltipsRef = useRef<Map<string, L.Tooltip>>(new Map())

  const filteredIds = useMemo(() => {
    return new Set(
      (data?.features ?? [])
        .filter((f) => {
          const p = f.properties
          return (
            p.walkway_width_m >= filters.widthRange[0] &&
            p.walkway_width_m <= filters.widthRange[1] &&
            p.sky_view_factor_est >= filters.svfRange[0] &&
            p.sky_view_factor_est <= filters.svfRange[1] &&
            p.shade_fraction_est >= filters.shadeRange[0] &&
            p.shade_fraction_est <= filters.shadeRange[1] &&
            filters.riskLevels.includes(p.heat_risk_proxy)
          )
        })
        .map((f) => f.properties.segment_id)
    )
  }, [data.features, filters])

  // Initialize Leaflet map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let cancelled = false

    async function init() {
      const L = (await import("leaflet")).default
      await import("leaflet/dist/leaflet.css" as any)

      if (cancelled || !containerRef.current) return

    /*  const allCoords = data.features.map((f) => f.geometry.coordinates)
      const bbox = computeBBox(allCoords)  */

    const allCoords = (data?.features ?? []).flatMap((f) => {
      const raw = f.geometry.coordinates as unknown[]
      return typeof raw[0] === "number"
        ? [(raw as unknown) as number[]]
        : (raw as number[][])
    })

    const bbox = allCoords.length > 0
      ? computeBBox([allCoords])
      : [100.5018, 13.7563, 100.5018, 13.7563] as [number, number, number, number]

    const centerLat = (bbox[1] + bbox[3]) / 2
    const centerLng = (bbox[0] + bbox[2]) / 2

    const safeLat = isNaN(centerLat) ? 13.7563 : centerLat
    const safeLng = isNaN(centerLng) ? 100.5018 : centerLng

    const map = L.map(containerRef.current, {
      center: [safeLat, safeLng],
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
    })

      // Base tile layer
      const tileUrl = baseMap === "satellite"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      const tileOpts = baseMap === "satellite"
        ? { maxZoom: 19, attribution: "Esri" }
        : { subdomains: "abcd", maxZoom: 19, attribution: "CartoDB", opacity: 0.85 }
      baseTileRef.current = L.tileLayer(tileUrl, tileOpts).addTo(map)

      // For satellite mode, add a road labels overlay for context
      if (baseMap === "satellite") {
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
          { subdomains: "abcd", maxZoom: 19, pane: "overlayPane" }
        ).addTo(map)
      }

      mapRef.current = map

// ── 1. จัดกลุ่ม features ตาม route_id เรียงตาม order_index ──
const routeGroups = new Map<number, SegmentFeature[]>()
for (const f of data.features) {
  const rid = f.properties.route_id
  if (!routeGroups.has(rid)) routeGroups.set(rid, [])
  routeGroups.get(rid)!.push(f)
}
for (const [, arr] of routeGroups) {
  arr.sort((a, b) => a.properties.order_index - b.properties.order_index)
}

// ── 2. วาด Corridor Line ──
for (const [, features] of routeGroups) {
  const latlngs = features.map((f) => {
    const c = f.geometry.coordinates as number[]
    return [c[1], c[0]] as L.LatLngTuple
  })
  if (layers.corridor) {
    L.polyline(latlngs, {
      color: "#b45309",
      weight: 5,
      opacity: 0.85,
    }).addTo(map)
  }
}

// ── 3. วาด Markers + Canyon + Canopy ──
for (const feature of data.features) {
  const p = feature.properties as any
  const id = p.segment_id
  const c = feature.geometry.coordinates as number[]
  const lat = c[1], lng = c[0]

  const riskColor = RISK_COLORS[p.heat_risk_proxy as HeatRisk]
  //const radius = clamp(p.walkway_width_m * 3, 8, 20) จุดส้มใหญ่
  const radius = 8

  // Outline glow
  const outline = L.circleMarker([lat, lng], {
    radius: radius + 4,
    color: "#1a1a1a",
    fillColor: riskColor,
    fillOpacity: 0.2,
    weight: 1, opacity: 0.3,
    interactive: false,
  }).addTo(map)
  outlineLayersRef.current.set(id, outline)

  // Main dot
  const corridor = L.circleMarker([lat, lng], {
    radius,
    color: "#fff",
    fillColor: riskColor,
    fillOpacity: 0.85,
    weight: 2,
  }).addTo(map)

  // Tooltip (เหมือนเดิม)
// ── Tooltip ย่อ (hover) ──
corridor.bindTooltip(
  `<div style="font-size:11px;line-height:1.6;width:180px;">
    <img src="${p.streetview_image_url}"
      style="width:100%;height:90px;object-fit:cover;border-radius:4px;margin-bottom:5px;display:block;"
      onerror="this.src='https://placehold.co/180x90?text=No+Image'"
    />
    <strong>${p.neighborhood ?? p.segment_id}</strong><br/>
    <span style="color:${riskColor};font-weight:600;">● ${p.heat_risk_proxy?.toUpperCase()}</span><br/>
    Width: <b>${p.walkway_width_m}m</b> &nbsp;|&nbsp; SVF: <b>${p.sky_view_factor}</b><br/>
    Shade: <b>${Math.round(p.shade_fraction_est * 100)}%</b>
  </div>`,
  { permanent: false, direction: "right", offset: [10, 0], opacity: 0.95 }
)

// ── Popup เต็ม (click) ──
corridor.bindPopup(
  `<div style="font-size:11px;line-height:1.8;width:260px;max-height:400px;overflow-y:auto;">
    <img src="${p.streetview_image_url}"
      style="width:100%;height:120px;object-fit:cover;border-radius:4px;margin-bottom:6px;display:block;"
      onerror="this.src='https://placehold.co/260x120?text=No+Image'"
    />
    <strong style="font-size:13px;">${p.segment_name}</strong><br/>
    <span style="color:${riskColor};font-weight:600;">● ${p.heat_risk_proxy?.toUpperCase()}</span>
    <hr style="margin:4px 0;border-top:1px solid #eee;"/>
    <b style="font-size:10px;color:#555;">URBAN MORPHOLOGY</b><br/>
    Sky View Factor: <b>${p.sky_view_factor}</b><br/>
    Walkway Width: <b>${p.walkway_width_m}m</b><br/>
    Height/Width Ratio: <b>${p.height_width_ratio}</b><br/>
    <hr style="margin:4px 0;border-top:1px solid #eee;"/>
    <b style="font-size:10px;color:#555;">VEGETATION</b><br/>
    Shade Fraction: <b>${Math.round(p.shade_fraction * 100)}%</b><br/>
    Green View Index: <b>${p.green_view_index}</b><br/>
    <hr style="margin:4px 0;border-top:1px solid #eee;"/>
    <b style="font-size:10px;color:#555;">SURFACE & FLOOD</b><br/>
    Surface: <b>${p.surface_material}</b><br/>
    Drainage: <b>${p.drainage}</b><br/>
    <hr style="margin:4px 0;border-top:1px solid #eee;"/>
    <b style="font-size:10px;color:#555;">HEALTH & LIVABILITY</b><br/>
    Walkability: <b>${p.walkability}</b><br/>
    <hr style="margin:4px 0;border-top:1px solid #eee;"/>
    <b style="font-size:10px;color:#555;">OBSERVED FEATURES</b><br/>
    <span style="font-size:10px;color:#555;">
      ${Array.isArray(p.observed_features) ? p.observed_features.join(", ") : ""}
    </span>
    <hr style="margin:4px 0;border-top:1px solid #eee;"/>
    <b style="font-size:10px;color:#555;">SCENE DESCRIPTION</b><br/>
    <em style="font-size:10px;color:#555;">${p.scene_description ?? ""}</em>
  </div>`,
  { maxWidth: 280, autoPan: true }
)

  corridor.on("mouseover", () => {
    onHoverSegment(id)
    corridor.setStyle({ radius: radius + 3, fillOpacity: 1 })
  })
  corridor.on("mouseout", () => {
    onHoverSegment(null)
    corridor.setStyle({ radius, fillOpacity: 0.85 })
  })
  corridor.on("click", () => {
    corridor.closeTooltip()
    onSelectSegment(id)
  })
  corridorLayersRef.current.set(id, corridor)

// ── Canyon Ribbon ──
const svf = p.sky_view_factor_est
const hwRatio = p.height_width_ratio
const canyonAlpha = clamp(1.0 - svf, 0.45, 0.90)
const canyonColor = `rgb(${Math.round(200 - svf * 120)},${Math.round(90 - svf * 40)},40)`

const routeFeatures = routeGroups.get(p.route_id) ?? []
const idx = routeFeatures.findIndex((f) => f.properties.segment_id === id)
const prev = routeFeatures[idx - 1]
const next = routeFeatures[idx + 1]

let dLat = 0, dLng = 0
if (prev && next) {
  const ca = prev.geometry.coordinates as number[]
  const cb = next.geometry.coordinates as number[]
  dLng = cb[0] - ca[0]
  dLat = cb[1] - ca[1]
} else if (next) {
  const c = next.geometry.coordinates as number[]
  dLng = c[0] - lng
  dLat = c[1] - lat
} else if (prev) {
  const c = prev.geometry.coordinates as number[]
  dLng = lng - c[0]
  dLat = lat - c[1]
}

const len = Math.sqrt(dLat * dLat + dLng * dLng) || 1
const perpLat = -dLng / len
const perpLng = dLat / len
const barHalf = clamp(hwRatio * 0.00012, 0.00005, 0.00040)

const canyonGroup = L.layerGroup()
L.polyline([
  [lat + perpLat * barHalf, lng + perpLng * barHalf],
  [lat - perpLat * barHalf, lng - perpLng * barHalf],
], {
  color: canyonColor,
  weight: clamp(hwRatio * 3, 3, 12),
  opacity: canyonAlpha,
  lineCap: "butt",
  interactive: true,   // ← เปลี่ยนเป็น true
}).bindTooltip(
  `<div style="font-size:11px;line-height:1.6;">
    <strong>Street Canyon</strong><br/>
    H:W = ${hwRatio} | SVF = ${svf.toFixed(2)}
  </div>`,
  { direction: "top", offset: [0, -6] }
).addTo(canyonGroup)

canyonGroup.addTo(map)
canyonMarkersRef.current.set(id, canyonGroup)

  // ── Canopy Marker ──
  const canopyGroup = L.layerGroup()
  if (p.shade_fraction_est > 0.3) {
    L.circleMarker([lat, lng], {
      radius: 6,
      color: "#16a34a",
      fillColor: "#bbf7d0",
      fillOpacity: 0.85,
      weight: 2,
      interactive: false,
    }).bindTooltip(
      `<div style="font-size:11px;">
        <b>Canopy/Shade</b><br/>
        Canopy: ${Math.round(p.vegetation_canopy_m)}m<br/>
        Shade: ${Math.round(p.shade_fraction_est * 100)}%
      </div>`,
      { permanent: false, direction: "top" }
    ).addTo(canopyGroup)
  }
  canopyMarkersRef.current.set(id, canopyGroup)
}

      const isValidBBox = bbox[0] !== bbox[2] || bbox[1] !== bbox[3]
      if (isValidBBox) {
        map.fitBounds(
          L.latLngBounds(
            [bbox[1] - 0.002, bbox[0] - 0.002],
            [bbox[3] + 0.002, bbox[2] + 0.002]
          )
        )
      } else {
        // Point เดียว zoom ไปที่จุดนั้นเลย
        map.setView([bbox[1], bbox[0]], 15)
      }

      // Click background to deselect
      map.on("click", () => {
        onSelectSegment(null)
      })
    }

    init()

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      corridorLayersRef.current.clear()
      outlineLayersRef.current.clear()
      canyonMarkersRef.current.clear()
      canopyMarkersRef.current.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Swap base tile when baseMap prop changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    async function swapTiles() {
      const L = (await import("leaflet")).default
      // Remove all existing tile layers
      map!.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          map!.removeLayer(layer)
        }
      })

      if (baseMap === "satellite") {
        L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 19, attribution: "Esri" }
        ).addTo(map!)
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
          { subdomains: "abcd", maxZoom: 19, pane: "overlayPane" }
        ).addTo(map!)
      } else {
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          { subdomains: "abcd", maxZoom: 19, attribution: "CartoDB", opacity: 0.85 }
        ).addTo(map!)
      }

      // Re-add data layers on top by briefly toggling
      for (const [, line] of outlineLayersRef.current) {
        if (map!.hasLayer(line)) { line.bringToFront() }
      }
      for (const [, line] of corridorLayersRef.current) {
        if (map!.hasLayer(line)) { line.bringToFront() }
      }
    }

    swapTiles()
  }, [baseMap])

  // Update visibility based on layers + filters
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    for (const feature of data.features) {
      const id = feature.properties.segment_id
      const visible = filteredIds.has(id)

      const corridor = corridorLayersRef.current.get(id)
      const outline = outlineLayersRef.current.get(id)
      if (corridor) {
        if (layers.corridor && visible) {
          if (!map.hasLayer(corridor)) corridor.addTo(map)
        } else {
          if (map.hasLayer(corridor)) map.removeLayer(corridor)
        }
      }
      if (outline) {
        if (layers.corridor && visible) {
          if (!map.hasLayer(outline)) outline.addTo(map)
        } else {
          if (map.hasLayer(outline)) map.removeLayer(outline)
        }
      }

      const canyon = canyonMarkersRef.current.get(id)
      if (canyon) {
        if (layers.canyon && visible) {
          if (!map.hasLayer(canyon)) canyon.addTo(map)
        } else {
          if (map.hasLayer(canyon)) map.removeLayer(canyon)
        }
      }

      const canopy = canopyMarkersRef.current.get(id)
      if (canopy) {
        if (layers.canopy && visible) {
          if (!map.hasLayer(canopy)) canopy.addTo(map)
        } else {
          if (map.hasLayer(canopy)) map.removeLayer(canopy)
        }
      }
    }
  }, [layers, filteredIds, data.features])

  // Highlight selected/hovered segment
  useEffect(() => {
    for (const feature of data.features) {
      const id = feature.properties.segment_id
      const corridor = corridorLayersRef.current.get(id)
      if (!corridor) continue

      const p = feature.properties
      const baseWidth = clamp(p.walkway_width_m * 3.5, 6, 18)
      const baseAlpha = clamp(0.65 + 0.25 * p.shade_fraction_est, 0.65, 0.92)
      const isHighlighted = selectedSegmentId === id || hoveredSegmentId === id

      corridor.setStyle({
        weight: isHighlighted ? baseWidth + 4 : baseWidth,
        opacity: isHighlighted ? Math.min(baseAlpha + 0.2, 1) : baseAlpha,
      })

      if (isHighlighted) {
        corridor.bringToFront()
      }
    }
  }, [selectedSegmentId, hoveredSegmentId, data.features])

  // Reset view
  useEffect(() => {
    if (!mapRef.current || resetViewTrigger === 0) return
  /*  const allCoords = data.features.map((f) => f.geometry.coordinates)
    const bbox = computeBBox(allCoords)*/

// ใหม่ — เหมือนกันเลย
    const allCoords = data.features.flatMap((f) => {
      const raw = f.geometry.coordinates as unknown[]
      return Array.isArray(raw[0])
        ? (raw as number[][])
        : [(raw as unknown) as number[]]
      })
    const bbox = computeBBox([allCoords])

    // หลัง computeBBox
    const isValidBBox = 
      bbox[0] !== bbox[2] || bbox[1] !== bbox[3]

    mapRef.current.flyToBounds(
      [
        [bbox[1] - 0.002, bbox[0] - 0.002],
        [bbox[3] + 0.002, bbox[2] + 0.002],
      ],
      { duration: 1.2 }
    )
  }, [resetViewTrigger, data.features])

  return (
    <div className="relative size-full">
      <div ref={containerRef} className="size-full rounded-lg" style={{ minHeight: 400 }} />
      {/* Legend overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] flex flex-col gap-2 rounded-lg border bg-card/95 p-3 text-xs backdrop-blur">
        <span className="font-semibold text-foreground">Heat Risk</span>
        {(["low", "moderate", "high", "extreme"] as HeatRisk[]).map((risk) => (
          <div key={risk} className="flex items-center gap-2">
            <div
              className="size-3 rounded-sm"
              style={{ background: hexToRgba(RISK_COLORS[risk], 0.7) }}
            />
            <span className="capitalize text-muted-foreground">{risk}</span>
          </div>
        ))}
        <span className="mt-1 font-semibold text-foreground">Width</span>
        <div className="flex items-center gap-2">
          <div className="h-1 w-3 rounded bg-muted-foreground/40" />
          <span className="text-muted-foreground">Narrow walkway</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-5 rounded bg-muted-foreground/40" />
          <span className="text-muted-foreground">Wide walkway</span>
        </div>
          <hr className="my-1" />
        <span className="text-[10px] text-muted-foreground">
          🖱 คลิกจุดเพื่อดูรายละเอียด
        </span>
      </div>
      {/* Neighborhood labels */}
      <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-1 rounded-lg border bg-card/95 p-2.5 text-xs backdrop-blur">
        <span className="font-semibold text-foreground">Walk Segments</span>
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-chart-1" />
          <span className="text-muted-foreground">Lak Si 99</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-chart-3" />
          <span className="text-muted-foreground">Chaengwattana 5</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-chart-2" />
          <span className="text-muted-foreground">Community behind flats</span>
        </div>
      </div>
    </div>
  )
}
