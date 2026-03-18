"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import useSWR from "swr"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart"
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  Brush,
} from "recharts"
import {
  Download,
  ImageIcon,
  FileSpreadsheet,
  Thermometer,
  Droplets,
  Flame,
  Clock,
  TrendingUp,
  X,
} from "lucide-react"
import Image from "next/image"

// Computed colors for Recharts (CSS vars don't work)
const COLORS = {
  temp: "#3b7ea1",
  humidity: "#e8922a",
  heatIndex: "#d4463a",
  highBand: "rgba(245, 190, 80, 0.22)",
  extremeBand: "rgba(230, 100, 100, 0.18)",
}

// Walk segments matching the reference image (Thai labels)
const SEGMENTS = [
  { id: "seg-1", name: "หลักสี่ 99", start: "09:00", end: "09:50", color: "#3b7ea1" },
  { id: "seg-2", name: "แจ้งวัฒนะ 5", start: "09:50", end: "10:45", color: "#e8922a" },
  { id: "seg-3", name: "ชุมชนหลังแฟลต", start: "10:45", end: "12:00", color: "#d4463a" },
]

// Survey images placed at specific times along the walk
const SURVEY_IMAGES = [
  { time: "09:05", src: "/images/survey/walk-01.jpg", caption: "Residential soi, partial shade" },
  { time: "09:20", src: "/images/survey/walk-04.jpg", caption: "Canal area with tree cover" },
  { time: "09:38", src: "/images/survey/walk-06.jpg", caption: "Street market, tin roofing" },
  { time: "10:05", src: "/images/survey/walk-02.jpg", caption: "Exposed asphalt, no shade" },
  { time: "10:30", src: "/images/survey/walk-05.jpg", caption: "Government flats, full sun" },
  { time: "11:10", src: "/images/survey/walk-03.jpg", caption: "Community alley behind flats" },
]

