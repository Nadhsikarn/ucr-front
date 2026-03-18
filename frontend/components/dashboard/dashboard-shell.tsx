"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  LayoutDashboard,
  Map,
  CalendarClock,
  Database,
  BookOpen,
  Route,
  Globe,
} from "lucide-react"
import { OverviewPage } from "@/components/dashboard/overview-page"
import { MapLayersPage } from "@/components/dashboard/map-layers-page"
import { EventsSignalsPage } from "@/components/dashboard/events-signals-page"
import { DataExplorerPage } from "@/components/dashboard/data-explorer-page"
import { AboutMethodsPage } from "@/components/dashboard/about-methods-page"
import { SurveyWalkPage } from "@/components/dashboard/survey-walk-page"
import { Map3DPage } from "@/components/dashboard/map3d-page"

const tabs = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "map", label: "Map & Layers", icon: Map },
  { value: "events", label: "Events & Signals", icon: CalendarClock },
  { value: "walk", label: "Survey Walk", icon: Route },
  { value: "map3d", label: "3D Map", icon: Globe },
  { value: "explorer", label: "Data Explorer", icon: Database },
  { value: "about", label: "About / Methods", icon: BookOpen },
]

export function DashboardShell() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="mx-auto flex max-w-screen-2xl items-center px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <Map className="size-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-semibold leading-tight text-foreground lg:text-base">
                Urban Heat & Flood Data Platform
              </h1>
              <span className="hidden text-xs text-muted-foreground lg:inline">
                Bangkok Climate Resilience Research
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mx-auto max-w-screen-2xl px-4 lg:px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-10 w-full justify-start gap-0 rounded-none border-none bg-transparent p-0">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="relative h-10 gap-1.5 rounded-none border-none bg-transparent px-3 text-muted-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none lg:px-4"
                >
                  <tab.icon className="size-4" />
                  <span className="hidden text-sm sm:inline">{tab.label}</span>
                  {activeTab === tab.value && (
                    <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-screen-2xl px-4 py-6 lg:px-6 lg:py-8">
          {activeTab === "overview" && <OverviewPage />}
          {activeTab === "map" && <MapLayersPage />}
          {activeTab === "events" && <EventsSignalsPage />}
          {activeTab === "walk" && <SurveyWalkPage />}
          {activeTab === "map3d" && <Map3DPage />}
          {activeTab === "explorer" && <DataExplorerPage />}
          {activeTab === "about" && <AboutMethodsPage />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-4">
        <div className="mx-auto max-w-screen-2xl px-4 lg:px-6">
          <p className="text-xs text-muted-foreground">
            Urban Heat & Flood Data Platform. Research use only. Data governance and ethics policies apply.
          </p>
        </div>
      </footer>
    </div>
  )
}
