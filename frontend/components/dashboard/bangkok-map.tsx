"use client"

import { useEffect, useRef, useState } from "react"
import type { MapLayer, MapPoint } from "@/lib/mock-data"

const BANGKOK_CENTER: [number, number] = [13.756, 100.532]
const DEFAULT_ZOOM = 12

const ZONE_OVERLAYS = {
  heatVuln: {
    bounds: [
      [13.84, 100.52],
      [13.88, 100.58],
    ] as [[number, number], [number, number]],
    color: "#e45858",
    label: "Heat Vulnerability Zone",
  },
  floodExp: {
    bounds: [
      [13.66, 100.59],
      [13.72, 100.66],
    ] as [[number, number], [number, number]],
    color: "#3b7ea1",
    label: "Flood Exposure Zone",
  },
}

const CANAL_PATH: [number, number][] = [
  [13.82, 100.49],
  [13.79, 100.50],
  [13.76, 100.50],
  [13.73, 100.51],
  [13.70, 100.51],
  [13.68, 100.50],
  [13.65, 100.50],
]

const typeColors: Record<string, string> = {
  sensor: "#3b7ea1",
  chatbot: "#2d9c6f",
  image: "#b5900a",
}

interface BangkokMapProps {
  layers: MapLayer[]
  points: MapPoint[]
  onSelectPoint: (point: MapPoint) => void
  selectedPoint: MapPoint | null
}

