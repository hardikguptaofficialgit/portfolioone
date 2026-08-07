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
    MessageCircle,
    Bot,
    BrainCircuit,
    Sparkles,
    SearchCheck,
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
    Message as MessageIconoir,
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
    MessageCircle,
    ChatGPT: Bot,
    Claude: BrainCircuit,
    Gemini: Sparkles,
    Perplexity: SearchCheck,
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
    MessageCircle: MessageIconoir,
    ChatGPT: MessageIconoir,
    Claude: MessageIconoir,
    Gemini: MessageIconoir,
    Perplexity: MessageIconoir,
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

const SvgPathIcon = (label: string, path: string) => {
    const WrappedIcon = (props: any) => {
        const size = props.size || 24;
        const color = props.color || props.fill || 'currentColor';
        const { className, ...rest } = props;
        return React.createElement(
            'svg',
            {
                viewBox: '0 0 24 24',
                width: size,
                height: size,
                fill: color,
                className,
                role: 'img',
                'aria-label': label,
                ...rest,
            },
            React.createElement('path', { d: path })
        );
    };
    WrappedIcon.displayName = `${label}Icon`;
    return WrappedIcon;
};

const ChatGPTIcon = SvgPathIcon(
    'ChatGPT',
    'M22.3 9.8a6 6 0 0 0-.5-4.9 6.1 6.1 0 0 0-6.5-2.9A6.1 6.1 0 0 0 5 4.2a6 6 0 0 0-4 2.9 6.1 6.1 0 0 0 .7 7.1 6 6 0 0 0 .5 4.9 6.1 6.1 0 0 0 6.5 2.9A6 6 0 0 0 13.3 24a6.1 6.1 0 0 0 5.8-4.2 6 6 0 0 0 4-2.9 6.1 6.1 0 0 0-.8-7.1ZM13.3 22.4a4.5 4.5 0 0 1-2.9-1l.1-.1 4.8-2.8a.8.8 0 0 0 .4-.7v-6.7l2 1.2v5.6a4.5 4.5 0 0 1-4.4 4.5ZM3.6 18.3a4.5 4.5 0 0 1-.5-3l.1.1 4.8 2.8a.8.8 0 0 0 .8 0l5.8-3.4v2.3l-4.8 2.8a4.5 4.5 0 0 1-6.2-1.6ZM2.3 7.9a4.5 4.5 0 0 1 2.4-2V11.6a.8.8 0 0 0 .4.7l5.8 3.4-2 1.1H8.8L4 14a4.5 4.5 0 0 1-1.7-6.1Zm16.6 3.9-5.8-3.4 2-1.2h.1L20 10a4.5 4.5 0 0 1-.7 8.1v-5.7a.8.8 0 0 0-.4-.6Zm2-3.1-.1-.1L16 5.8a.8.8 0 0 0-.8 0L9.4 9.2V6.9l4.8-2.8a4.5 4.5 0 0 1 6.7 4.6ZM8.3 12.9l-2-1.2V6.1a4.5 4.5 0 0 1 7.4-3.5l-.2.1-4.8 2.8a.8.8 0 0 0-.4.7v6.7Zm1.1-2.4 2.6-1.5 2.6 1.5v3l-2.6 1.5-2.6-1.5v-3Z'
);
const ClaudeIcon = SvgPathIcon('Claude', 'M13.8 3.5h3.6L24 20h-3.6L13.8 3.5Zm-7 0h3.6L17 20h-3.6L6.8 3.5ZM0 20 6.6 3.5h3.6L3.6 20H0Z');
const GeminiIcon = SvgPathIcon('Gemini', 'M12 1.5c-.8 5.7-4.8 9.8-10.5 10.5 5.7.8 9.7 4.8 10.5 10.5.8-5.7 4.8-9.7 10.5-10.5-5.7-.7-9.7-4.8-10.5-10.5Z');
const PerplexityIcon = SvgPathIcon('Perplexity', 'M4.5 2.8 10.8 8V3h2.4v5l6.3-5.2V21l-6.3-5.2V21h-2.4v-5.2L4.5 21V2.8Zm2.4 5.1v8l3.9-3.2v-1.6L6.9 7.9Zm10.2 0-3.9 3.2v1.6l3.9 3.2v-8Z');

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
    MessageCircle: DoodleIcon(Interfaces.Message),
    ChatGPT: ChatGPTIcon,
    Claude: ClaudeIcon,
    Gemini: GeminiIcon,
    Perplexity: PerplexityIcon,
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
