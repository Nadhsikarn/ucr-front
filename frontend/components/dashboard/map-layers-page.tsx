"use client"

import { useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  X,
  Cpu,
  MessageSquare,
  Camera,
} from "lucide-react"
import { mapLayers, mapPoints, type MapLayer, type MapPoint } from "@/lib/mock-data"
import { BangkokMap } from "./bangkok-map"

const typeIcons = {
  sensor: Cpu,
  chatbot: MessageSquare,
  image: Camera,
}

const typeColors = {
  sensor: "bg-primary text-primary-foreground",
  chatbot: "bg-accent text-accent-foreground",
  image: "bg-chart-5 text-foreground",
}

export function MapLayersPage() {
  const [layers, setLayers] = useState<MapLayer[]>(mapLayers)
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null)

  function toggleLayer(id: string) {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l))
    )
  }

  const handleSelectPoint = useCallback((point: MapPoint) => {
    setSelectedPoint(point)
  }, [])

  const groupedLayers = {
    base: layers.filter((l) => l.group === "base"),
    survey: layers.filter((l) => l.group === "survey"),
    complementary: layers.filter((l) => l.group === "complementary"),
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground lg:text-2xl text-balance">
          Map & Layers
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Interactive city map with toggleable data layers. Click on data points to view details in the side panel.
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Layer Panel */}
        <Card className="w-full shrink-0 lg:w-72">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Layer Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-auto lg:h-[520px]">
              <div className="flex flex-col gap-4">
                {/* Base Layers */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Base Layers
                  </span>
                  {groupedLayers.base.map((layer) => (
                    <LayerToggle key={layer.id} layer={layer} onToggle={toggleLayer} />
                  ))}
                </div>

                <Separator />

                {/* Survey Layers */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Survey Layers
                  </span>
                  {groupedLayers.survey.map((layer) => (
                    <LayerToggle key={layer.id} layer={layer} onToggle={toggleLayer} />
                  ))}
                </div>

                <Separator />

                {/* Complementary Layers */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Complementary Layers
                  </span>
                  {groupedLayers.complementary.map((layer) => (
                    <LayerToggle key={layer.id} layer={layer} onToggle={toggleLayer} />
                  ))}
                </div>

                <Separator />

                {/* Legend */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Legend
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="size-2.5 rounded-full bg-primary" />
                      <span className="text-xs text-muted-foreground">IoT Sensor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-2.5 rounded-full bg-accent" />
                      <span className="text-xs text-muted-foreground">Chatbot Report</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-2.5 rounded-full bg-chart-5" />
                      <span className="text-xs text-muted-foreground">Image Survey</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Map Area */}
        <Card className="min-h-[400px] flex-1 lg:min-h-[580px]">
          <CardContent className="relative h-full p-0">
            <div className="h-full min-h-[400px] overflow-hidden rounded-xl lg:min-h-[556px]">
              <BangkokMap
                layers={layers}
                points={mapPoints}
                onSelectPoint={handleSelectPoint}
                selectedPoint={selectedPoint}
              />
            </div>
          </CardContent>
        </Card>

        {/* Detail Side Panel */}
        {selectedPoint && (
          <Card className="w-full shrink-0 lg:w-72">
            <CardHeader className="flex-row items-start justify-between pb-3">
              <CardTitle className="text-sm">Point Details</CardTitle>
              <button
                onClick={() => setSelectedPoint(null)}
                className="flex size-6 items-center justify-center rounded-md hover:bg-secondary"
                aria-label="Close details panel"
              >
                <X className="size-3.5" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = typeIcons[selectedPoint.type]
                    return (
                      <div className={`flex size-8 items-center justify-center rounded-lg ${typeColors[selectedPoint.type]}`}>
                        <Icon className="size-4" />
                      </div>
                    )
                  })()}
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedPoint.label}</p>
                    <p className="text-xs text-muted-foreground capitalize">{selectedPoint.type}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Zone</span>
                    <span className="text-xs font-medium text-foreground">{selectedPoint.zone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Value</span>
                    <span className="text-xs font-medium text-foreground">{selectedPoint.value}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Date</span>
                    <span className="text-xs font-medium text-foreground">{selectedPoint.date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Coordinates</span>
                    <span className="text-xs font-medium text-foreground">
                      {selectedPoint.lat.toFixed(3)}, {selectedPoint.lng.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function LayerToggle({
  layer,
  onToggle,
}: {
  layer: MapLayer
  onToggle: (id: string) => void
}) {
  return (
    <div className="flex items-start gap-3">
      <Switch
        checked={layer.enabled}
        onCheckedChange={() => onToggle(layer.id)}
        aria-label={`Toggle ${layer.name}`}
      />
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-foreground leading-tight">{layer.name}</span>
        <span className="text-xs text-muted-foreground leading-tight">{layer.description}</span>
      </div>
    </div>
  )
}
