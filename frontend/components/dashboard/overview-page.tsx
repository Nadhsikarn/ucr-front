"use client"
import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MapPin,
  Thermometer,
  Droplets,
  MessageSquare,
  Cpu,
  Camera,
  Users,
  Layers,
  Activity,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react"
//เดิม import { surveyStats, climateSignals, communityInputs, climateEvents } from "@/lib/mock-data"
//แก้ละลบ import { type ClimateEvent } from "@/lib/mock-data"
function StatItem({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  unit?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-lg font-semibold text-foreground">
          {value}
          {unit && <span className="ml-0.5 text-sm font-normal text-muted-foreground">{unit}</span>}
        </span>
      </div>
    </div>
  )
}

export function OverviewPage() {
  const [surveyStats, setSurveyStats] = useState<any>(null)
  const [climateSignals, setClimateSignals] = useState<any>(null)
  const [communityInputs, setCommunityInputs] = useState<any>(null)
  const [recentEvents, setRecentEvents] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/overview")
      .then((r) => r.json())
      .then((data) => {
        setSurveyStats(data.surveyStats)
        setClimateSignals(data.climateSignals)
        setCommunityInputs(data.communityInputs)
        setRecentEvents(data.climateEvents)
      })
  }, [])

  if (!surveyStats || !climateSignals || !communityInputs) return null

  return (
    <div className="flex flex-col gap-6">
      {/* Description */}
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground lg:text-2xl text-balance">
          Platform Overview
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          This platform integrates survey-based vulnerability data with real-time environmental and
          perception signals to support urban heat and flood resilience research in Bangkok.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Survey & GIS Coverage */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary/10">
                <Layers className="size-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm">Survey & GIS Coverage</CardTitle>
                <CardDescription>Core research data</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <StatItem icon={Users} label="Households Surveyed" value={surveyStats.total_households.toLocaleString()} />
              <StatItem icon={MapPin} label="Administrative Zones" value={surveyStats.zones_count} />
              <StatItem icon={Layers} label="Variables Tracked" value={surveyStats.variables_tracked} />
              <div className="mt-1 border-t pt-3">
                <p className="text-xs text-muted-foreground">
                  Last updated: {surveyStats.last_updated}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Climate Signals */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-md bg-destructive/10">
                <Activity className="size-4 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-sm">Recent Climate Signals</CardTitle>
                <CardDescription>Environmental monitoring</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <StatItem icon={Thermometer} label="Heat Alerts (30d)" value={climateSignals.heat_alerts} />
              <StatItem icon={Droplets} label="Heavy Rainfall Events" value={climateSignals.heavy_rainfall_events} />
              <StatItem icon={Thermometer} label="Avg. Temperature" value={climateSignals.avg_temperature} unit="C" />
              <div className="mt-1 border-t pt-3">
                <div className="flex items-center gap-1 text-xs text-accent">
                  <TrendingUp className="size-3" />
                  <span className="font-medium">+2.1C above seasonal average</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Community & Field Inputs */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-md bg-accent/10">
                <MessageSquare className="size-4 text-accent" />
              </div>
              <div>
                <CardTitle className="text-sm">Community & Field Inputs</CardTitle>
                <CardDescription>Complementary data sources</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <StatItem icon={MessageSquare} label="Chatbot Reports" value={communityInputs.chatbot_reports.toLocaleString()} />
              <StatItem icon={Cpu} label="Sensor Points" value={communityInputs.sensor_points} />
              <StatItem icon={Camera} label="Street-level Images" value={communityInputs.street_images} />
              <div className="mt-1 border-t pt-3">
                <p className="text-xs text-muted-foreground">
                  {communityInputs.active_contributors} active contributors
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events Preview */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-semibold text-foreground">Recent Events</h3>
        <div className="grid gap-3 lg:grid-cols-3">
          {recentEvents.map((event) => (
            <Card key={event.id} className="py-4">
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="secondary"
                    className={
                      event.type === "heat"
                        ? "border-destructive/20 bg-destructive/10 text-destructive"
                        : "border-primary/20 bg-primary/10 text-primary"
                    }
                  >
                    {event.type === "heat" ? (
                      <Thermometer className="mr-1 size-3" />
                    ) : (
                      <Droplets className="mr-1 size-3" />
                    )}
                    {event.type === "heat" ? "Heat" : "Rain"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{new Date(event.event_date).toISOString().split("T")[0]}</span>
                </div>
                <h4 className="text-sm font-medium text-foreground">{event.title}</h4>
                <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                  {event.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {event.zones.slice(0, 2).map((zone) => (
                    <Badge key={zone} variant="outline" className="text-xs">
                      {zone}
                    </Badge>
                  ))}
                  {event.zones.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{event.zones.length - 2} more
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-primary">
                  <ArrowUpRight className="size-3" />
                  <span>{event.chatbot_responses} chatbot responses</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
