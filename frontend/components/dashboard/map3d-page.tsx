"use client"

import { useState, useMemo, useCallback } from "react"
import useSWR from "swr"
import dynamic from "next/dynamic"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Ruler,
  Sun,
  TreePine,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import type {
  SegmentsGeoJSON,
  HeatRisk,
} from "@/lib/segment-types"
import { RISK_COLORS } from "@/lib/segment-types"
import type { BaseMapStyle } from "@/components/cesium/cesium-map"
import { ControlPanel } from "@/components/cesium/control-panel"
import { SegmentDetail } from "@/components/cesium/segment-detail"

const CesiumMap = dynamic(
  () => import("@/components/cesium/cesium-map").then((m) => m.CesiumMap),
  { ssr: false }
)

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

export function Map3DPage() {
  const { data, isLoading, error } = useSWR<SegmentsGeoJSON>(
   // ของเก่า "/data/segments.geojson",
    "/api/street-analyses",
    fetcher
  )
console.log("data:", data) 

  const [layers, setLayers] = useState({
    corridor: true,
    canyon: true,
    canopy: true,
  })
  const [filters, setFilters] = useState<{
    widthRange: [number, number]
    svfRange: [number, number]
    shadeRange: [number, number]
    riskLevels: HeatRisk[]
  }>({
    widthRange: [0, 6],
    svfRange: [0, 1],
    shadeRange: [0, 1],
    riskLevels: ["low", "moderate", "high", "extreme"],
  })
  const [baseMap, setBaseMap] = useState<BaseMapStyle>("minimal")
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null)
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null)
  const [resetViewTrigger, setResetViewTrigger] = useState(0)
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false)

  const toggleLayer = useCallback((layer: "corridor" | "canyon" | "canopy") => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }))
  }, [])

  const toggleRisk = useCallback((risk: HeatRisk) => {
    setFilters((prev) => ({
      ...prev,
      riskLevels: prev.riskLevels.includes(risk)
        ? prev.riskLevels.filter((r) => r !== risk)
        : [...prev.riskLevels, risk],
    }))
  }, [])

  const resetView = useCallback(() => {
    setResetViewTrigger((p) => p + 1)
  }, [])

  // KPI computations
  const kpis = useMemo(() => {
    if (!data || !data.features || data.features.length === 0) return null
    const features = data.features
    const widths = features.map((f) => f.properties.walkway_width_m)
    const shades = features.map((f) => f.properties.shade_fraction_est)
    const svfs = features.map((f) => f.properties.sky_view_factor_est)
    const highExtreme = features.filter(
      (f) =>
        f.properties.heat_risk_proxy === "high" ||
        f.properties.heat_risk_proxy === "extreme"
    ).length
    return {
      medianWidth: median(widths).toFixed(1),
      avgShade: (shades.reduce((a, b) => a + b, 0) / shades.length).toFixed(2),
      avgSVF: (svfs.reduce((a, b) => a + b, 0) / svfs.length).toFixed(2),
      pctHighExtreme: Math.round((highExtreme / features.length) * 100),
    }
  }, [data])

  const selectedFeature = useMemo(() => {
    if (!data || !selectedSegmentId) return null
    return data.features.find(
      (f) => f.properties.segment_id === selectedSegmentId
    ) ?? null
  }, [data, selectedSegmentId])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading map data...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24">
        <p className="text-sm text-destructive">Failed to load segment data.</p>
        <p className="text-xs text-muted-foreground">
          Check that segments.geojson is available.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground lg:text-2xl text-balance">
          Survey Walk Map
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Heat and walkability analysis across {data.features?.length ?? 0} segments in northern Bangkok (March 1, 2026).
          Corridors follow actual streets. Click segments for details. Toggle layers and filters in the control panel.
        </p>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KPICard
            icon={<Ruler className="size-4 text-primary" />}
            label="Median Walkway Width"
            value={`${kpis.medianWidth} m`}
          />
          <KPICard
            icon={<Sun className="size-4 text-accent" />}
            label="Avg Shade Fraction"
            value={kpis.avgShade}
          />
          <KPICard
            icon={<TreePine className="size-4 text-chart-2" />}
            label="Avg Sky View Factor"
            value={kpis.avgSVF}
          />
          <KPICard
            icon={<AlertTriangle className="size-4 text-destructive" />}
            label="High/Extreme Risk"
            value={`${kpis.pctHighExtreme}%`}
          />
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Cesium Viewer */}
        <div className="min-h-[400px] flex-1 overflow-hidden rounded-lg border lg:min-h-[600px]">
        {/* ทำให้แผนที่กว้างถึงด้านล่าง <div className="h-[600px] flex-1 overflow-hidden rounded-lg border"> */}
          <CesiumMap
            data={data}
            layers={layers}
            filters={filters}
            baseMap={baseMap}
            selectedSegmentId={selectedSegmentId}
            hoveredSegmentId={hoveredSegmentId}
            onSelectSegment={setSelectedSegmentId}
            onHoverSegment={setHoveredSegmentId}
            onResetView={resetView}
            resetViewTrigger={resetViewTrigger}
          />
        </div>

        {/* Right panel: controls + detail */}
        <div className="w-full shrink-0 lg:w-72">
          {/* Mobile toggle */}
          <button
            className="mb-2 flex w-full items-center justify-between rounded-lg border bg-card px-4 py-2 text-xs font-medium text-foreground lg:hidden"
            onClick={() => setMobileControlsOpen(!mobileControlsOpen)}
          >
            Controls & Details
            {mobileControlsOpen ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>

          <div className={`flex flex-col gap-4 ${mobileControlsOpen ? "" : "hidden lg:flex"}`}>
            <ScrollArea className="h-auto lg:max-h-[600px]">
              <div className="flex flex-col gap-4">
                <ControlPanel
                  layers={layers}
                  onToggleLayer={toggleLayer}
                  baseMap={baseMap}
                  onBaseMapChange={setBaseMap}
                  filters={filters}
                  onWidthChange={(v) =>
                    setFilters((p) => ({ ...p, widthRange: v }))
                  }
                  onSvfChange={(v) =>
                    setFilters((p) => ({ ...p, svfRange: v }))
                  }
                  onShadeChange={(v) =>
                    setFilters((p) => ({ ...p, shadeRange: v }))
                  }
                  onToggleRisk={toggleRisk}
                  onResetView={resetView}
                  data={data}
                  selectedSegmentId={selectedSegmentId}
                />

                {selectedFeature && (
                  <SegmentDetail
                    properties={selectedFeature.properties}
                    onClose={() => setSelectedSegmentId(null)}
                  />
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  )
}

function KPICard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-secondary">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground">{label}</span>
          <span className="text-sm font-bold text-foreground tabular-nums">{value}</span>
        </div>
      </CardContent>
    </Card>
  )
}
