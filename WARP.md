# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **desktop OS simulation** built as a single-page portfolio application. The project simulates a complete desktop environment with windows, a taskbar, start menu, desktop icons, and various applications. It was generated using [Lovable.dev](https://lovable.dev) and is designed to showcase work/portfolio content in an interactive desktop interface.

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Zustand

## Development Commands

### Core Commands
```bash
# Start development server (runs on http://[::]:8080)
npm run dev

# Build for production
npm run build

# Build for development mode
npm run build:dev

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Notes
- No test framework is configured in this project
- The dev server uses IPv6 (`::`), binding to all interfaces on port 8080
- Uses SWC for faster React compilation via `@vitejs/plugin-react-swc`

## Architecture

### State Management (Zustand)
The entire desktop state is managed through **a single Zustand store** (`src/store/desktopStore.ts`) with persistence via localStorage:

- **Window Management**: Tracks open windows with properties like position, size, z-index, minimized/maximized states
- **App Identification**: Each window has an `appId` to prevent duplicates (e.g., clicking Chrome twice focuses existing window rather than opening new one)
- **Pin System**: `pinnedApps` array stores apps pinned to taskbar with persistence
- **Settings**: Stores user preferences (auto-hide taskbar, dark mode, show desktop icons)

**Key Pattern**: `openOrFocusWindow()` function checks if window with same `appId` exists before creating new window - this ensures single-instance behavior across all entry points (taskbar, start menu, desktop icons).

### Component Structure

```
src/
├── components/
│   ├── desktop/          # Core desktop UI components
│   │   ├── Window.tsx    # Draggable/resizable windows using react-rnd
│   │   ├── Taskbar.tsx   # Bottom taskbar with pinned apps
│   │   ├── StartMenu.tsx # Start menu with app launcher & pin/unpin
│   │   └── DesktopIcon.tsx
│   ├── auth/             # Lock screen & email entry screens
│   ├── widgets/          # Clock, Weather, etc.
│   └── ui/               # shadcn/ui components
├── store/
│   └── desktopStore.ts   # Single source of truth for all desktop state
├── pages/
│   └── Index.tsx         # Main desktop page with authentication flow
├── data/
│   ├── apps.json         # App configurations (icons, colors, content mapping)
│   └── files.json        # File system data
└── hooks/
    └── useContextMenu.ts # Right-click context menu logic
```

### Window System
- Windows are rendered using `react-rnd` for drag/resize functionality
- Each window has a unique `id` and optional `appId` (for app identification)
- Windows can be minimized (hidden), maximized (fullscreen minus taskbar), or normal
- Z-index management ensures proper window stacking
- Traffic light controls (yellow=minimize, green=maximize, red=close) in title bar

### Application Content Mapping
Windows display different content based on their `content` property:
- `portfolio`, `resume`, `projects`, `about` → Custom content components inside Window.tsx
- `spotify` → Music player interface
- `settings` → Settings panel
- `documents` → Document browser
- `file-preview` → File preview (uses `data` prop)

### Styling System
- **Tailwind CSS** with custom design tokens defined in `tailwind.config.ts`
- Custom color palette: `desktop-*`, `glass-*`, `taskbar-*`, `window-*`, `widget-*`
- **shadcn/ui** components with path aliases configured in `components.json`
- Black background with zinc/neutral borders for macOS-inspired aesthetic
- Uses `cn()` utility (`src/lib/utils.ts`) for conditional class merging

### Path Aliases
Configured in `tsconfig.json` and `vite.config.ts`:
- `@/` → `./src/` (e.g., `@/components`, `@/store`, `@/lib`)

### Development Mode Features
- `lovable-tagger` plugin enabled in development for component tagging
- Strict TypeScript checks are **relaxed**: `noImplicitAny: false`, `strictNullChecks: false`, `noUnusedLocals: false`

## Key Architectural Patterns

### Single-Instance Windows
All window-opening methods (taskbar click, start menu, desktop icon) use `openOrFocusWindow()` which:
1. Checks if window with matching `appId` exists
2. If exists: focuses and restores existing window
3. If not: creates new window with unique `id`

### Persistent State
Zustand persist middleware stores:
- Open windows with their positions/sizes
- Pinned apps in taskbar
- User settings

This means the desktop state persists across page refreshes.

### Context Menus
Right-click functionality throughout the desktop using `useContextMenu` hook:
- Desktop: View options, sort by, new items, personalize
- Start Menu apps: Pin/unpin to taskbar
- Supports nested submenus and checkmarks

### Authentication Flow
Three-stage sequence (`authStep` state):
1. `lock` → Lock screen with unlock button
2. `email` → Optional email entry
3. `desktop` → Full desktop interface

## Important Notes

- **No backend**: This is a purely client-side application
- **No testing setup**: No test files or test scripts exist
- **Lovable Integration**: Changes pushed to git are reflected in Lovable and vice versa
- **TypeScript Configuration**: Lenient settings for faster development (many strict checks disabled)
- **Browser Support**: Built for modern browsers (uses ESNext features)
- **Window Bounds**: Windows are constrained to viewport with `bounds="window"` in react-rnd

## Editing Guidelines

### Adding New Desktop Apps
1. Add app config to `src/data/apps.json` with unique `id`, icon, content type, color gradient
2. If pinned by default, add to `DEFAULT_PINNED_APPS` in `desktopStore.ts`
3. Ensure `appId` matches for single-instance behavior
4. Create content component in `Window.tsx` if custom content needed

### Window Content Components
All window content is rendered inside `Window.tsx` based on the `content` prop. To add new content:
1. Create a component inside `Window.tsx` (e.g., `const MyNewContent = () => (...)`)
2. Add conditional rendering: `{content === 'my-content' && <MyNewContent />}`

### Styling Conventions
- Use Tailwind utility classes with `cn()` for conditional styles
- Black (`bg-black`) and zinc/neutral borders (`border-zinc-800`) for UI elements
- Gradient backgrounds for app icons (defined per app in data/apps.json)
- White text on dark backgrounds for primary content
- Zinc-400/500 for muted/secondary text

## ESLint Configuration
- Based on TypeScript ESLint with React plugins
- **Unused variables check is disabled** (`@typescript-eslint/no-unused-vars: off`)
- React Hooks rules enforced
- React Refresh warnings for HMR compatibility
