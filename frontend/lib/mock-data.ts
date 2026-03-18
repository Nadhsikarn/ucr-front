// Mock data for the City Climate & Resilience Data Platform

export const surveyStats = {
  totalHouseholds: 2847,
  zonesCount: 24,
  variablesTracked: 42,
  lastUpdated: "2026-01-15",
}

export const climateSignals = {
  heatAlerts: 12,
  heavyRainfallEvents: 8,
  avgTemperature: 34.2,
  avgHumidity: 78,
}

export const communityInputs = {
  chatbotReports: 1463,
  sensorPoints: 38,
  streetImages: 892,
  activeContributors: 214,
}

export type MapLayer = {
  id: string
  name: string
  group: "base" | "survey" | "complementary"
  enabled: boolean
  description: string
}

export const mapLayers: MapLayer[] = [
  { id: "admin-boundaries", name: "Administrative Boundaries", group: "base", enabled: true, description: "Bangkok district boundaries" },
  { id: "canal-flood", name: "Canal / Flood-prone Zones", group: "base", enabled: false, description: "Waterways and historical flood zones" },
  { id: "heat-vuln", name: "Heat Vulnerability Index", group: "survey", enabled: true, description: "Household-level heat vulnerability scores" },
  { id: "flood-exp", name: "Flood Exposure Index", group: "survey", enabled: false, description: "Composite flood exposure by zone" },
  { id: "chatbot-reports", name: "Recent Chatbot Reports", group: "complementary", enabled: false, description: "LINE chatbot perception reports" },
  { id: "iot-sensors", name: "IoT Sensor Readings", group: "complementary", enabled: true, description: "Temperature, humidity, rainfall sensors" },
  { id: "image-indicators", name: "Image-derived Indicators", group: "complementary", enabled: false, description: "Shade, surface type, drainage" },
]

export type ClimateEvent = {
  id: string
  date: string
  type: "heat" | "rain"
  title: string
  zones: string[]
  avgSensorTemp?: number
  avgSensorHumidity?: number
  avgSensorRainfall?: number
  chatbotResponses: number
  themes: string[]
  description: string
}

export const climateEvents: ClimateEvent[] = [
  {
    id: "evt-001",
    date: "2026-02-18",
    type: "heat",
    title: "Extreme Heat Episode",
    zones: ["Bang Khen", "Lat Phrao", "Chatuchak"],
    avgSensorTemp: 38.7,
    avgSensorHumidity: 82,
    chatbotResponses: 147,
    themes: ["heat discomfort", "mobility disruption", "health concern"],
    description: "Three-day heat wave exceeding 38C across northern Bangkok districts. Peak temperatures recorded in mid-afternoon hours with limited shade coverage.",
  },
  {
    id: "evt-002",
    date: "2026-02-10",
    type: "rain",
    title: "Heavy Rainfall & Flash Flooding",
    zones: ["Phra Khanong", "Bang Na", "Suan Luang"],
    avgSensorRainfall: 87.3,
    avgSensorHumidity: 95,
    chatbotResponses: 203,
    themes: ["flooding", "transportation delay", "property damage"],
    description: "Intense rainfall event lasting 6+ hours. Canal overflow reported in multiple areas with street-level flooding in low-lying zones.",
  },
  {
    id: "evt-003",
    date: "2026-02-01",
    type: "heat",
    title: "Sustained High Temperature",
    zones: ["Din Daeng", "Ratchathewi"],
    avgSensorTemp: 36.9,
    avgSensorHumidity: 79,
    chatbotResponses: 89,
    themes: ["heat discomfort", "energy demand", "outdoor work risk"],
    description: "Extended period of elevated temperatures with urban heat island effects amplifying discomfort in densely built areas.",
  },
  {
    id: "evt-004",
    date: "2026-01-25",
    type: "rain",
    title: "Monsoon Surge Event",
    zones: ["Thon Buri", "Bangkok Noi", "Taling Chan"],
    avgSensorRainfall: 62.1,
    avgSensorHumidity: 92,
    chatbotResponses: 134,
    themes: ["flooding", "mobility disruption", "drainage failure"],
    description: "Unexpected monsoon resurgence causing moderate flooding in western Bangkok. Drainage systems temporarily overwhelmed.",
  },
  {
    id: "evt-005",
    date: "2026-01-18",
    type: "heat",
    title: "Nighttime Heat Stress",
    zones: ["Khlong Toei", "Watthana", "Sathon"],
    avgSensorTemp: 31.2,
    avgSensorHumidity: 85,
    chatbotResponses: 76,
    themes: ["sleep disruption", "energy demand", "health concern"],
    description: "Unusually high nighttime temperatures preventing adequate cooling. Elderly populations particularly affected.",
  },
  {
    id: "evt-006",
    date: "2026-01-12",
    type: "rain",
    title: "Localized Downpour",
    zones: ["Min Buri", "Nong Chok"],
    avgSensorRainfall: 45.8,
    avgSensorHumidity: 88,
    chatbotResponses: 52,
    themes: ["flooding", "agricultural damage"],
    description: "Concentrated heavy rainfall in eastern peri-urban areas. Agricultural plots and low-infrastructure zones reported waterlogging.",
  },
]

