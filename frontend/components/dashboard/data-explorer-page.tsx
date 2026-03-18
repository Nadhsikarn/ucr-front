"use client"

import { useState, useMemo } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { Filter, TableIcon, BarChart3 } from "lucide-react"
import { explorerData, perceptionVsSensorData, temporalTrendData } from "@/lib/mock-data"

// Compute colors in JS for Recharts
const CHART_COLORS = {
  primary: "#3b7ea1",
  accent: "#2a9d6e",
  destructive: "#c4533a",
  muted: "#8a9bae",
}

export function DataExplorerPage() {
  const [hazardFilter, setHazardFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [zoneFilter, setZoneFilter] = useState<string>("all")

  const filteredData = useMemo(() => {
    return explorerData.filter((row) => {
      if (hazardFilter !== "all" && row.hazardType !== hazardFilter) return false
      if (sourceFilter !== "all" && row.dataSource !== sourceFilter) return false
      if (zoneFilter !== "all" && row.zone !== zoneFilter) return false
      return true
    })
  }, [hazardFilter, sourceFilter, zoneFilter])

  const zones = useMemo(() => {
    const unique = [...new Set(explorerData.map((d) => d.zone))]
    return unique.sort()
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground lg:text-2xl text-balance">
          Data Explorer
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Filter and explore structured data across hazard types, data sources, and geographic zones.
        </p>
      </div>

      {/* Filter Panel */}
      <Card className="py-4">
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Filters</span>
            </div>

            <Select value={hazardFilter} onValueChange={setHazardFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Hazard Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hazards</SelectItem>
                <SelectItem value="heat">Heat</SelectItem>
                <SelectItem value="flood">Flood</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Data Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="survey">Survey</SelectItem>
                <SelectItem value="chatbot">Chatbot</SelectItem>
                <SelectItem value="sensor">Sensor</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>

            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                {zones.map((zone) => (
                  <SelectItem key={zone} value={zone}>
                    {zone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(hazardFilter !== "all" || sourceFilter !== "all" || zoneFilter !== "all") && (
              <button
                onClick={() => {
                  setHazardFilter("all")
                  setSourceFilter("all")
                  setZoneFilter("all")
                }}
                className="text-xs text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TableIcon className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm">
              Data Records ({filteredData.length} results)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zone</TableHead>
                <TableHead>Hazard</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Indicator</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-foreground">{row.zone}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        row.hazardType === "heat"
                          ? "border-destructive/20 bg-destructive/10 text-destructive"
                          : "border-primary/20 bg-primary/10 text-primary"
                      }
                    >
                      {row.hazardType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-xs">
                      {row.dataSource}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.indicator}</TableCell>
                  <TableCell className="text-right font-mono font-medium text-foreground">
                    {row.value}
                    <span className="ml-0.5 text-xs text-muted-foreground">{row.unit}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.date}</TableCell>
                </TableRow>
              ))}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No records match the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Perception vs Sensor Comparison */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">Perception vs Sensor Comparison</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                sensorTemp: {
                  label: "Sensor Temp (C)",
                  color: CHART_COLORS.primary,
                },
                perceivedStress: {
                  label: "Perceived Stress (/5)",
                  color: CHART_COLORS.destructive,
                },
              }}
              className="h-[280px]"
            >
              <LineChart data={perceptionVsSensorData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="sensorTemp"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS.primary, r: 3 }}
                  name="Sensor Temp (C)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="perceivedStress"
                  stroke={CHART_COLORS.destructive}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS.destructive, r: 3 }}
                  name="Perceived Stress (/5)"
                />
              </LineChart>
            </ChartContainer>
            <div className="mt-3 flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.primary }} />
                <span className="text-muted-foreground">Sensor Temp (C)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.destructive }} />
                <span className="text-muted-foreground">Perceived Stress (/5)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Temporal Trends */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">Rainfall vs Chatbot Reports</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                rainfall: {
                  label: "Rainfall (mm)",
                  color: CHART_COLORS.primary,
                },
                chatbotReports: {
                  label: "Chatbot Reports",
                  color: CHART_COLORS.accent,
                },
              }}
              className="h-[280px]"
            >
              <BarChart data={temporalTrendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar yAxisId="left" dataKey="rainfall" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} name="Rainfall (mm)" />
                <Bar yAxisId="right" dataKey="chatbotReports" fill={CHART_COLORS.accent} radius={[4, 4, 0, 0]} name="Chatbot Reports" />
              </BarChart>
            </ChartContainer>
            <div className="mt-3 flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.primary }} />
                <span className="text-muted-foreground">Rainfall (mm)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.accent }} />
                <span className="text-muted-foreground">Chatbot Reports</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
