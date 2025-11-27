import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Grid3x3,
  SortAsc,
  FilePlus,
  FolderPlus,
  FileText,
  Settings,
} from 'lucide-react';
import { useDesktopStore } from '@/store/desktopStore';
import { DesktopIcon } from '@/components/desktop/DesktopIcon';
import { Window } from '@/components/desktop/Window';
import { Taskbar } from '@/components/desktop/Taskbar';
import { StartMenu } from '@/components/desktop/StartMenu';
import { Clock } from '@/components/widgets/Clock';
import { WeatherWidget } from '@/components/widgets/WeatherWidget';
import { GamesWidget } from '@/components/widgets/GamesWidget';
import { SubstackWidget } from '@/components/widgets/SubstackWidget';
import { AskMeWidget } from '@/components/widgets/AskMeWidget';
import { SpotifyWidget } from '@/components/widgets/SpotifyWidget';
import { LockScreen } from '@/components/auth/LockScreen';
import { EmailEntry } from '@/components/auth/EmailEntry';
import { ContextMenu, ContextMenuItem } from '@/components/ui/ContextMenu';
import { ShaderAnimation } from '@/components/ui/shader-lines';
import { DesktopRope } from '@/components/desktop/DesktopRope';
import { useContextMenu } from '@/hooks/useContextMenu';
import { cn } from '@/lib/utils';
import { getIconComponent } from '@/utils/apps';

type AuthStep = 'boot' | 'lock' | 'email' | 'desktop';
type IconSize = 'small' | 'medium' | 'large';
type SortBy = 'name' | 'size' | 'date';

