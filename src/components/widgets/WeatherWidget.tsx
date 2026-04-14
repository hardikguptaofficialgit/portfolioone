import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Interfaces } from 'doodle-icons';

type WeatherState = {
  temp: number | '--';
  condition: string;
  Icon: React.ComponentType<{ width?: number; height?: number; fill?: string }>;
  location: string;
};

// Helper to map WMO weather codes to readable text and icons
const getWeatherInfo = (code: number) => {
  // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
  // Using Interfaces.Sun and Interfaces.Cloud to bypass missing Weather exports
  if (code === 0 || code === 1) return { label: 'Clear Sky', icon: () => <Interfaces.Sun width={32} height={32} fill="white" /> };
  if (code === 2 || code === 3) return { label: 'Partly Cloudy', icon: () => <Interfaces.Cloud width={32} height={32} fill="white" /> };
  if (code >= 45 && code <= 48) return { label: 'Foggy', icon: () => <Interfaces.Cloud width={32} height={32} fill="white" /> };
  if (code >= 51 && code <= 67) return { label: 'Rain', icon: () => <Interfaces.Cloud width={32} height={32} fill="white" /> };
  if (code >= 71 && code <= 77) return { label: 'Snow', icon: () => <Interfaces.Cloud width={32} height={32} fill="white" /> };
  if (code >= 80 && code <= 82) return { label: 'Showers', icon: () => <Interfaces.Cloud width={32} height={32} fill="white" /> };
  if (code >= 95 && code <= 99) return { label: 'Thunderstorm', icon: () => <Interfaces.Cloud width={32} height={32} fill="white" /> };

  return { label: 'Unknown', icon: () => <Interfaces.Cloud width={32} height={32} fill="white" /> };
};

export const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Jaipur Coordinates: 26.9124° N, 75.7873° E
        const response = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=26.9124&longitude=75.7873&current=temperature_2m,weather_code&timezone=auto',
          { cache: 'no-store' }
        );

        if (!response.ok) throw new Error(`Weather request failed (${response.status})`);
        const data = await response.json();

        const rawCode = data?.current?.weather_code ?? data?.current_weather?.weathercode;
        const rawTemp = data?.current?.temperature_2m ?? data?.current_weather?.temperature;
        
        if (typeof rawCode !== 'number' || typeof rawTemp !== 'number') {
          throw new Error('Weather payload missing required fields');
        }

        // Map the raw API data to our component state
        const weatherInfo = getWeatherInfo(rawCode);

        setWeather({
          temp: Math.round(rawTemp),
          condition: weatherInfo.label,
          Icon: weatherInfo.icon,
          location: 'Jaipur, RJ',
        });
      } catch (error) {
        console.error('Failed to fetch weather:', error);
        // Fallback in case of error
        setWeather({
          temp: '--',
          condition: 'Unavailable',
          Icon: () => <Interfaces.Cloud width={32} height={32} fill="white" />,
          location: 'Jaipur, RJ',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = window.setInterval(fetchWeather, 1000 * 60 * 10);
    return () => window.clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-6 w-72 flex items-center justify-center h-32">
        <span className="text-glass-text-muted animate-pulse">Loading weather...</span>
      </div>
    );
  }

  const WeatherIcon = weather?.Icon;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="glass-panel rounded-2xl p-6 w-72 backdrop-blur-md bg-white/10 border border-white/20 shadow-xl"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-4xl font-bold text-white/90">{weather?.temp}°C</div>
          <div className="text-sm text-white/70 mt-1">{weather?.condition}</div>
          <div className="text-xs text-white/50 mt-2">{weather?.location}</div>
        </div>
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/20 to-transparent flex items-center justify-center shadow-inner border border-white/10">
          {WeatherIcon && <WeatherIcon />}
        </div>
      </div>
    </motion.div>
  );
};