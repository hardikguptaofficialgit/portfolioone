"use client"

import { useState } from "react"
import { ClockWidget } from "./clock-widget"
import { CalendarWidget } from "./calendar-widget"
import { WeatherWidget } from "./weather-widget"
import { TodoWidget } from "./todo-widget"
import { ChevronDown } from "lucide-react"

interface WidgetPanelProps {
  onOpenWindow?: (type: string) => void
}

export function WidgetPanel({ onOpenWindow }: WidgetPanelProps) {
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null)

  const widgets = [
    { id: "clock", title: "Clock", component: ClockWidget },
    { id: "calendar", title: "Calendar", component: CalendarWidget },
    { id: "weather", title: "Weather", component: WeatherWidget },
    { id: "todo", title: "Tasks", component: TodoWidget },
  ]

  return (
    <div className="w-full h-full space-y-3 overflow-y-auto scrollbar-hide">
      {widgets.map(({ id, title, component: Component }, idx) => (
        <div
          key={id}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition-all duration-200 animate-in fade-in slide-in-from-left duration-300"
          style={{
            animationDelay: `${idx * 100}ms`,
          }}
        >
          <button
            onClick={() => setExpandedWidget(expandedWidget === id ? null : id)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-all duration-200"
          >
            <span className="font-medium text-white">{title}</span>
            <ChevronDown
              className={`w-4 h-4 text-white/60 transition-transform duration-300 ${
                expandedWidget === id ? "rotate-180" : ""
              }`}
            />
          </button>

          {expandedWidget === id && (
            <div className="px-4 py-3 border-t border-white/10 space-y-3 animate-in fade-in slide-in-from-top duration-200">
              <Component />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