export type ExplorerRow = {
  id: string
  zone: string
  hazardType: "heat" | "flood"
  dataSource: "survey" | "chatbot" | "sensor" | "image"
  date: string
  value: number
  unit: string
  indicator: string
}

export const explorerData: ExplorerRow[] = [
  { id: "d-001", zone: "Bang Khen", hazardType: "heat", dataSource: "sensor", date: "2026-02-18", value: 38.7, unit: "C", indicator: "Temperature" },
  { id: "d-002", zone: "Bang Khen", hazardType: "heat", dataSource: "chatbot", date: "2026-02-18", value: 4.2, unit: "/5", indicator: "Perceived Heat Stress" },
  { id: "d-003", zone: "Lat Phrao", hazardType: "heat", dataSource: "survey", date: "2026-01-15", value: 0.72, unit: "idx", indicator: "Heat Vulnerability Index" },
  { id: "d-004", zone: "Phra Khanong", hazardType: "flood", dataSource: "sensor", date: "2026-02-10", value: 87.3, unit: "mm", indicator: "Rainfall" },
  { id: "d-005", zone: "Bang Na", hazardType: "flood", dataSource: "chatbot", date: "2026-02-10", value: 3.8, unit: "/5", indicator: "Perceived Flood Severity" },
  { id: "d-006", zone: "Suan Luang", hazardType: "flood", dataSource: "survey", date: "2026-01-15", value: 0.65, unit: "idx", indicator: "Flood Exposure Index" },
  { id: "d-007", zone: "Din Daeng", hazardType: "heat", dataSource: "image", date: "2026-02-01", value: 23, unit: "%", indicator: "Shade Coverage" },
  { id: "d-008", zone: "Ratchathewi", hazardType: "heat", dataSource: "sensor", date: "2026-02-01", value: 36.9, unit: "C", indicator: "Temperature" },
  { id: "d-009", zone: "Thon Buri", hazardType: "flood", dataSource: "sensor", date: "2026-01-25", value: 62.1, unit: "mm", indicator: "Rainfall" },
  { id: "d-010", zone: "Bangkok Noi", hazardType: "flood", dataSource: "image", date: "2026-01-25", value: 31, unit: "%", indicator: "Drainage Indicator" },
  { id: "d-011", zone: "Khlong Toei", hazardType: "heat", dataSource: "chatbot", date: "2026-01-18", value: 3.9, unit: "/5", indicator: "Perceived Heat Stress" },
  { id: "d-012", zone: "Watthana", hazardType: "heat", dataSource: "sensor", date: "2026-01-18", value: 31.2, unit: "C", indicator: "Nighttime Temperature" },
  { id: "d-013", zone: "Min Buri", hazardType: "flood", dataSource: "sensor", date: "2026-01-12", value: 45.8, unit: "mm", indicator: "Rainfall" },
  { id: "d-014", zone: "Nong Chok", hazardType: "flood", dataSource: "chatbot", date: "2026-01-12", value: 3.4, unit: "/5", indicator: "Perceived Flood Severity" },
  { id: "d-015", zone: "Chatuchak", hazardType: "heat", dataSource: "survey", date: "2026-01-15", value: 0.68, unit: "idx", indicator: "Heat Vulnerability Index" },
  { id: "d-016", zone: "Sathon", hazardType: "heat", dataSource: "image", date: "2026-01-18", value: 18, unit: "%", indicator: "Shade Coverage" },
]

