import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, CloudRain, Sun, CloudFog, CloudLightning, Snowflake } from 'lucide-react';

// Helper to map WMO weather codes to readable text and icons
const getWeatherInfo = (code) => {
  // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
  if (code === 0 || code === 1) return { label: 'Clear Sky', icon: Sun };
  if (code === 2 || code === 3) return { label: 'Partly Cloudy', icon: Cloud };
  if (code >= 45 && code <= 48) return { label: 'Foggy', icon: CloudFog };
  if (code >= 51 && code <= 67) return { label: 'Rain', icon: CloudRain };
  if (code >= 71 && code <= 77) return { label: 'Snow', icon: Snowflake };
  if (code >= 80 && code <= 82) return { label: 'Showers', icon: CloudRain };
  if (code >= 95 && code <= 99) return { label: 'Thunderstorm', icon: CloudLightning };

  return { label: 'Unknown', icon: Cloud };
};

export const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Jaipur Coordinates: 26.9124° N, 75.7873° E
        const response = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=26.9124&longitude=75.7873&current_weather=true'
        );
        const data = await response.json();

        // Map the raw API data to our component state
        const weatherInfo = getWeatherInfo(data.current_weather.weathercode);

        setWeather({
          temp: Math.round(data.current_weather.temperature),
          condition: weatherInfo.label,
          Icon: weatherInfo.icon,
          location: 'Jaipur, RJ',
        });
      } catch (error) {
        console.error("Failed to fetch weather:", error);
        // Fallback in case of error
        setWeather({
          temp: '--',
          condition: 'Unavailable',
          Icon: Cloud,
          location: 'Jaipur, RJ',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-6 w-72 flex items-center justify-center h-32">
        <span className="text-glass-text-muted animate-pulse">Loading weather...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="glass-panel rounded-2xl p-6 w-72 backdrop-blur-md bg-white/10 border border-white/20 shadow-xl"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-4xl font-bold text-white/90">{weather.temp}°C</div>
          <div className="text-sm text-white/70 mt-1">{weather.condition}</div>
          <div className="text-xs text-white/50 mt-2">{weather.location}</div>
        </div>
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/20 to-transparent flex items-center justify-center shadow-inner border border-white/10">
          <weather.Icon className="w-8 h-8 text-white drop-shadow-md" />
        </div>
      </div>
    </motion.div>
  );
};