export function BangkokMap({
  layers,
  points,
  onSelectPoint,
  selectedPoint,
}: BangkokMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const clusterMarkersRef = useRef<L.Marker[]>([])
  const overlaysRef = useRef<L.Layer[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Initialize the map
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return
    let cancelled = false

    async function initMap() {
      const L = (await import("leaflet")).default
      await import("leaflet/dist/leaflet.css")
      if (cancelled || !mapRef.current) return

      const map = L.map(mapRef.current, {
        center: BANGKOK_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
        attributionControl: true,
      })

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map)

      leafletMapRef.current = map
      setIsLoaded(true)
    }

    initMap()
    return () => {
      cancelled = true
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [])

  // Update overlays when layers change
  useEffect(() => {
    if (!leafletMapRef.current || !isLoaded) return

    async function updateOverlays() {
      const L = (await import("leaflet")).default
      const map = leafletMapRef.current!

      overlaysRef.current.forEach((layer) => map.removeLayer(layer))
      overlaysRef.current = []

      if (layers.find((l) => l.id === "admin-boundaries" && l.enabled)) {
        const rect = L.rectangle(
          [[13.62, 100.35], [13.92, 100.70]],
          { color: "#555", weight: 1.5, fillOpacity: 0, dashArray: "6 3" }
        ).addTo(map)
        rect.bindTooltip("Bangkok Metropolitan Area", { permanent: false, direction: "top" })
        overlaysRef.current.push(rect)
      }

      if (layers.find((l) => l.id === "heat-vuln" && l.enabled)) {
        const rect = L.rectangle(ZONE_OVERLAYS.heatVuln.bounds, {
          color: ZONE_OVERLAYS.heatVuln.color, weight: 1.5,
          fillOpacity: 0.12, fillColor: ZONE_OVERLAYS.heatVuln.color,
        }).addTo(map)
        rect.bindTooltip(ZONE_OVERLAYS.heatVuln.label, { permanent: false, direction: "top" })
        overlaysRef.current.push(rect)
      }

      if (layers.find((l) => l.id === "flood-exp" && l.enabled)) {
        const rect = L.rectangle(ZONE_OVERLAYS.floodExp.bounds, {
          color: ZONE_OVERLAYS.floodExp.color, weight: 1.5,
          fillOpacity: 0.12, fillColor: ZONE_OVERLAYS.floodExp.color,
        }).addTo(map)
        rect.bindTooltip(ZONE_OVERLAYS.floodExp.label, { permanent: false, direction: "top" })
        overlaysRef.current.push(rect)
      }

      if (layers.find((l) => l.id === "canal-flood" && l.enabled)) {
        const polyline = L.polyline(CANAL_PATH, {
          color: "#3b7ea1", weight: 5, opacity: 0.45, lineCap: "round",
        }).addTo(map)
        polyline.bindTooltip("Canal / Flood-prone Zone", { permanent: false, direction: "top" })
        overlaysRef.current.push(polyline)
      }
    }

    updateOverlays()
  }, [layers, isLoaded])

  // Update markers when points or layers change
  useEffect(() => {
    if (!leafletMapRef.current || !isLoaded) return

    async function updateMarkers() {
      const L = (await import("leaflet")).default
      const map = leafletMapRef.current!

      // Clear all existing markers
      markersRef.current.forEach((m) => map.removeLayer(m))
      markersRef.current = []
      clusterMarkersRef.current.forEach((m) => map.removeLayer(m))
      clusterMarkersRef.current = []

      const enabledLayerMap: Record<string, string> = {
        sensor: "iot-sensors",
        chatbot: "chatbot-reports",
        image: "image-indicators",
      }

      // Track which cluster parents and children to show based on zoom
      const currentZoom = map.getZoom()
      const EXPAND_ZOOM = 14

      points.forEach((point) => {
        const isLayerEnabled = layers.find(
          (l) => l.id === enabledLayerMap[point.type] && l.enabled
        )
        if (!isLayerEnabled) return

        if (point.isCluster && point.childReports) {
          if (currentZoom >= EXPAND_ZOOM) {
            // Show individual child markers
            point.childReports.forEach((child) => {
              const icon = createPointIcon(L, child, selectedPoint)
              const marker = L.marker([child.lat, child.lng], { icon }).addTo(map)
              marker.bindTooltip(
                `<strong>${child.label}</strong><br/>${child.value}`,
                { direction: "top", offset: [0, -12] }
              )
              marker.on("click", () => onSelectPoint(child))
              clusterMarkersRef.current.push(marker)
            })
          } else {
            // Show cluster bubble
            const count = point.childReports.length
            const icon = L.divIcon({
              className: "custom-cluster",
              html: `<div style="
                width: 40px; height: 40px;
                background: rgba(45,156,111,0.7);
                border: 3px solid rgba(45,156,111,0.3);
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                color: #fff; font-weight: 700; font-size: 13px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.25);
                cursor: pointer;
              ">${count}</div>`,
              iconSize: [40, 40],
              iconAnchor: [20, 20],
            })
            const marker = L.marker([point.lat, point.lng], { icon }).addTo(map)
            marker.bindTooltip(
              `<strong>${point.label}</strong><br/>${point.value}<br/><em>Zoom in to see individual reports</em>`,
              { direction: "top", offset: [0, -16] }
            )
            marker.on("click", () => {
              // Zoom into the cluster
              map.setView([point.lat, point.lng], EXPAND_ZOOM, { animate: true })
            })
            markersRef.current.push(marker)
          }
        } else {
          // Regular (non-cluster) marker
          const icon = createPointIcon(L, point, selectedPoint)
          const marker = L.marker([point.lat, point.lng], { icon }).addTo(map)
          marker.bindTooltip(
            `<strong>${point.label}</strong><br/>${point.value}`,
            { direction: "top", offset: [0, -12] }
          )
          marker.on("click", () => onSelectPoint(point))
          markersRef.current.push(marker)
        }
      })

      // Listen for zoom changes to re-render cluster expansion
      const onZoomEnd = () => updateMarkers()
      map.off("zoomend", onZoomEnd)
      map.on("zoomend", onZoomEnd)
    }

    updateMarkers()
  }, [points, layers, isLoaded, onSelectPoint, selectedPoint])

  return (
    <div className="relative h-full min-h-[400px] lg:min-h-[556px]">
      <div ref={mapRef} className="absolute inset-0 rounded-xl z-0" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-secondary">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            <span className="text-sm">Loading map...</span>
          </div>
        </div>
      )}
    </div>
  )
}

function createPointIcon(
  L: typeof import("leaflet").default,
  point: MapPoint,
  selectedPoint: MapPoint | null
) {
  const color = typeColors[point.type]
  const isSelected = selectedPoint?.id === point.id
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: ${isSelected ? "28px" : "22px"};
      height: ${isSelected ? "28px" : "22px"};
      background: ${color};
      border: 2px solid #fff;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      transition: all 0.15s ease;
      cursor: pointer;
      ${isSelected ? "outline: 2px solid " + color + "; outline-offset: 2px;" : ""}
    "></div>`,
    iconSize: [isSelected ? 28 : 22, isSelected ? 28 : 22],
    iconAnchor: [isSelected ? 14 : 11, isSelected ? 14 : 11],
  })
}