export const perceptionVsSensorData = [
  { date: "Jan 6", sensorTemp: 33.5, perceivedStress: 3.1 },
  { date: "Jan 12", sensorTemp: 34.1, perceivedStress: 3.4 },
  { date: "Jan 18", sensorTemp: 31.2, perceivedStress: 3.9 },
  { date: "Jan 25", sensorTemp: 35.6, perceivedStress: 4.0 },
  { date: "Feb 1", sensorTemp: 36.9, perceivedStress: 4.2 },
  { date: "Feb 10", sensorTemp: 33.8, perceivedStress: 3.5 },
  { date: "Feb 18", sensorTemp: 38.7, perceivedStress: 4.5 },
]

export const temporalTrendData = [
  { date: "Jan 6", rainfall: 12.3, chatbotReports: 8 },
  { date: "Jan 12", rainfall: 45.8, chatbotReports: 52 },
  { date: "Jan 18", rainfall: 5.2, chatbotReports: 3 },
  { date: "Jan 25", rainfall: 62.1, chatbotReports: 134 },
  { date: "Feb 1", rainfall: 8.7, chatbotReports: 12 },
  { date: "Feb 10", rainfall: 87.3, chatbotReports: 203 },
  { date: "Feb 18", rainfall: 15.1, chatbotReports: 21 },
]

export type MapPoint = {
  id: string
  lat: number
  lng: number
  type: "sensor" | "chatbot" | "image"
  label: string
  value: string
  zone: string
  date: string
  /** If true, this is a cluster parent; childReports will contain individual points */
  isCluster?: boolean
  childReports?: MapPoint[]
}

