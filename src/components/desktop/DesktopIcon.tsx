import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface DesktopIconProps {
  icon: any;
  label: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
  selected?: boolean;
  size?: 'small' | 'medium' | 'large';
}

import { useDesktopStore } from '@/store/desktopStore';

export const DesktopIcon = ({
  icon: Icon,
  label,
  onClick,
  onDoubleClick,
  selected,
  size = 'large'
}: DesktopIconProps) => {
  const { settings } = useDesktopStore();

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'w-16',
      iconBox: 'w-10 h-10',
      iconSize: 'w-5 h-5',
      text: 'text-[10px]',
      gap: 'gap-1',
      padding: 'p-2'
    },
    medium: {
      container: 'w-20',
      iconBox: 'w-12 h-12',
      iconSize: 'w-6 h-6',
      text: 'text-[11px]',
      gap: 'gap-1.5',
      padding: 'p-2.5'
    },
    large: {
      container: 'w-24',
      iconBox: 'w-14 h-14',
      iconSize: 'w-7 h-7',
      text: 'text-xs',
      gap: 'gap-2',
      padding: 'p-3'
    }
  };

  const config = sizeConfig[size];

  const getIconStyle = () => {
    // Use theme color for background
    switch (settings.themeColor) {
      case 'blue': return 'bg-blue-300/80 border-blue-200/50';
      case 'purple': return 'bg-purple-300/80 border-purple-200/50';
      case 'green': return 'bg-green-300/80 border-green-200/50';
      case 'orange': return 'bg-orange-300/80 border-orange-200/50';
      case 'red': return 'bg-red-300/80 border-red-200/50';
      case 'zinc': return 'bg-zinc-300/80 border-zinc-200/50';
      default: return 'bg-white/20 border-white/20';
    }
  };

  return (
    <motion.div
      whileTap={{ opacity: 0.85 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.();
      }}
      className={`flex flex-col items-center ${config.gap} ${config.padding} rounded-lg transition-all duration-200 group ${config.container} cursor-pointer border ${selected
        ? settings.darkMode
          ? 'bg-white/20 border-white/30'
          : 'bg-black/10 border-black/20'
        : settings.darkMode
          ? 'hover:bg-white/10 border-transparent hover:border-white/20'
          : 'hover:bg-white/55 border-transparent hover:border-black/15'
        }`}
    >
      <div className={`${config.iconBox} rounded-xl flex items-center justify-center transition-all duration-300 ${getIconStyle()} shadow-lg group-hover:shadow-xl group-hover:border-white/40`}>
        <Icon className={`${config.iconSize} text-black drop-shadow-sm`} />
      </div>
      <span className={`
        ${config.text} font-medium text-center drop-shadow-lg leading-tight select-none
        ${selected
          ? settings.darkMode ? 'text-white' : 'text-zinc-950'
          : settings.darkMode ? 'text-zinc-200' : 'text-zinc-800'
        }
      `}>
        {label}
      </span>
    </motion.div>
  );
};
