"use client"

import { useState, useEffect } from "react"

export function ClockWidget() {
  const [time, setTime] = useState<string>("")
  const [date, setDate] = useState<string>("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
      setDate(now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }))
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-2">
      <div className="text-4xl font-bold text-blue-400 tabular-nums">{time}</div>
      <div className="text-sm text-white/60">{date}</div>
    </div>
  )
}