const Index = () => {
  const { windows, openOrFocusWindow, settings } = useDesktopStore();
  const [authStep, setAuthStep] = useState<AuthStep>('boot');
  const { contextMenu, handleContextMenu, closeContextMenu } = useContextMenu();
  const [iconSize, setIconSize] = useState<IconSize>('large');
  const [sortBy, setSortBy] = useState<SortBy>('name');

  useEffect(() => {
    if (authStep === 'boot') {
      const timer = setTimeout(() => {
        setAuthStep('lock');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [authStep]);

  // Hardcoded Desktop Icons configuration
  const desktopIcons: {
    label: string;
    icon: any;
    appId: string;
    content: string;
  }[] = [];

  // Sort icons based on current sort option
  const sortedIcons = [...desktopIcons].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.label.localeCompare(b.label);
      case 'size':
        return a.label.length - b.label.length;
      case 'date':
        return 0; // Static for now
      default:
        return 0;
    }
  });

  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  const handleIconClick = (label: string) => {
    setSelectedIcon(label);
  };

  const handleIconDoubleClick = (icon: typeof desktopIcons[0]) => {
    openOrFocusWindow({
      title: icon.label,
      icon: icon.label.toLowerCase(),
      appId: icon.appId, // Ensure ID matches appId for window management
      x: 100 + Math.random() * 50, // Slight random offset for stacking
      y: 50 + Math.random() * 50,
      width: 900,
      height: 600,
      content: icon.content,

    });
    setSelectedIcon(null);
  };

  const handleUnlock = () => setAuthStep('email');

  const handleEmailComplete = (email?: string) => {
    console.log('User email:', email);
    setAuthStep('desktop');
  };

  // Desktop context menu items
  const desktopContextMenuItems: ContextMenuItem[] = [
    {
      label: 'View',
      icon: Grid3x3,
      submenu: [
        {
          label: 'Large icons',
          onClick: () => setIconSize('large'),
          checked: iconSize === 'large'
        },
        {
          label: 'Medium icons',
          onClick: () => setIconSize('medium'),
          checked: iconSize === 'medium'
        },
        {
          label: 'Small icons',
          onClick: () => setIconSize('small'),
          checked: iconSize === 'small'
        },
      ],
    },
    {
      label: 'Sort by',
      icon: SortAsc,
      submenu: [
        {
          label: 'Name',
          onClick: () => setSortBy('name'),
          checked: sortBy === 'name'
        },
        {
          label: 'Size',
          onClick: () => setSortBy('size'),
          checked: sortBy === 'size'
        },
        {
          label: 'Date modified',
          onClick: () => setSortBy('date'),
          checked: sortBy === 'date'
        },
      ],
    },
    {
      label: 'Refresh',
      icon: RefreshCw,
      onClick: () => window.location.reload(),
    },
    { separator: true },
    {
      label: 'New',
      icon: FilePlus,
      submenu: [
        { label: 'Folder', icon: FolderPlus, onClick: () => console.log('New folder') },
        { label: 'Text Document', icon: FileText, onClick: () => console.log('New text') },
      ],
    },
    { separator: true },
    {
      label: 'Settings',
      icon: Settings,
      onClick: () => {
        openOrFocusWindow({
          title: 'Settings',
          icon: 'settings',
          appId: 'settings',
          x: 200,
          y: 100,
          width: 700,
          height: 500,
          content: 'settings',

        });
      },
    },
  ];

  return (
    <div
      className={cn(
        "relative w-full h-screen overflow-hidden font-sans selection:bg-white selection:text-black",
        settings.darkMode ? "bg-black text-white" : "bg-zinc-100 text-zinc-900"
      )}
      onContextMenu={handleContextMenu}
    >
      {/* Authentication Layer */}
      <AnimatePresence mode="wait">
        {authStep === 'boot' && (



          <motion.div
            key="boot-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
          >
            <ShaderAnimation />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <svg
                viewBox="0 0 600 100"
                className="max-w-[600px] w-full h-auto flex-shrink-0"
              >
                <motion.path
                  d="M 50 25 L 10 25 L 10 50 L 50 50 L 50 75 L 10 75 
         M 70 25 L 110 25 
         M 90 25 L 90 75 
         M 130 75 L 130 25 L 160 25 L 160 50 L 130 50 L 160 75 
         M 180 25 L 195 50 L 210 25 
         M 195 50 L 195 75 
         M 230 25 L 230 75 
         M 260 25 L 230 50 L 260 75 
         M 280 75 L 280 25 L 310 25 
         M 280 50 L 310 50 
         M 280 75 L 310 75 
         M 330 75 L 330 25 L 360 25 L 360 50 L 330 50 L 360 75 
         M 410 25 L 440 25 L 440 75 L 410 75 Z 
         M 490 25 L 460 25 L 460 50 L 490 50 L 490 75 L 460 75"
                  fill="transparent"
                  strokeWidth="5"
                  stroke="white"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    duration: 3,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                />
              </svg>
            </div>

          </motion.div>
        )}

        {authStep === 'lock' && (
          <LockScreen key="lock-screen" onUnlock={handleUnlock} />
        )}

        {authStep === 'email' && (
          <EmailEntry key="email-entry" onComplete={handleEmailComplete} />
        )}
      </AnimatePresence>

      {/* Main Desktop Interface */}
      <motion.div
        className="relative w-full h-full"
        initial={{ opacity: 0 }}
        animate={{
          opacity: authStep === 'desktop' ? 1 : 0,
          pointerEvents: authStep === 'desktop' ? 'auto' : 'none'
        }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        onClick={() => setSelectedIcon(null)}
      >


        {/* --- Abstract Background --- */}
        <div className={cn(
          "absolute inset-0 z-0 overflow-hidden",
          settings.darkMode ? "bg-black" : "bg-zinc-100"
        )}>
          {/* Subtle Grid Pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `linear-gradient(${settings.darkMode ? '#27272a' : '#e4e4e7'} 1px, transparent 1px), linear-gradient(90deg, ${settings.darkMode ? '#27272a' : '#e4e4e7'} 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />

          {/* Ambient Light/Glow spots */}
          <div className={cn(
            "absolute top-0 left-0 w-[500px] h-[500px] rounded-full blur-[120px]",
            settings.darkMode ? "bg-white/5" : "bg-blue-500/5"
          )} />
          <div className={cn(
            "absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-[150px]",
            settings.darkMode ? "bg-zinc-800/20" : "bg-purple-500/5"
          )} />

          {/* Noise Texture Overlay */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>


        </div>

        {/* Interactive Rope */}
        <DesktopRope />

        {/* --- Desktop Content --- */}

        {/* Desktop Icons Container */}
        <div className="relative z-10 p-4 flex flex-col flex-wrap content-start gap-4 h-[calc(100vh-4rem)] w-full max-w-2xl pointer-events-none">
          {sortedIcons.map((icon, index) => (
            <motion.div
              key={icon.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: authStep === 'desktop' ? 1 : 0,
                y: authStep === 'desktop' ? 0 : 10
              }}
              transition={{ delay: index * 0.1 + 0.5 }}
              className="pointer-events-auto"
            >
              <DesktopIcon
                icon={icon.icon}
                label={icon.label}
                selected={selectedIcon === icon.label}
                onClick={() => handleIconClick(icon.label)}
                onDoubleClick={() => handleIconDoubleClick(icon)}
                size={iconSize}
              />
            </motion.div>
          ))}
        </div>



        {/* Widgets Area - Enforcing Grayscale/Dark Theme */}
        <div className="absolute top-6 right-6 flex flex-col gap-6 z-10 items-end pointer-events-auto">

          <div className="flex items-center gap-4 relative z-20">
            <div className="grayscale brightness-125 contrast-125">
              <GamesWidget />
            </div>
            <div className="flex flex-col gap-4 items-end">
              <AskMeWidget />
              <SpotifyWidget />
            </div>
            <div className="grayscale brightness-125 contrast-125">
              <Clock />
            </div>
          </div>
          <div className="grayscale ostpacity-80 hover:opacity-100 transition-opacity">
            <WeatherWidget />
          </div>
          <div className="grayscale opacity-90 hover:opacity-100 ">
            <SubstackWidget />
          </div>
        </div>

        {/* Open Windows Layer */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="relative w-full h-full pointer-events-auto">
            {windows.map((window) => (
              <Window key={window.id} {...window} />
            ))}
          </div>
        </div>

        {/* Taskbar */}
        <Taskbar />

        {/* Start Menu */}
        <StartMenu onSignOut={() => setAuthStep('lock')} />

        {/* Desktop Context Menu */}
        <ContextMenu
          items={desktopContextMenuItems}
          position={contextMenu.position}
          show={contextMenu.show}
          onClose={closeContextMenu}
        />
      </motion.div>
    </div>
  );
};

export default Index;