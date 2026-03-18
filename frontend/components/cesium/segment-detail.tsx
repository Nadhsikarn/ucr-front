"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  X,
  Clock,
  Ruler,
  Sun,
  TreePine,
  Layers,
  ExternalLink,
} from "lucide-react"
import Image from "next/image"
import type { SegmentProperties } from "@/lib/segment-types"
import { RISK_COLORS, RISK_LABELS } from "@/lib/segment-types"
import { normalizeImageUrl, isExternalUrl } from "@/lib/images"

interface SegmentDetailProps {
  properties: SegmentProperties
  onClose: () => void
}

export function SegmentDetail({ properties: p, onClose }: SegmentDetailProps) {
  const [modalImage, setModalImage] = useState<string | null>(null)

  const riskVariant =
    p.heat_risk_proxy === "extreme" || p.heat_risk_proxy === "high"
      ? "destructive"
      : "secondary"

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex-row items-start justify-between pb-3">
          <div>
            <CardTitle className="text-sm">{p.segment_name || p.segment_id}</CardTitle>
            {p.neighborhood && (
              <p className="text-[10px] text-muted-foreground">{p.neighborhood}</p>
            )}
            <Badge
              variant={riskVariant}
              className="mt-1 text-[10px]"
              style={{ background: `${RISK_COLORS[p.heat_risk_proxy]}20`, color: RISK_COLORS[p.heat_risk_proxy], borderColor: RISK_COLORS[p.heat_risk_proxy] }}
            >
              {RISK_LABELS[p.heat_risk_proxy]} Risk
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="flex size-6 items-center justify-center rounded-md hover:bg-secondary"
            aria-label="Close segment details"
          >
            <X className="size-3.5" />
          </button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* Time */}
          <div className="flex items-center gap-2 text-xs">
            <Clock className="size-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              {p.start_time.split("T")[1]?.slice(0, 5)} -{" "}
              {p.end_time.split("T")[1]?.slice(0, 5)}
            </span>
          </div>

          <Separator />

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <MetricRow icon={<Ruler className="size-3" />} label="Walkway" value={`${p.walkway_width_m} m`} />
            <MetricRow icon={<Layers className="size-3" />} label="H/W Ratio" value={p.height_width_ratio.toFixed(1)} />
            <MetricRow icon={<Sun className="size-3" />} label="SVF" value={p.sky_view_factor_est.toFixed(2)} />
            <MetricRow icon={<Sun className="size-3" />} label="Shade" value={`${(p.shade_fraction_est * 100).toFixed(0)}%`} />
            <MetricRow icon={<TreePine className="size-3" />} label="Canopy" value={`${p.vegetation_canopy_m} m`} />
            <MetricRow icon={<Layers className="size-3" />} label="Ground" value={p.material_ground} />
          </div>

          {/* Photo strip */}
          {p.img_urls.length > 0 && (
            <>
              <Separator />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Photos
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {p.img_urls.map((url, i) => {
                  const src = normalizeImageUrl(url)
                  return (
                    <button
                      key={`${url}-${i}`}
                      className="group relative shrink-0 overflow-hidden rounded-md border"
                      onClick={() => setModalImage(src)}
                      aria-label={`View photo ${i + 1}`}
                    >
                      <Image
                        src={src}
                        alt={`Survey photo ${i + 1} for ${p.segment_id}`}
                        width={96}
                        height={72}
                        className="h-[72px] w-[96px] object-cover transition-transform group-hover:scale-105"
                      />
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Photo modal */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-4"
          onClick={() => setModalImage(null)}
          role="dialog"
          aria-label="Photo lightbox"
        >
          <div
            className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-xl border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute right-3 top-3 z-10 flex gap-2">
              {isExternalUrl(modalImage) && (
                <a
                  href={modalImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-8 items-center justify-center rounded-full bg-card/90 shadow hover:bg-secondary"
                  aria-label="Open in new tab"
                >
                  <ExternalLink className="size-4" />
                </a>
              )}
              <button
                className="flex size-8 items-center justify-center rounded-full bg-card/90 shadow hover:bg-secondary"
                onClick={() => setModalImage(null)}
                aria-label="Close photo"
              >
                <X className="size-4" />
              </button>
            </div>
            <Image
              src={modalImage}
              alt={`Full size photo for ${p.segment_id}`}
              width={960}
              height={720}
              className="h-auto max-h-[80vh] w-full object-contain"
            />
            <div className="flex items-center justify-between p-4">
              <p className="text-sm font-medium text-foreground">{p.segment_id}</p>
              <Badge
                variant={riskVariant}
                className="text-[10px]"
                style={{ background: `${RISK_COLORS[p.heat_risk_proxy]}20`, color: RISK_COLORS[p.heat_risk_proxy], borderColor: RISK_COLORS[p.heat_risk_proxy] }}
              >
                {RISK_LABELS[p.heat_risk_proxy]} Risk
              </Badge>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function MetricRow({
  icon,
  label,
  value,
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
