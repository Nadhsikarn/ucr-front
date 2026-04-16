"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { X, Ruler, Sun, TreePine, Layers, Droplets, Activity } from "lucide-react"
import type { SegmentProperties } from "@/lib/segment-types"
import { RISK_COLORS, RISK_LABELS } from "@/lib/segment-types"

interface SegmentDetailProps {
  properties: SegmentProperties
  onClose: () => void
}

export function SegmentDetail({ properties: p, onClose }: SegmentDetailProps) {
  const riskVariant =
    p.heat_risk_proxy === "extreme" || p.heat_risk_proxy === "high"
      ? "destructive"
      : "secondary"

  return (
    <Card className="w-full">
      <CardHeader className="relative pb-3">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-md hover:bg-secondary"
        >
          <X className="size-3.5" />
        </button>
        <div className="pr-8">
          <CardTitle className="text-sm">
            {p.segment_name || p.segment_id}
          </CardTitle>
          {p.neighborhood && (
            <p className="text-[10px] text-muted-foreground">
              {p.neighborhood}
            </p>
          )}
          <Badge
            variant={riskVariant}
            className="mt-1 text-[10px]"
            style={{
              background: `${RISK_COLORS[p.heat_risk_proxy]}20`,
              color: RISK_COLORS[p.heat_risk_proxy],
              borderColor: RISK_COLORS[p.heat_risk_proxy],
            }}
          >
            {RISK_LABELS[p.heat_risk_proxy]} Risk
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {/* Street View Image */}
        {p.streetview_image_url && p.streetview_image_url !== "UPLOADED" && (
          <>
            <img
              src={p.streetview_image_url}
              alt={p.segment_name}
              className="w-full rounded-md object-cover"
              style={{ height: 120 }}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/280x120?text=No+Image";
              }}
            />
            <Separator />
          </>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2">
          <MetricRow
            icon={<Ruler className="size-3" />}
            label="Walkway"
            value={`${p.walkway_width_m} m`}
          />
          <MetricRow
            icon={<Layers className="size-3" />}
            label="H/W Ratio"
            value={p.height_width_ratio?.toFixed(1) ?? "-"}
          />
          <MetricRow
            icon={<Sun className="size-3" />}
            label="SVF"
            value={p.sky_view_factor_est?.toFixed(2) ?? "-"}
          />
          <MetricRow
            icon={<Sun className="size-3" />}
            label="Shade"
            value={`${((p.shade_fraction_est ?? 0) * 100).toFixed(0)}%`}
          />
          <MetricRow
            icon={<TreePine className="size-3" />}
            label="GVI"
            value={p.green_view_index?.toString() ?? "-"}
          />
          <MetricRow
            icon={<Layers className="size-3" />}
            label="Surface"
            value={p.surface_material ?? "-"}
          />
          <MetricRow
            icon={<Droplets className="size-3" />}
            label="Drainage"
            value={p.drainage ?? "-"}
          />
          <MetricRow
            icon={<Activity className="size-3" />}
            label="Walk"
            value={p.walkability ?? "-"}
          />
        </div>

        {/* Observed Features */}
        {Array.isArray(p.observed_features) &&
          p.observed_features.length > 0 && (
            <>
              <Separator />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Observed Features
              </span>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {p.observed_features.join(", ")}
              </p>
            </>
          )}

        {/* Scene Description */}
        {p.scene_description && (
          <>
            <Separator />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Scene
            </span>
            <p className="text-[10px] text-muted-foreground leading-relaxed italic">
              {p.scene_description}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MetricRow({
  icon, label, value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{icon}</span>
      <div className="flex flex-col">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="text-xs font-medium text-foreground">{value}</span>
      </div>
    </div>
  )
}