export const mapPoints: MapPoint[] = [
  { id: "mp-1", lat: 13.856, lng: 100.554, type: "sensor", label: "Sensor #14", value: "37.2C / 81%", zone: "Bang Khen", date: "2026-02-18" },
  { id: "mp-2", lat: 13.812, lng: 100.582, type: "sensor", label: "Sensor #07", value: "36.8C / 79%", zone: "Lat Phrao", date: "2026-02-18" },
  {
    id: "mp-3", lat: 13.715, lng: 100.601, type: "chatbot", label: "Report Cluster", value: "42 reports", zone: "Phra Khanong", date: "2026-02-10",
    isCluster: true,
    childReports: [
      { id: "mp-3a", lat: 13.7175, lng: 100.5985, type: "chatbot", label: "Report #301", value: "Flooding knee-deep on Soi 42", zone: "Phra Khanong", date: "2026-02-10" },
      { id: "mp-3b", lat: 13.7135, lng: 100.6035, type: "chatbot", label: "Report #302", value: "Road impassable near BTS", zone: "Phra Khanong", date: "2026-02-10" },
      { id: "mp-3c", lat: 13.7120, lng: 100.5990, type: "chatbot", label: "Report #303", value: "Storm drain overflowing", zone: "Phra Khanong", date: "2026-02-10" },
      { id: "mp-3d", lat: 13.7180, lng: 100.6050, type: "chatbot", label: "Report #304", value: "Traffic diverted on Sukhumvit", zone: "Phra Khanong", date: "2026-02-10" },
      { id: "mp-3e", lat: 13.7145, lng: 100.5970, type: "chatbot", label: "Report #305", value: "Water entering ground floor", zone: "Phra Khanong", date: "2026-02-10" },
      { id: "mp-3f", lat: 13.7160, lng: 100.6025, type: "chatbot", label: "Report #306", value: "Motorbike stalled in water", zone: "Phra Khanong", date: "2026-02-10" },
      { id: "mp-3g", lat: 13.7190, lng: 100.5960, type: "chatbot", label: "Report #307", value: "Garbage floating in flood", zone: "Phra Khanong", date: "2026-02-10" },
    ],
  },
  {
    id: "mp-4", lat: 13.668, lng: 100.624, type: "chatbot", label: "Report Cluster", value: "38 reports", zone: "Bang Na", date: "2026-02-10",
    isCluster: true,
    childReports: [
      { id: "mp-4a", lat: 13.6700, lng: 100.6210, type: "chatbot", label: "Report #401", value: "Flood water rising fast", zone: "Bang Na", date: "2026-02-10" },
      { id: "mp-4b", lat: 13.6665, lng: 100.6270, type: "chatbot", label: "Report #402", value: "School closed due to flooding", zone: "Bang Na", date: "2026-02-10" },
      { id: "mp-4c", lat: 13.6690, lng: 100.6230, type: "chatbot", label: "Report #403", value: "Market stalls damaged", zone: "Bang Na", date: "2026-02-10" },
      { id: "mp-4d", lat: 13.6650, lng: 100.6255, type: "chatbot", label: "Report #404", value: "Elderly neighbor needs help", zone: "Bang Na", date: "2026-02-10" },
      { id: "mp-4e", lat: 13.6710, lng: 100.6200, type: "chatbot", label: "Report #405", value: "Canal overflowing into soi", zone: "Bang Na", date: "2026-02-10" },
      { id: "mp-4f", lat: 13.6675, lng: 100.6285, type: "chatbot", label: "Report #406", value: "Power outage reported", zone: "Bang Na", date: "2026-02-10" },
    ],
  },
  { id: "mp-5", lat: 13.758, lng: 100.540, type: "image", label: "Image Survey", value: "23% shade", zone: "Din Daeng", date: "2026-02-01" },
  { id: "mp-6", lat: 13.752, lng: 100.505, type: "sensor", label: "Sensor #22", value: "36.9C / 79%", zone: "Ratchathewi", date: "2026-02-01" },
  { id: "mp-7", lat: 13.722, lng: 100.477, type: "sensor", label: "Sensor #31", value: "35.4C / 92%", zone: "Thon Buri", date: "2026-01-25" },
  {
    id: "mp-8", lat: 13.773, lng: 100.480, type: "chatbot", label: "Report Cluster", value: "31 reports", zone: "Bangkok Noi", date: "2026-01-25",
    isCluster: true,
    childReports: [
      { id: "mp-8a", lat: 13.7755, lng: 100.4780, type: "chatbot", label: "Report #801", value: "Street flooded after rain", zone: "Bangkok Noi", date: "2026-01-25" },
      { id: "mp-8b", lat: 13.7710, lng: 100.4825, type: "chatbot", label: "Report #802", value: "Buses rerouted near temple", zone: "Bangkok Noi", date: "2026-01-25" },
      { id: "mp-8c", lat: 13.7740, lng: 100.4770, type: "chatbot", label: "Report #803", value: "Drainage blocked by debris", zone: "Bangkok Noi", date: "2026-01-25" },
      { id: "mp-8d", lat: 13.7720, lng: 100.4840, type: "chatbot", label: "Report #804", value: "Slippery road near pier", zone: "Bangkok Noi", date: "2026-01-25" },
      { id: "mp-8e", lat: 13.7760, lng: 100.4810, type: "chatbot", label: "Report #805", value: "Muddy water entering house", zone: "Bangkok Noi", date: "2026-01-25" },
    ],
  },
]