export type HeatReading = {
  id: string
  dateTime: string
  temp: number
  humidity: number
  lat: number
  lng: number
  heatIndex: number
  riskLevel: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

/** Format "2026-03-01 09:15:30" -> "09:15" */
function timeLabel(dt: string) {
  const parts = dt.split(" ")
  if (parts.length < 2) return dt
  return parts[1].slice(0, 5)
}

/** Parse "HH:MM" to minutes for comparison */
function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

export function SurveyWalkPage() {
  const { data, isLoading, error } = useSWR<HeatReading[]>("/api/heat-data", fetcher)
  const [highHeatOnly, setHighHeatOnly] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [lightboxImage, setLightboxImage] = useState<typeof SURVEY_IMAGES[0] | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  // Process data for the chart
  const chartData = useMemo(() => {
    if (!data) return []
    const processed = data.map((d) => ({
      ...d,
      time: timeLabel(d.dateTime),
      timeMin: toMinutes(timeLabel(d.dateTime)),
    }))
    if (highHeatOnly) {
      return processed.filter((d) => d.heatIndex >= 38)
    }
    return processed
  }, [data, highHeatOnly])

  // Find the nearest survey image for a given time index
  const nearestImage = useMemo(() => {
    if (hoveredIndex === null || !chartData[hoveredIndex]) return null
    const hoverMin = chartData[hoveredIndex].timeMin
    let best = SURVEY_IMAGES[0]
    let bestDist = Infinity
    for (const img of SURVEY_IMAGES) {
      const dist = Math.abs(toMinutes(img.time) - hoverMin)
      if (dist < bestDist) {
        bestDist = dist
        best = img
      }
    }
    return best
  }, [hoveredIndex, chartData])

  // Analytics computations
  const analytics = useMemo(() => {
    if (!data || data.length < 2) return null

    // Cumulative heat exposure: trapezoidal integration of HI over time (seconds)
    let cumulativeHI = 0
    for (let i = 1; i < data.length; i++) {
      const dt = 30 // each sample is ~30 seconds apart
      const avgHI = (data[i - 1].heatIndex + data[i].heatIndex) / 2
      cumulativeHI += avgHI * dt
    }

    // Top 5 hottest 5-minute segments
    const windowSize = 10 // 10 samples = ~5 min at 30s intervals
    const segments: { startTime: string; endTime: string; avgHI: number; avgTemp: number; maxHI: number }[] = []
    for (let i = 0; i + windowSize <= data.length; i += windowSize) {
      const window = data.slice(i, i + windowSize)
      const avgHI = window.reduce((s, d) => s + d.heatIndex, 0) / window.length
      const avgTemp = window.reduce((s, d) => s + d.temp, 0) / window.length
      const maxHI = Math.max(...window.map((d) => d.heatIndex))
      segments.push({
        startTime: timeLabel(window[0].dateTime),
        endTime: timeLabel(window[window.length - 1].dateTime),
        avgHI: Math.round(avgHI * 100) / 100,
        avgTemp: Math.round(avgTemp * 10) / 10,
        maxHI: Math.round(maxHI * 100) / 100,
      })
    }
    const top5 = [...segments].sort((a, b) => b.avgHI - a.avgHI).slice(0, 5)

    // Segment-level comparison
    const segmentStats = SEGMENTS.map((seg) => {
      const segData = data.filter((d) => {
        const tMin = toMinutes(timeLabel(d.dateTime))
        return tMin >= toMinutes(seg.start) && tMin < toMinutes(seg.end)
      })
      if (segData.length === 0) return { ...seg, avgTemp: 0, avgHumidity: 0, avgHI: 0, maxHI: 0, dangerCount: 0, total: 0 }
      return {
        ...seg,
        avgTemp: Math.round(segData.reduce((s, d) => s + d.temp, 0) / segData.length * 10) / 10,
        avgHumidity: Math.round(segData.reduce((s, d) => s + d.humidity, 0) / segData.length * 10) / 10,
        avgHI: Math.round(segData.reduce((s, d) => s + d.heatIndex, 0) / segData.length * 100) / 100,
        maxHI: Math.round(Math.max(...segData.map((d) => d.heatIndex)) * 100) / 100,
        dangerCount: segData.filter((d) => d.riskLevel === "Danger").length,
        total: segData.length,
      }
    })

    return { cumulativeHI: Math.round(cumulativeHI), top5, segmentStats }
  }, [data])

  // Export handlers
  const exportCSV = useCallback(() => {
    if (!data) return
    const header = "DateTime,Temp_C,Humidity_pct,Latitude,Longitude,Heat_Index_C,Risk_Level"
    const rows = data.map((d) =>
      `${d.dateTime},${d.temp},${d.humidity},${d.lat},${d.lng},${d.heatIndex},${d.riskLevel}`
    )
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "survey-walk-heat-data.csv"
    a.click()
    URL.revokeObjectURL(url)
  }, [data])

  const exportPNG = useCallback(() => {
    if (!chartRef.current) return
    const svgEl = chartRef.current.querySelector("svg")
    if (!svgEl) return
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      canvas.width = img.width * 2
      canvas.height = img.height * 2
      ctx.fillStyle = "#fff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const pngUrl = canvas.toDataURL("image/png")
      const a = document.createElement("a")
      a.href = pngUrl
      a.download = "survey-walk-chart.png"
      a.click()
    }
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
  }, [])

  const chartConfig = {
    temp: { label: "Temperature (C)", color: COLORS.temp },
    humidity: { label: "Humidity (%)", color: COLORS.humidity },
    heatIndex: { label: "Heat Index (C)", color: COLORS.heatIndex },
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading survey walk data...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24">
        <p className="text-sm text-destructive">Failed to load survey data.</p>
        <p className="text-xs text-muted-foreground">Check that the heat index CSV is available.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground lg:text-2xl text-balance">
          Survey Walk
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Interactive time-series from the March 1, 2026 heat survey walk across three segments in northern Bangkok.
          Hover over the chart to see the nearest survey photograph. Use the brush below the chart to zoom into a specific time range.
        </p>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="high-heat-filter"
            checked={highHeatOnly}
            onCheckedChange={setHighHeatOnly}
          />
          <label htmlFor="high-heat-filter" className="text-xs font-medium text-foreground">
            {'Show only high heat stress (>38\u00b0C)'}
          </label>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={exportPNG}>
                  <ImageIcon className="mr-1.5 size-3.5" />
                  PNG
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export chart as PNG image</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <FileSpreadsheet className="mr-1.5 size-3.5" />
                  CSV
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export data as CSV file</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Main chart + image panel */}
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Chart card */}
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Temperature, Humidity & Heat Index with Heat Stress Thresholds</CardTitle>
            <CardDescription className="text-xs">
              Walk from 09:00 to 11:54 across three neighborhoods. Yellow band = High heat stress (38-41C). Red band = Extreme heat stress ({'>'}41C).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={chartRef}>
              <ChartContainer config={chartConfig} className="h-[400px] w-full lg:h-[480px]">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 16, left: 0, bottom: 40 }}
                  onMouseMove={(state) => {
                    if (state?.activeTooltipIndex !== undefined) {
                      setHoveredIndex(state.activeTooltipIndex)
                    }
                  }}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />

                  {/* Heat stress threshold bands */}
                  <ReferenceArea y1={38} y2={41} fill={COLORS.highBand} fillOpacity={1} />
                  <ReferenceArea y1={41} y2={55} fill={COLORS.extremeBand} fillOpacity={1} />
                  <ReferenceLine y={38} stroke="#c9a227" strokeDasharray="4 4" strokeWidth={1} />
                  <ReferenceLine y={41} stroke="#c45040" strokeDasharray="4 4" strokeWidth={1} />

                  {/* Segment divider lines */}
                  {SEGMENTS.slice(1).map((seg) => {
                    const idx = chartData.findIndex((d) => d.time >= seg.start)
                    if (idx < 0) return null
                    return (
                      <ReferenceLine
                        key={seg.id}
                        x={chartData[idx].time}
                        stroke="#999"
                        strokeDasharray="6 3"
                        strokeWidth={1}
                      />
                    )
                  })}

                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                    tickCount={12}
                  />
                  <YAxis
                    domain={[0, 70]}
                    tick={{ fontSize: 10 }}
                    label={{
                      value: "Value",
                      angle: -90,
                      position: "insideLeft",
                      style: { fontSize: 11, fill: "#888" },
                    }}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0]?.payload
                      return (
                        <div className="rounded-lg border bg-card p-3 text-xs shadow-md">
                          <p className="mb-1.5 font-semibold text-foreground">{d?.dateTime}</p>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div className="size-2 rounded-full" style={{ background: COLORS.temp }} />
                              <span className="text-muted-foreground">Temp:</span>
                              <span className="font-medium text-foreground">{d?.temp}C</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="size-2 rounded-full" style={{ background: COLORS.humidity }} />
                              <span className="text-muted-foreground">Humidity:</span>
                              <span className="font-medium text-foreground">{d?.humidity}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="size-2 rounded-full" style={{ background: COLORS.heatIndex }} />
                              <span className="text-muted-foreground">Heat Index:</span>
                              <span className="font-medium text-foreground">{d?.heatIndex}C</span>
                            </div>
                            <Badge
                              variant={d?.riskLevel === "Danger" ? "destructive" : "secondary"}
                              className="mt-1 w-fit text-[10px]"
                            >
                              {d?.riskLevel}
                            </Badge>
                          </div>
                        </div>
                      )
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="temp"
                    stroke={COLORS.temp}
                    strokeWidth={1.5}
                    dot={false}
                    name="Temperature (C)"
                  />
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    stroke={COLORS.humidity}
                    strokeWidth={1.5}
                    dot={false}
                    name="Humidity (%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="heatIndex"
                    stroke={COLORS.heatIndex}
                    strokeWidth={2}
                    dot={false}
                    name="Heat Index (C)"
                  />

                  <Brush
                    dataKey="time"
                    height={28}
                    stroke={COLORS.temp}
                    travellerWidth={8}
                    y={440}
                    fill="var(--color-secondary, #f5f5f5)"
                  />
                </LineChart>
              </ChartContainer>
            </div>

            {/* Segment labels below chart */}
            <div className="mt-2 flex items-center gap-0">
              {SEGMENTS.map((seg) => (
                <div
                  key={seg.id}
                  className="flex flex-1 flex-col items-center gap-1 border-t-2 py-2"
                  style={{ borderColor: seg.color }}
                >
                  <span className="text-[11px] font-semibold text-foreground">{seg.name}</span>
                  <span className="text-[10px] text-muted-foreground">{seg.start} - {seg.end}</span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-4 rounded" style={{ background: COLORS.temp }} />
                <span>Temperature (C)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-4 rounded" style={{ background: COLORS.humidity }} />
                <span>Humidity (%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-4 rounded" style={{ background: COLORS.heatIndex }} />
                <span>Heat Index (C)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded-sm" style={{ background: COLORS.highBand }} />
                <span>{'High heat stress (38-41\u00b0C)'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded-sm" style={{ background: COLORS.extremeBand }} />
                <span>{'Extreme heat stress (>41\u00b0C)'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hover image panel */}
        <Card className="w-full shrink-0 lg:w-64">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Survey Photo</CardTitle>
            <CardDescription className="text-xs">
              Hover over the chart timeline to see the nearest photo from the walk.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {nearestImage ? (
              <div className="flex flex-col gap-3">
                <button
                  className="group relative overflow-hidden rounded-lg border"
                  onClick={() => setLightboxImage(nearestImage)}
                  aria-label="Click to enlarge image"
                >
                  <Image
                    src={nearestImage.src}
                    alt={nearestImage.caption}
                    width={256}
                    height={192}
                    className="h-auto w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/10">
                    <span className="rounded-md bg-card/90 px-2 py-1 text-[10px] font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      Click to enlarge
                    </span>
                  </div>
                </button>
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-foreground">{nearestImage.caption}</p>
                  <p className="text-[10px] text-muted-foreground">Taken at ~{nearestImage.time}</p>
                </div>
                {hoveredIndex !== null && chartData[hoveredIndex] && (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Heat Index</span>
                        <span className="text-xs font-medium text-foreground">
                          {chartData[hoveredIndex].heatIndex}C
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Temperature</span>
                        <span className="text-xs font-medium text-foreground">
                          {chartData[hoveredIndex].temp}C
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Humidity</span>
                        <span className="text-xs font-medium text-foreground">
                          {chartData[hoveredIndex].humidity}%
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <ImageIcon className="size-8 opacity-40" />
                <p className="text-xs">Hover over the chart to see a photo</p>
              </div>
            )}

            {/* Image gallery thumbnails */}
            <Separator className="my-3" />
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">All survey photos</p>
            <div className="grid grid-cols-3 gap-1.5">
              {SURVEY_IMAGES.map((img) => (
                <button
                  key={img.time}
                  className="group relative overflow-hidden rounded-md border"
                  onClick={() => setLightboxImage(img)}
                  aria-label={`View ${img.caption}`}
                >
                  <Image
                    src={img.src}
                    alt={img.caption}
                    width={80}
                    height={60}
                    className="h-auto w-full object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-foreground/60 px-1 py-0.5 text-[8px] text-card">
                    {img.time}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lightbox modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-4"
          onClick={() => setLightboxImage(null)}
          role="dialog"
          aria-label="Image lightbox"
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-xl border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-card/90 shadow hover:bg-secondary"
              onClick={() => setLightboxImage(null)}
              aria-label="Close lightbox"
            >
              <X className="size-4" />
            </button>
            <Image
              src={lightboxImage.src}
              alt={lightboxImage.caption}
              width={960}
              height={720}
              className="h-auto max-h-[80vh] w-full object-contain"
            />
            <div className="p-4">
              <p className="text-sm font-medium text-foreground">{lightboxImage.caption}</p>
              <p className="text-xs text-muted-foreground">Taken at ~{lightboxImage.time}</p>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Panel */}
      {analytics && (
        <>
          <Separator />
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-foreground">Heat Exposure Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Computed from {data.length} downsampled readings spanning the full survey walk.
            </p>
          </div>

          {/* Summary stat cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-start gap-3 pt-5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10">
                  <Flame className="size-5 text-destructive" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Cumulative Heat Exposure</span>
                  <span className="text-lg font-bold text-foreground tabular-nums">
                    {(analytics.cumulativeHI / 3600).toFixed(1)} C-hr
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {'(\u222B HI \u00B7 dt over walk duration)'}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-start gap-3 pt-5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Thermometer className="size-5 text-primary" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Peak Heat Index</span>
                  <span className="text-lg font-bold text-foreground tabular-nums">
                    {Math.max(...data.map((d) => d.heatIndex)).toFixed(1)}C
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Maximum recorded during walk
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-start gap-3 pt-5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-accent/10">
                  <Clock className="size-5 text-accent" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Time in Danger Zone</span>
                  <span className="text-lg font-bold text-foreground tabular-nums">
                    {Math.round(data.filter((d) => d.riskLevel === "Danger").length / data.length * 100)}%
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {data.filter((d) => d.riskLevel === "Danger").length} of {data.length} readings
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top 5 hottest segments */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="size-4 text-destructive" />
                Top 5 Hottest Segments (5-minute windows)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {analytics.top5.map((seg, i) => (
                  <div
                    key={`${seg.startTime}-${i}`}
                    className="flex items-center gap-3 rounded-lg border bg-secondary/40 px-4 py-2.5"
                  >
                    <span className="flex size-6 items-center justify-center rounded-full bg-destructive/15 text-xs font-bold text-destructive">
                      {i + 1}
                    </span>
                    <div className="flex flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
                      <span className="text-xs font-medium text-foreground">
                        {seg.startTime} - {seg.endTime}
                      </span>
                      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                        <span>
                          Avg HI: <strong className="text-foreground">{seg.avgHI}C</strong>
                        </span>
                        <span>
                          Max HI: <strong className="text-foreground">{seg.maxHI}C</strong>
                        </span>
                        <span>
                          Avg Temp: <strong className="text-foreground">{seg.avgTemp}C</strong>
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={seg.maxHI > 41 ? "destructive" : "secondary"}
                      className="text-[10px]"
                    >
                      {seg.maxHI > 41 ? "Extreme" : "High"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Segment comparison cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {analytics.segmentStats.map((seg) => (
              <Card key={seg.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full" style={{ background: seg.color }} />
                    <CardTitle className="text-sm">{seg.name}</CardTitle>
                  </div>
                  <CardDescription className="text-[10px]">{seg.start} - {seg.end}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Thermometer className="size-3" /> Avg Temp
                      </span>
                      <span className="font-medium text-foreground">{seg.avgTemp}C</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Droplets className="size-3" /> Avg Humidity
                      </span>
                      <span className="font-medium text-foreground">{seg.avgHumidity}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Flame className="size-3" /> Avg Heat Index
                      </span>
                      <span className="font-medium text-foreground">{seg.avgHI}C</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <TrendingUp className="size-3" /> Max Heat Index
                      </span>
                      <span className="font-medium text-foreground">{seg.maxHI}C</span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Danger readings</span>
                      <Badge variant={seg.dangerCount > 0 ? "destructive" : "secondary"} className="text-[10px]">
                        {seg.dangerCount} / {seg.total}
                        {seg.total > 0 ? ` (${Math.round(seg.dangerCount / seg.total * 100)}%)` : ""}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
