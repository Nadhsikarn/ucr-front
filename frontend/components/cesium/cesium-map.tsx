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
  const corridorLayersRef = useRef<Map<string, L.Polyline>>(new Map())
  const outlineLayersRef = useRef<Map<string, L.Polyline>>(new Map())
  const canyonMarkersRef = useRef<Map<string, L.LayerGroup>>(new Map())
  const canopyMarkersRef = useRef<Map<string, L.LayerGroup>>(new Map())
  const segmentTooltipsRef = useRef<Map<string, L.Tooltip>>(new Map())

  const filteredIds = useMemo(() => {
    return new Set(
      data.features
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
      await import("leaflet/dist/leaflet.css")

      if (cancelled || !containerRef.current) return

      const allCoords = data.features.map((f) => f.geometry.coordinates)
      const bbox = computeBBox(allCoords)
      const centerLat = (bbox[1] + bbox[3]) / 2
      const centerLng = (bbox[0] + bbox[2]) / 2

      const map = L.map(containerRef.current, {
        center: [centerLat, centerLng],
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

      // Create segment polylines
      for (const feature of data.features) {
        const { segment_id, walkway_width_m, shade_fraction_est, heat_risk_proxy, segment_name, neighborhood } =
          feature.properties
        const coords: [number, number][] = feature.geometry.coordinates.map(
          ([lng, lat]) => [lat, lng]
        )

        const corridorWidth = clamp(walkway_width_m * 3.5, 6, 18)
        const alpha = clamp(0.65 + 0.25 * shade_fraction_est, 0.65, 0.92)
        const riskColor = RISK_COLORS[heat_risk_proxy]

        // Dark outline polyline (wider, underneath)
        const outline = L.polyline(coords, {
          color: "#1a1a1a",
          weight: corridorWidth + 4,
          opacity: 0.35,
          lineCap: "round",
          lineJoin: "round",
          interactive: false,
        }).addTo(map)
        outlineLayersRef.current.set(segment_id, outline)

        // Main corridor polyline
        const corridor = L.polyline(coords, {
          color: riskColor,
          weight: corridorWidth,
          opacity: alpha,
          lineCap: "round",
          lineJoin: "round",
          interactive: true,
        }).addTo(map)

        // Hover tooltip
        const tooltip = L.tooltip({
          permanent: false,
          direction: "top",
          offset: [0, -8],
          className: "segment-tooltip",
        })
        corridor.bindTooltip(tooltip)
        corridor.setTooltipContent(
          `<div style="font-size:11px;line-height:1.4;"><strong>${segment_name || segment_id}</strong><br/>${neighborhood}<br/>Risk: <span style="color:${riskColor};font-weight:600">${heat_risk_proxy}</span> | Width: ${walkway_width_m}m</div>`
        )

        corridor.on("mouseover", () => {
          onHoverSegment(segment_id)
          corridor.setStyle({ weight: corridorWidth + 3, opacity: Math.min(alpha + 0.15, 1) })
        })
        corridor.on("mouseout", () => {
          onHoverSegment(null)
          corridor.setStyle({ weight: corridorWidth, opacity: alpha })
        })
        corridor.on("click", () => {
          onSelectSegment(segment_id)
        })

        corridorLayersRef.current.set(segment_id, corridor)

        // Canyon ribbon: perpendicular bars along route showing street wall depth
        const svf = feature.properties.sky_view_factor_est
        const hwRatio = feature.properties.height_width_ratio
        const canyonAlpha = clamp(1.0 - svf, 0.45, 0.90)
        const canyonColor = `rgb(${Math.round(200 - svf * 120)},${Math.round(90 - svf * 40)},40)`

        const canyonGroup = L.layerGroup()
        const barSpacing = Math.max(1, Math.floor(coords.length / 5))
        for (let ci = 0; ci < coords.length; ci += barSpacing) {
          const [cLat, cLng] = coords[ci]
          const nextIdx = Math.min(ci + 1, coords.length - 1)
          const prevIdx = Math.max(ci - 1, 0)
          const dLat = coords[nextIdx][0] - coords[prevIdx][0]
          const dLng = coords[nextIdx][1] - coords[prevIdx][1]
          const len = Math.sqrt(dLat * dLat + dLng * dLng)
          const perpLat = len > 0 ? -dLng / len : 0
          const perpLng = len > 0 ? dLat / len : 1
          const barHalf = clamp(hwRatio * 0.00012, 0.00005, 0.00040)

          const barLine = L.polyline(
            [
              [cLat + perpLat * barHalf, cLng + perpLng * barHalf],
              [cLat - perpLat * barHalf, cLng - perpLng * barHalf],
            ],
            {
              color: canyonColor,
              weight: clamp(hwRatio * 3, 3, 12),
              opacity: canyonAlpha,
              lineCap: "butt",
              interactive: false,
            }
          )
          canyonGroup.addLayer(barLine)
        }

        const midIdx = Math.floor(coords.length / 2)
        const canyonCircle = L.circleMarker(coords[midIdx], {
          radius: 8,
          fillColor: canyonColor,
          fillOpacity: canyonAlpha * 0.7,
          color: "#222",
          weight: 1.5,
          interactive: true,
        })
        canyonCircle.bindTooltip(
          `<div style="font-size:11px;line-height:1.4;padding:2px"><strong>Street Canyon</strong><br/>H:W = ${hwRatio} | SVF = ${svf.toFixed(2)}</div>`,
          { direction: "top", offset: [0, -10] }
        )
        canyonGroup.addLayer(canyonCircle)
        canyonMarkersRef.current.set(segment_id, canyonGroup)

        // Canopy/Shade markers: prominent green circles along route
        const canopyGroup = L.layerGroup()
        const canopySize = clamp(feature.properties.vegetation_canopy_m * 2.5, 6, 20)
        const canopySpacing = Math.max(1, Math.floor(coords.length / 4))
        for (let ci = 0; ci < coords.length; ci += canopySpacing) {
          // Outer glow ring
          const outerCircle = L.circleMarker(coords[ci], {
            radius: canopySize + 6,
            fillColor: "#22c55e",
            fillOpacity: shade_fraction_est * 0.2,
            color: "#16a34a",
            weight: 1,
            opacity: 0.3,
            interactive: false,
          })
          canopyGroup.addLayer(outerCircle)
          // Core canopy circle
          const canopyCircle = L.circleMarker(coords[ci], {
            radius: canopySize,
            fillColor: "#4ade80",
            fillOpacity: clamp(shade_fraction_est * 0.8, 0.3, 0.8),
            color: "#15803d",
            weight: 2,
            interactive: false,
          })
          canopyGroup.addLayer(canopyCircle)
          // Inner dot for emphasis
          const innerDot = L.circleMarker(coords[ci], {
            radius: Math.max(3, canopySize * 0.35),
            fillColor: "#15803d",
            fillOpacity: 0.5,
            color: "transparent",
            weight: 0,
            interactive: false,
          })
          canopyGroup.addLayer(innerDot)
        }
        // Interactive tooltip at midpoint
        const canopyTooltipMarker = L.circleMarker(coords[midIdx], {
          radius: 7,
          fillColor: "#4ade80",
          fillOpacity: 0.7,
          color: "#15803d",
          weight: 1.5,
          interactive: true,
        })
        canopyTooltipMarker.bindTooltip(
          `<div style="font-size:11px;line-height:1.4;padding:2px"><strong>Canopy/Shade</strong><br/>Canopy: ${feature.properties.vegetation_canopy_m}m<br/>Shade: ${Math.round(shade_fraction_est * 100)}%</div>`,
          { direction: "top", offset: [0, -10] }
        )
        canopyGroup.addLayer(canopyTooltipMarker)
        canopyMarkersRef.current.set(segment_id, canopyGroup)
      }

      // Fit bounds
      map.fitBounds(
        L.latLngBounds(
          [bbox[1] - 0.002, bbox[0] - 0.002],
          [bbox[3] + 0.002, bbox[2] + 0.002]
        )
      )

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
    const allCoords = data.features.map((f) => f.geometry.coordinates)
    const bbox = computeBBox(allCoords)
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
