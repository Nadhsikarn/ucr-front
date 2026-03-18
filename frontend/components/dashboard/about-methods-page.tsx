"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Layers,
  Zap,
  Radio,
  BarChart3,
  Shield,
  FileText,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"

const methodologySteps = [
  {
    icon: Layers,
    title: "Survey & GIS",
    subtitle: "Core Foundation",
    description:
      "Household-level vulnerability surveys and spatial analysis provide the baseline for understanding heat stress and flood exposure across Bangkok.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Zap,
    title: "Event Triggers",
    subtitle: "Threshold Detection",
    description:
      "Climate monitoring systems detect extreme heat events and heavy rainfall episodes that trigger data collection from complementary sources.",
    color: "bg-destructive/10 text-destructive",
  },
  {
    icon: Radio,
    title: "Real-time Inputs",
    subtitle: "Complementary Data",
    description:
      "LINE chatbot perception reports, IoT sensor readings, and street-level image analysis provide real-time context during active climate events.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: BarChart3,
    title: "Integrated Analysis",
    subtitle: "Synthesis",
    description:
      "Multi-source data is combined to produce richer, more nuanced assessments of urban vulnerability that go beyond traditional survey-only approaches.",
    color: "bg-chart-5/10 text-chart-5",
  },
]

const dataGovernancePoints = [
  "All survey data is anonymized at the household level",
  "Chatbot reports are aggregated by zone for analysis",
  "IoT sensor data is publicly accessible and non-personal",
  "Image analysis uses automated classification only",
  "Data retention follows institutional review board guidelines",
  "Access to raw data requires approved research protocols",
]

export function AboutMethodsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground lg:text-2xl text-balance">
          About & Methodology
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          This platform was developed to integrate multiple data sources for urban climate resilience
          research, combining traditional survey and GIS methods with emerging digital tools.
        </p>
      </div>

      {/* Methodology Diagram */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-semibold text-foreground">Research Methodology</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {methodologySteps.map((step, index) => (
            <div key={step.title} className="relative flex flex-col">
              <Card className="flex-1">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`flex size-10 items-center justify-center rounded-lg ${step.color}`}>
                      <step.icon className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{step.title}</CardTitle>
                      <CardDescription className="text-xs">{step.subtitle}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs leading-relaxed text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
              {/* Arrow connector */}
              {index < methodologySteps.length - 1 && (
                <div className="hidden lg:flex absolute -right-3 top-1/2 z-10 -translate-y-1/2">
                  <ArrowRight className="size-5 text-border" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Data Sources Detail */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Core Data Sources</CardTitle>
            <CardDescription>Foundation datasets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-semibold text-foreground">Household Vulnerability Survey</h4>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Structured interviews with 2,847 households across 24 administrative zones.
                  Covers exposure, sensitivity, and adaptive capacity indicators for both heat
                  stress and flooding.
                </p>
              </div>
              <Separator />
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-semibold text-foreground">GIS Spatial Layers</h4>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Administrative boundaries, land use classification, elevation data, canal
                  networks, and infrastructure proximity layers for Bangkok metropolitan area.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Complementary Data Sources</CardTitle>
            <CardDescription>Real-time & event-triggered</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-semibold text-foreground">LINE Chatbot Reports</h4>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Human perception reports collected via LINE messaging platform during climate
                  events. Captures subjective experience including heat discomfort, mobility
                  disruption, and flooding impacts.
                </p>
              </div>
              <Separator />
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-semibold text-foreground">IoT Environmental Sensors</h4>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  38 deployed sensor stations measuring temperature, humidity, and rainfall at
                  5-minute intervals across the study area.
                </p>
              </div>
              <Separator />
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-semibold text-foreground">Street-level Image Analysis</h4>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Automated classification of 892 street-level images to derive shade coverage,
                  surface type, and drainage infrastructure indicators.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ethics & Data Governance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-primary" />
            <CardTitle className="text-sm">Ethics & Data Governance</CardTitle>
          </div>
          <CardDescription>
            This research follows established ethical protocols and data governance standards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            {dataGovernancePoints.map((point) => (
              <div key={point} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-accent" />
                <span className="text-xs leading-relaxed text-muted-foreground">{point}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Citation */}
      <Card className="py-4">
        <CardContent>
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-foreground">Suggested Citation</span>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Urban Heat & Flood Data Platform (2026). Integrated Climate Resilience Research
                Dashboard for Bangkok Metropolitan Area. [Research Platform]. Available at this URL.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
