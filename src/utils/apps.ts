import React from 'react';
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
    Instagram,
    Twitter,
    Link,
    Linkedin,
    ExternalLink,
    BookOpen,
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
    Instagram as InstagramIconoir,
    Twitter as TwitterIconoir,
    Link as LinkIconoir,
    Linkedin as LinkedinIconoir,
    OpenNewWindow as ExternalLinkIconoir,
    Book as BookIconoir,
} from 'iconoir-react';

import { Logos, Interfaces, Files, Misc } from 'doodle-icons';
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
    Instagram,
    Twitter,
    Link,
    Linkedin,
    ExternalLink,
    BookOpen,
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
    Instagram: InstagramIconoir,
    Twitter: TwitterIconoir,
    Link: LinkIconoir,
    Linkedin: LinkedinIconoir,
    ExternalLink: ExternalLinkIconoir,
    BookOpen: BookIconoir,
};

// Doodle Icons wrapper components with consistent API
const DoodleIcon = (Component: any) => {
    if (!Component) {
        console.error('DoodleIcon: Component is undefined');
        return () => null;
    }
    const WrappedIcon = (props: any) => {
        const size = props.size || 24;
        const color = props.color || props.fill || 'currentColor';
        const { className, ...rest } = props;
        return React.createElement(Component, { 
            width: size, 
            height: size, 
            fill: color, 
            className, 
            ...rest 
        });
    };
    WrappedIcon.displayName = `DoodleIcon(${Component.displayName || Component.name || 'Component'})`;
    return WrappedIcon;
};

const doodleMap: Record<string, any> = {
    Github: DoodleIcon(Files.FileCode),
    Code2: DoodleIcon(Interfaces.Pencil),
    Figma: DoodleIcon(Files.FileFigma),
    Chrome: DoodleIcon(Logos.Google),
    Terminal: DoodleIcon(Interfaces.Dashboard),
    FileText: DoodleIcon(Files.FileText),
    Folder: DoodleIcon(Interfaces.Folder),
    Mail: DoodleIcon(Interfaces.Mail),
    Calendar: DoodleIcon(Interfaces.Calendar),
    Image: DoodleIcon(Interfaces.Photo),
    Database: DoodleIcon(Misc.Server),
    Settings: DoodleIcon(Interfaces.Setting),
    Music: DoodleIcon(Logos.Spotify),
    Briefcase: DoodleIcon(Interfaces.Suitcase),
    User: DoodleIcon(Interfaces.User),
    Instagram: DoodleIcon(Logos.Instagram),
    Twitter: DoodleIcon(Logos.Twitter),
    Link: DoodleIcon(Interfaces.Link),
    Linkedin: DoodleIcon(Logos.Linkedin),
    ExternalLink: DoodleIcon(Interfaces.Link),
    BookOpen: DoodleIcon(Files.FileText),
};

// Get the icon component from the icon name
export const getIconComponent = (iconName: string, library: 'lucide' | 'iconoir' | 'doodle' = 'doodle'): any => {
    if (library === 'lucide') {
        return lucideMap[iconName] || Folder;
    }
    if (library === 'doodle') {
        return doodleMap[iconName] || DoodleIcon(Interfaces.Folder);
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
