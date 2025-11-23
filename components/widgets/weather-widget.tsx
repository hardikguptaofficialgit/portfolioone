"use client"

import { useEffect } from "react"
import { useWidgetStore } from "@/lib/widgets"
import { Cloud, Sun, Wind } from "lucide-react"

export function WeatherWidget() {
  const { weatherData, setWeatherData } = useWidgetStore()

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          // Using Open-Meteo free API (no key required)
          fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`,
          )
            .then((res) => res.json())
            .then((data) => {
              const current = data.current
              setWeatherData({
                temp: Math.round(current.temperature_2m),
                condition: current.weather_code === 0 ? "Clear" : "Cloudy",
              })
            })
            .catch(() => {
              setWeatherData({ temp: 72, condition: "Unknown" })
            })
        },
        () => {
          setWeatherData({ temp: 72, condition: "Unknown" })
        },
      )
    }
  }, [setWeatherData])

  if (!weatherData) {
    return <div className="text-white/50 text-sm">Loading weather...</div>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="text-4xl">
          {weatherData.condition === "Clear" ? (
            <Sun className="w-10 h-10 text-yellow-400" />
          ) : (
            <Cloud className="w-10 h-10 text-blue-300" />
          )}
        </div>
        <div>
          <div className="text-3xl font-bold text-white">{weatherData.temp}°</div>
          <div className="text-sm text-white/60">{weatherData.condition}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-white/60 text-sm">
        <Wind className="w-4 h-4" />
        <span>Light breeze</span>
      </div>
    </div>
  )
}
