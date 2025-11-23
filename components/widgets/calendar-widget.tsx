"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function CalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [days, setDays] = useState<(number | null)[]>([])

  useEffect(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const calendarDays: (number | null)[] = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push(i)
    }

    setDays(calendarDays)
  }, [currentDate])

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={handlePrevMonth} className="p-1 hover:bg-white/10 rounded transition-colors">
          <ChevronLeft className="w-4 h-4 text-white/70" />
        </button>
        <div className="text-sm font-medium text-white">{monthName}</div>
        <button onClick={handleNextMonth} className="p-1 hover:bg-white/10 rounded transition-colors">
          <ChevronRight className="w-4 h-4 text-white/70" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-xs text-white/50 font-semibold text-center py-1">
            {day}
          </div>
        ))}
        {days.map((day, idx) => (
          <div
            key={idx}
            className={`text-xs p-1 text-center rounded ${
              day === null
                ? "text-white/20"
                : day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth()
                  ? "bg-blue-500/30 text-blue-300 font-semibold"
                  : "text-white/70 hover:bg-white/10"
            }`}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  )
}
