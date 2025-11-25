import { motion } from 'framer-motion';
import { Cloud, CloudRain, Sun } from 'lucide-react';

export const WeatherWidget = () => {
  // Mock weather data - in real app, fetch from API
  const weather = {
    temp: 72,
    condition: 'Partly Cloudy',
    location: 'San Francisco, CA',
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="glass-panel rounded-2xl p-6 w-72"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-4xl font-bold text-glass-text">{weather.temp}°</div>
          <div className="text-sm text-glass-text-muted mt-1">{weather.condition}</div>
          <div className="text-xs text-glass-text-muted mt-2">{weather.location}</div>
        </div>
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-desktop-accent/20 to-transparent flex items-center justify-center">
          <Cloud className="w-8 h-8 text-desktop-accent" />
        </div>
      </div>
    </motion.div>
  );
};
