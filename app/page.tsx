"use client"

import { useEffect, useState } from "react"
import { useDesktopStore } from "@/lib/store"
import { DesktopContainer } from "@/components/desktop/desktop-container"
import { WidgetPanel } from "@/components/widgets/widget-panel"
import { SettingsPanel } from "@/components/settings/settings-panel"
import { AboutWindow } from "@/components/portfolio/about-window"
import { ExperienceWindow } from "@/components/portfolio/experience-window"
import { ProjectsWindow } from "@/components/portfolio/projects-window"
import { ResumeWindow } from "@/components/portfolio/resume-window"
import { LikesWindow } from "@/components/portfolio/likes-window"
import { AcknowledgementsWindow } from "@/components/portfolio/acknowledgments-window"
import { useAppInit } from "@/hooks/use-app-init"

export default function Home() {
  const { createWindow } = useDesktopStore()
  const [windowsCreated, setWindowsCreated] = useState(false)

  useAppInit()

  useEffect(() => {
    if (!windowsCreated) {
      // Create widget panel window
      createWindow({
        title: "Widgets",
        type: "widget",
        x: 1200,
        y: 100,
        width: 350,
        height: 600,
        isMinimized: false,
        isMaximized: false,
      })

      // Create portfolio windows
      createWindow({
        title: "About",
        type: "app",
        x: 50,
        y: 50,
        width: 500,
        height: 550,
        isMinimized: false,
        isMaximized: false,
      })

      createWindow({
        title: "Projects",
        type: "app",
        x: 600,
        y: 100,
        width: 550,
        height: 500,
        isMinimized: false,
        isMaximized: false,
      })

      setWindowsCreated(true)
    }
  }, [createWindow, windowsCreated])

  return (
    <DesktopContainer>
      <WindowContent />
    </DesktopContainer>
  )
}

function WindowContent() {
  const { windows, activeWindowId } = useDesktopStore()
  const activeWindow = windows.find((w) => w.id === activeWindowId)

  if (!activeWindow) return <WidgetPanel />

  switch (activeWindow?.title) {
    case "Widgets":
      return <WidgetPanel />
    case "Settings":
      return <SettingsPanel />
    case "About":
      return <AboutWindow />
    case "Experience":
      return <ExperienceWindow />
    case "Projects":
      return <ProjectsWindow />
    case "Resume":
      return <ResumeWindow />
    case "Likes":
      return <LikesWindow />
    case "Acknowledgments":
      return <AcknowledgementsWindow />
    default:
      return <WidgetPanel />
  }
}
