import {
    Github,
    Code2,
    Figma,
    Chrome,
    Terminal,
    FileText,
    Folder,
    Mail,
    Calendar,
    Image,
    Database,
    Settings,
    Music,
    Briefcase,
    User,
} from 'lucide-react';

import {
    Github as GithubIconoir,
    Code as CodeIconoir,
    Figma as FigmaIconoir,
    Google as GoogleIconoir,
    Terminal as TerminalIconoir,
    Page as PageIconoir,
    Folder as FolderIconoir,
    Mail as MailIconoir,
    Calendar as CalendarIconoir,
    MediaImage as ImageIconoir,
    Database as DatabaseIconoir,
    Settings as SettingsIconoir,
    Spotify as SpotifyIconoir,
    Suitcase as SuitcaseIconoir,
    User as UserIconoir,
} from 'iconoir-react';
import appsData from '@/data/apps.json';

export interface App {
    id: string;
    name: string;
    icon: string;
    content: string;
    pinned: boolean;
    color: string;
}

const lucideMap: Record<string, any> = {
    Github,
    Code2,
    Figma,
    Chrome,
    Terminal,
    FileText,
    Folder,
    Mail,
    Calendar,
    Image,
    Database,
    Settings,
    Music,
    Briefcase,
    User,
};

const iconoirMap: Record<string, any> = {
    Github: GithubIconoir,
    Code2: CodeIconoir,
    Figma: FigmaIconoir,
    Chrome: GoogleIconoir,
    Terminal: TerminalIconoir,
    FileText: PageIconoir,
    Folder: FolderIconoir,
    Mail: MailIconoir,
    Calendar: CalendarIconoir,
    Image: ImageIconoir,
    Database: DatabaseIconoir,
    Settings: SettingsIconoir,
    Music: SpotifyIconoir,
    Briefcase: SuitcaseIconoir,
    User: UserIconoir,
};

// Get the icon component from the icon name
export const getIconComponent = (iconName: string, library: 'lucide' | 'iconoir' = 'iconoir'): any => {
    if (library === 'lucide') {
        return lucideMap[iconName] || Folder;
    }
    return iconoirMap[iconName] || FolderIconoir;
};

// Get all apps
export const getAllApps = (): App[] => {
    return appsData.apps;
};

// Get pinned apps only
export const getPinnedApps = (): App[] => {
    return appsData.apps.filter(app => app.pinned);
};

// Get app by ID
export const getAppById = (id: string): App | undefined => {
    return appsData.apps.find(app => app.id === id);
};

// Get app style (gradient background)
export const getAppStyle = (app: App): string => {
    if (app.color.includes('neutral-800') || app.color.includes('neutral-900')) {
        return `bg-gradient-to-b ${app.color} border border-white/10 shadow-black/40`;
    }
    return `bg-gradient-to-b ${app.color} shadow-${app.color.split('-')[1]}-500/20`;
};
