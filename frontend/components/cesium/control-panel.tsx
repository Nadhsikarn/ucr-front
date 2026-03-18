"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Download } from "lucide-react"
import type { HeatRisk, SegmentsGeoJSON } from "@/lib/segment-types"
import { RISK_COLORS, RISK_LABELS } from "@/lib/segment-types"
import type { BaseMapStyle } from "@/components/cesium/cesium-map"

interface ControlPanelProps {
  layers: { corridor: boolean; canyon: boolean; canopy: boolean }
  onToggleLayer: (layer: "corridor" | "canyon" | "canopy") => void
  baseMap: BaseMapStyle
  onBaseMapChange: (style: BaseMapStyle) => void
  filters: {
    widthRange: [number, number]
    svfRange: [number, number]
    shadeRange: [number, number]
    riskLevels: HeatRisk[]
  }
  onWidthChange: (val: [number, number]) => void
  onSvfChange: (val: [number, number]) => void
  onShadeChange: (val: [number, number]) => void
  onToggleRisk: (risk: HeatRisk) => void
  onResetView: () => void
  data: SegmentsGeoJSON
  selectedSegmentId: string | null
}

export function ControlPanel({
  layers,
  onToggleLayer,
  baseMap,
  onBaseMapChange,
  filters,
  onWidthChange,
  onSvfChange,
  onShadeChange,
  onToggleRisk,
  onResetView,
  data,
  selectedSegmentId,
}: ControlPanelProps) {
  const exportSelectedJSON = () => {
    if (!selectedSegmentId) return
    const feature = data.features.find(
      (f) => f.properties.segment_id === selectedSegmentId
    )
    if (!feature) return
    const blob = new Blob([JSON.stringify(feature, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selectedSegmentId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportFilteredGeoJSON = () => {
    const filtered = data.features.filter((f) => {
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
    const geojson = { type: "FeatureCollection", features: filtered }
    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: "application/geo+json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "filtered-segments.geojson"
    a.click()
    URL.revokeObjectURL(url)
  }

  const risks: HeatRisk[] = ["low", "moderate", "high", "extreme"]

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Controls</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Base Map Style */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Base Map
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onBaseMapChange("minimal")}
              className={`flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-[10px] transition-colors ${
                baseMap === "minimal"
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className="opacity-60">
                <rect x="0.5" y="0.5" width="19" height="13" rx="1.5" stroke="currentColor" strokeWidth="1" />
                <line x1="4" y1="4" x2="16" y2="4" stroke="currentColor" strokeWidth="0.75" />
                <line x1="4" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="0.75" />
                <line x1="4" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="0.75" />
              </svg>
              Minimal
            </button>
            <button
              onClick={() => onBaseMapChange("satellite")}
              className={`flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-[10px] transition-colors ${
                baseMap === "satellite"
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className="opacity-60">
                <rect x="0.5" y="0.5" width="19" height="13" rx="1.5" stroke="currentColor" strokeWidth="1" />
                <rect x="3" y="3" width="5" height="4" rx="0.5" fill="currentColor" opacity="0.3" />
                <rect x="10" y="5" width="6" height="5" rx="0.5" fill="currentColor" opacity="0.2" />
                <rect x="5" y="8" width="4" height="3" rx="0.5" fill="currentColor" opacity="0.25" />
              </svg>
              Satellite
            </button>
          </div>
        </div>

        <Separator />

        {/* Layer Toggles */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Layers
          </span>
          <div className="flex items-center justify-between">
            <label className="text-xs text-foreground">Heat Walkability Corridor</label>
            <Switch
              checked={layers.corridor}
              onCheckedChange={() => onToggleLayer("corridor")}
              aria-label="Toggle corridor layer"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-foreground">Street Canyon Ribbon</label>
            <Switch
              checked={layers.canyon}
              onCheckedChange={() => onToggleLayer("canyon")}
              aria-label="Toggle canyon layer"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-foreground">Canopy/Shade Markers</label>
            <Switch
              checked={layers.canopy}
              onCheckedChange={() => onToggleLayer("canopy")}
              aria-label="Toggle canopy layer"
            />
          </div>
        </div>

        <Separator />

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Filters
          </span>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Walkway Width (m)</span>
              <span className="text-[10px] font-medium text-foreground tabular-nums">
                {filters.widthRange[0].toFixed(1)} - {filters.widthRange[1].toFixed(1)}
              </span>
            </div>
            <Slider
              min={0}
              max={6}
              step={0.1}
              value={filters.widthRange}
              onValueChange={(v) => onWidthChange(v as [number, number])}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Sky View Factor</span>
              <span className="text-[10px] font-medium text-foreground tabular-nums">
                {filters.svfRange[0].toFixed(2)} - {filters.svfRange[1].toFixed(2)}
              </span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={filters.svfRange}
              onValueChange={(v) => onSvfChange(v as [number, number])}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Shade Fraction</span>
              <span className="text-[10px] font-medium text-foreground tabular-nums">
                {filters.shadeRange[0].toFixed(2)} - {filters.shadeRange[1].toFixed(2)}
              </span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={filters.shadeRange}
              onValueChange={(v) => onShadeChange(v as [number, number])}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Heat Risk Level</span>
            <div className="flex flex-wrap gap-1.5">
              {risks.map((risk) => (
                <button
                  key={risk}
                  onClick={() => onToggleRisk(risk)}
                  className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] transition-colors"
                  style={{
                    borderColor: filters.riskLevels.includes(risk)
                      ? RISK_COLORS[risk]
                      : undefined,
                    background: filters.riskLevels.includes(risk)
                      ? `${RISK_COLORS[risk]}15`
                      : undefined,
                  }}
                  aria-label={`Toggle ${risk} risk filter`}
                >
                  <div
                    className="size-2 rounded-full"
                    style={{ background: RISK_COLORS[risk] }}
                  />
                  <span className="capitalize">{RISK_LABELS[risk]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Actions
          </span>
          <Button variant="outline" size="sm" onClick={onResetView}>
            <RotateCcw className="mr-1.5 size-3.5" />
            Reset View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportSelectedJSON}
            disabled={!selectedSegmentId}
          >
            <Download className="mr-1.5 size-3.5" />
            Export Selected JSON
          </Button>
          <Button variant="outline" size="sm" onClick={exportFilteredGeoJSON}>
            <Download className="mr-1.5 size-3.5" />
            Export Filtered GeoJSON
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
