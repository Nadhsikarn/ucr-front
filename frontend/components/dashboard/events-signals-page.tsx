"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Thermometer,
  Droplets,
  MessageSquare,
  MapPin,
  TrendingUp,
  Clock,
} from "lucide-react"
import { climateEvents } from "@/lib/mock-data"

export function EventsSignalsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground lg:text-2xl text-balance">
          Events & Signals
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Timeline of recent climate events including extreme heat days, heavy rainfall, and periods
          when chatbot prompts were triggered.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="py-3">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10">
              <Thermometer className="size-4 text-destructive" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {climateEvents.filter((e) => e.type === "heat").length}
              </p>
              <p className="text-xs text-muted-foreground">Heat Events</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <Droplets className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {climateEvents.filter((e) => e.type === "rain").length}
              </p>
              <p className="text-xs text-muted-foreground">Rain Events</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-accent/10">
              <MessageSquare className="size-4 text-accent" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {climateEvents.reduce((sum, e) => sum + e.chatbotResponses, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Reports</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-secondary">
              <MapPin className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {new Set(climateEvents.flatMap((e) => e.zones)).size}
              </p>
              <p className="text-xs text-muted-foreground">Zones Affected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <div className="relative flex flex-col gap-0">
        {climateEvents.map((event, index) => (
          <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Timeline line */}
            {index < climateEvents.length - 1 && (
              <div className="absolute left-[18px] top-10 bottom-0 w-px bg-border" />
            )}

            {/* Timeline dot */}
            <div
              className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full ${
                event.type === "heat"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {event.type === "heat" ? (
                <Thermometer className="size-4" />
              ) : (
                <Droplets className="size-4" />
              )}
            </div>

            {/* Event Card */}
            <Card className="flex-1 py-4">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={
                      event.type === "heat"
                        ? "border-destructive/20 bg-destructive/10 text-destructive"
                        : "border-primary/20 bg-primary/10 text-primary"
                    }
                  >
                    {event.type === "heat" ? "Heat" : "Rain"}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {event.date}
                  </div>
                </div>
                <CardTitle className="text-sm">{event.title}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {event.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {/* Zones */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <MapPin className="size-3 text-muted-foreground" />
                    {event.zones.map((zone) => (
                      <Badge key={zone} variant="outline" className="text-xs">
                        {zone}
                      </Badge>
                    ))}
                  </div>

                  <Separator />

                  {/* Summary Metrics */}
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {event.avgSensorTemp && (
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Avg Temp</span>
                        <span className="text-sm font-medium text-foreground">{event.avgSensorTemp}C</span>
                      </div>
                    )}
                    {event.avgSensorRainfall && (
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Avg Rainfall</span>
                        <span className="text-sm font-medium text-foreground">{event.avgSensorRainfall} mm</span>
                      </div>
                    )}
                    {event.avgSensorHumidity && (
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Avg Humidity</span>
                        <span className="text-sm font-medium text-foreground">{event.avgSensorHumidity}%</span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Chatbot Responses</span>
                      <span className="text-sm font-medium text-foreground">{event.chatbotResponses}</span>
                    </div>
                  </div>

                  {/* Themes */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <TrendingUp className="size-3 text-muted-foreground" />
                    {event.themes.map((theme) => (
                      <Badge key={theme} variant="secondary" className="text-xs capitalize">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
