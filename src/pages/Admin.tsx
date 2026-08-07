import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import {
  BookOpen,
  Camera,
  ImagePlus,
  Inbox,
  LayoutDashboard,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Save,
  Sun,
  Trash2,
} from 'lucide-react';
import type { BlogPost, NewsletterSettings, PhotoEvent, PortfolioDocument, Project } from '@/content/types';
import { defaultPortfolio } from '@/content/defaults';

const tokenKey = 'portfolio_admin_token';
const themeKey = 'portfolio_admin_theme';
const sidebarKey = 'portfolio_admin_sidebar_collapsed';

type SectionKey = 'overview' | 'projects' | 'photos' | 'blogs' | 'newsletter' | 'copy';
type AdminTheme = 'dark' | 'light';

type Subscriber = {
  id: number;
  email: string;
  is_active: boolean;
  subscribed_at: string;
  updated_at: string;
};

const emptyProject: Project = {
  id: '',
  name: '',
  tag: '',
  description: '',
  tech: [],
  liveUrl: '#',
  githubUrl: '#',
  imageUrl: null,
  featured: true,
  sortOrder: 999,
};

const emptyPhotoEvent: PhotoEvent = {
  id: '',
  title: '',
  description: '',
  date: '',
  pinned: false,
  images: [],
  sortOrder: 999,
};

const emptyBlogPost: BlogPost = {
  id: '',
  slug: '',
  title: '',
  excerpt: '',
  body: '',
  coverImage: null,
  tags: [],
  publishedAt: new Date().toISOString(),
  readingTimeMinutes: 1,
  featured: true,
  archived: false,
  sortOrder: 999,
};

const defaultNewsletter: NewsletterSettings = {
  title: 'Stryker Newsletter',
  description: 'Updates on products, engineering, AI, and things I am building.',
  welcomeSubject: 'Thanks for subscribing - you are all set',
  welcomeText: 'You will now receive updates about AI, engineering, and new posts.',
  fromName: 'Stryker',
  campaignSubject: 'Stryker Newsletter',
  campaignPreviewText: 'Latest updates from Stryker.',
  campaignHtml:
    '<div style="max-width:640px;margin:0 auto;padding:32px 24px;font-family:Arial,Helvetica,sans-serif;color:#111111;background:#ffffff;">\\n  <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">Newsletter title</h1>\\n  <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Write your email-compatible HTML here.</p>\\n</div>',
  campaignText: 'Latest updates from Stryker.',
};

const styles = {
  page: 'fixed inset-0 overflow-y-auto bg-[var(--admin-bg)] text-[var(--admin-text)]',
  card: 'rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)]',
  field:
    'w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-sm text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted)] focus:border-[var(--admin-strong-border)]',
  label: 'space-y-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]',
  primary:
    'inline-flex items-center justify-center gap-2 rounded-md border border-[var(--admin-primary-border)] bg-[var(--admin-primary)] px-3 py-2 text-sm font-semibold text-[var(--admin-primary-text)] disabled:cursor-not-allowed disabled:opacity-50',
  secondary:
    'inline-flex items-center justify-center gap-2 rounded-md border border-[var(--admin-border)] bg-[var(--admin-secondary)] px-3 py-2 text-sm font-semibold text-[var(--admin-text)] disabled:cursor-not-allowed disabled:opacity-50',
  danger:
    'inline-flex items-center justify-center gap-2 rounded-md border border-[var(--admin-strong-border)] bg-[var(--admin-secondary)] px-3 py-2 text-sm font-semibold text-[var(--admin-text)] disabled:cursor-not-allowed disabled:opacity-50',
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const splitList = (value: string) =>
  value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Could not read image.'));
    reader.readAsDataURL(file);
  });

const normalizePortfolio = (doc: PortfolioDocument): PortfolioDocument => ({
  ...defaultPortfolio,
  ...doc,
  projects: doc.projects ?? [],
  photoEvents: doc.photoEvents ?? [],
  blogPosts: doc.blogPosts ?? [],
  sections: doc.sections ?? {},
  newsletterSettings: doc.newsletterSettings ?? defaultNewsletter,
});

const Admin = () => {
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey) || '');
  const [adminTheme, setAdminTheme] = useState<AdminTheme>(() =>
    localStorage.getItem(themeKey) === 'light' ? 'light' : 'dark'
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(sidebarKey) === '1');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [section, setSection] = useState<SectionKey>('overview');
  const [portfolio, setPortfolio] = useState<PortfolioDocument>(() => normalizePortfolio(defaultPortfolio));
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState('');
  const [selectedBlog, setSelectedBlog] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingNewsletter, setSendingNewsletter] = useState(false);

  const newsletterSettings = portfolio.newsletterSettings ?? defaultNewsletter;
  const activeSubscribers = subscribers.filter((subscriber) => subscriber.is_active).length;
  const selectedProjectItem = portfolio.projects.find((item) => item.id === selectedProject) ?? null;
  const selectedPhotoItem = portfolio.photoEvents.find((item) => item.id === selectedPhoto) ?? null;
  const selectedBlogItem = portfolio.blogPosts.find((item) => item.id === selectedBlog) ?? null;
  const isDark = adminTheme === 'dark';
  const adminVars = useMemo(
    () =>
      ({
        '--admin-bg': isDark ? '#050505' : '#ffffff',
        '--admin-sidebar': isDark ? '#0a0a0a' : '#f7f7f7',
        '--admin-card': isDark ? '#111111' : '#ffffff',
        '--admin-input': isDark ? '#050505' : '#ffffff',
        '--admin-secondary': isDark ? '#171717' : '#f4f4f5',
        '--admin-text': isDark ? '#fafafa' : '#111111',
        '--admin-muted': isDark ? '#a3a3a3' : '#525252',
        '--admin-subtle': isDark ? '#737373' : '#737373',
        '--admin-border': isDark ? '#262626' : '#e5e5e5',
        '--admin-strong-border': isDark ? '#737373' : '#737373',
        '--admin-primary': isDark ? '#fafafa' : '#111111',
        '--admin-primary-text': isDark ? '#050505' : '#ffffff',
        '--admin-primary-border': isDark ? '#fafafa' : '#111111',
        '--admin-row': isDark ? '#171717' : '#f8f8f8',
        '--admin-active': isDark ? '#fafafa' : '#111111',
        '--admin-active-text': isDark ? '#050505' : '#ffffff',
      }) as CSSProperties,
    [isDark]
  );

  const nav = useMemo(
    () => [
      { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
      { id: 'projects' as const, label: 'Projects', icon: LayoutDashboard },
      { id: 'photos' as const, label: 'Photos', icon: Camera },
      { id: 'blogs' as const, label: 'Blogs', icon: BookOpen },
      { id: 'newsletter' as const, label: 'Newsletter', icon: Inbox },
      { id: 'copy' as const, label: 'Page Copy', icon: Save },
    ],
    []
  );

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(themeKey, adminTheme);
  }, [adminTheme]);

  useEffect(() => {
    localStorage.setItem(sidebarKey, sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  const request = async (url: string, init: RequestInit = {}) => {
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init.headers || {}),
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Request failed.');
    return payload;
  };

  const loadAll = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [portfolioPayload, subscriberPayload] = await Promise.all([
        request('/api/admin/portfolio'),
        request('/api/admin/newsletter/subscribers').catch(() => ({ data: [] })),
      ]);
      const next = normalizePortfolio(portfolioPayload.data ?? defaultPortfolio);
      setPortfolio(next);
      setSubscribers(Array.isArray(subscriberPayload.data) ? subscriberPayload.data : []);
      setSelectedProject((current) => current || next.projects[0]?.id || '');
      setSelectedPhoto((current) => current || next.photoEvents[0]?.id || '');
      setSelectedBlog((current) => current || next.blogPosts[0]?.id || '');
      setMessage('Dashboard loaded.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.token) throw new Error(payload.error || 'Login failed.');
      localStorage.setItem(tokenKey, payload.token);
      setToken(payload.token);
      setPassword('');
      setMessage('Signed in.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const savePortfolio = async () => {
    setLoading(true);
    try {
      const payload = await request('/api/admin/portfolio', {
        method: 'PUT',
        body: JSON.stringify({ data: portfolio }),
      });
      setPortfolio(normalizePortfolio(payload.data));
      setMessage('Changes saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File, folder: string) => {
    const dataUrl = await readFileAsDataUrl(file);
    const payload = await request('/api/admin/upload', {
      method: 'POST',
      body: JSON.stringify({ file: dataUrl, folder }),
    });
    return String(payload.url || '');
  };

  const uploadProjectImage = async (file: File, id: string) => {
    const url = await uploadImage(file, `portfolio/projects/${id || 'draft'}`);
    setPortfolio((current) => ({
      ...current,
      projects: current.projects.map((item) => (item.id === id ? { ...item, imageUrl: url } : item)),
    }));
    setMessage('Project image uploaded. Save to publish it.');
  };

  const uploadPhotoImages = async (files: FileList, id: string) => {
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      urls.push(await uploadImage(file, `portfolio/photos/${id || 'draft'}`));
    }
    setPortfolio((current) => ({
      ...current,
      photoEvents: current.photoEvents.map((item) =>
        item.id === id ? { ...item, images: [...item.images, ...urls] } : item
      ),
    }));
    setMessage(`${urls.length} photo${urls.length === 1 ? '' : 's'} uploaded. Save to publish.`);
  };

  const uploadBlogCover = async (file: File, id: string) => {
    const url = await uploadImage(file, `portfolio/blogs/${id || 'draft'}`);
    setPortfolio((current) => ({
      ...current,
      blogPosts: current.blogPosts.map((item) => (item.id === id ? { ...item, coverImage: url } : item)),
    }));
    setMessage('Blog cover uploaded. Save to publish it.');
  };

  const updateProject = (id: string, patch: Partial<Project>) => {
    setPortfolio((current) => ({
      ...current,
      projects: current.projects.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const updatePhoto = (id: string, patch: Partial<PhotoEvent>) => {
    setPortfolio((current) => ({
      ...current,
      photoEvents: current.photoEvents.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const updateBlog = (id: string, patch: Partial<BlogPost>) => {
    setPortfolio((current) => ({
      ...current,
      blogPosts: current.blogPosts.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const addProject = () => {
    const id = `project-${portfolio.projects.length + 1}`;
    setPortfolio((current) => ({ ...current, projects: [...current.projects, { ...emptyProject, id, name: 'New Project' }] }));
    setSelectedProject(id);
  };

  const addPhoto = () => {
    const id = `photo-event-${portfolio.photoEvents.length + 1}`;
    setPortfolio((current) => ({ ...current, photoEvents: [...current.photoEvents, { ...emptyPhotoEvent, id, title: 'New Photo Event' }] }));
    setSelectedPhoto(id);
  };

  const addBlog = () => {
    const id = `post-${portfolio.blogPosts.length + 1}`;
    setPortfolio((current) => ({ ...current, blogPosts: [...current.blogPosts, { ...emptyBlogPost, id, slug: id, title: 'New Blog Post' }] }));
    setSelectedBlog(id);
  };

  const deleteProject = (id: string) => {
    if (!confirm('Delete this project?')) return;
    setPortfolio((current) => ({ ...current, projects: current.projects.filter((item) => item.id !== id) }));
    setSelectedProject('');
  };

  const deletePhoto = (id: string) => {
    if (!confirm('Delete this photo event?')) return;
    setPortfolio((current) => ({ ...current, photoEvents: current.photoEvents.filter((item) => item.id !== id) }));
    setSelectedPhoto('');
  };

  const deleteBlog = (id: string) => {
    if (!confirm('Delete this blog post?')) return;
    setPortfolio((current) => ({ ...current, blogPosts: current.blogPosts.filter((item) => item.id !== id) }));
    setSelectedBlog('');
  };

  const importDevTo = async () => {
    const username = prompt('DEV username to import from?', 'strykerinside');
    if (!username) return;
    setLoading(true);
    try {
      const payload = await request('/api/admin/blogs/import-devto', {
        method: 'POST',
        body: JSON.stringify({ username, limit: 50, replaceExisting: true }),
      });
      setMessage(`Imported ${payload.imported || 0} posts with Cloudinary images.`);
      await loadAll();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Blog import failed.');
    } finally {
      setLoading(false);
    }
  };

  const updateSubscriber = async (subscriber: Subscriber, patch: Partial<Subscriber>) => {
    try {
      const payload = await request('/api/admin/newsletter/subscribers', {
        method: 'POST',
        body: JSON.stringify({ id: subscriber.id, ...patch }),
      });
      setSubscribers((current) => current.map((item) => (item.id === subscriber.id ? payload.data : item)));
      setMessage('Subscriber updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Subscriber update failed.');
    }
  };

  const deleteSubscriber = async (subscriber: Subscriber) => {
    if (!confirm(`Delete ${subscriber.email}?`)) return;
    try {
      await request('/api/admin/newsletter/subscribers', {
        method: 'POST',
        body: JSON.stringify({ id: subscriber.id, action: 'delete' }),
      });
      setSubscribers((current) => current.filter((item) => item.id !== subscriber.id));
      setMessage('Subscriber deleted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Subscriber delete failed.');
    }
  };

  const updateNewsletterSettings = (patch: Partial<NewsletterSettings>) => {
    setPortfolio((current) => ({
      ...current,
      newsletterSettings: { ...(current.newsletterSettings ?? defaultNewsletter), ...patch },
    }));
  };

  const sendNewsletter = async () => {
    if (!confirm(`Send this newsletter to ${activeSubscribers} active subscriber${activeSubscribers === 1 ? '' : 's'}?`)) return;
    setSendingNewsletter(true);
    try {
      const payload = await request('/api/admin/newsletter/send', {
        method: 'POST',
        body: JSON.stringify({
          subject: newsletterSettings.campaignSubject,
          previewText: newsletterSettings.campaignPreviewText,
          html: newsletterSettings.campaignHtml,
          text: newsletterSettings.campaignText,
        }),
      });
      setMessage(`Newsletter sent to ${payload.sent || 0} active subscriber${payload.sent === 1 ? '' : 's'}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Newsletter send failed.');
    } finally {
      setSendingNewsletter(false);
    }
  };

  if (!token) {
    return (
      <main className={`${styles.page} flex items-center justify-center px-4 py-8`} style={adminVars}>
        <button
          type="button"
          onClick={() => setAdminTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
          className={`${styles.secondary} absolute right-4 top-4 h-10 w-10 px-0`}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <form onSubmit={login} className={`${styles.card} w-full max-w-sm space-y-5 p-6`}>
          <div>
            <h1 className="text-xl font-semibold">Admin</h1>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">Sign in to manage portfolio content.</p>
          </div>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email" className={styles.field} />
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Password" className={styles.field} />
          <button disabled={loading} className={`${styles.primary} w-full`}>{loading ? 'Signing in...' : 'Sign in'}</button>
          {message && <p className="text-xs text-[var(--admin-muted)]">{message}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className={styles.page} style={adminVars}>
      <div
        className={`grid min-h-screen transition-[grid-template-columns] duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:grid-cols-[80px_minmax(0,1fr)]' : 'lg:grid-cols-[280px_minmax(0,1fr)]'
        }`}
      >
        <aside className="border-b border-[var(--admin-border)] bg-[var(--admin-sidebar)] p-4 lg:border-b-0 lg:border-r">
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'lg:justify-center' : 'justify-between lg:block'}`}>
            {!sidebarCollapsed && (
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--admin-muted)]">Portfolio</p>
                <h1 className="mt-1 text-lg font-semibold">Control Center</h1>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((current) => !current)}
              className={`${styles.secondary} h-10 w-10 px-0 ${sidebarCollapsed ? '' : 'lg:mt-5 lg:hidden'}`}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>

          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(true)}
              className={`${styles.secondary} mt-5 hidden h-10 w-full lg:flex`}
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose size={15} /> Collapse
            </button>
          )}

          <div className="mt-5 grid gap-2">
            <button
              type="button"
              onClick={() => setAdminTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              className={`${styles.secondary} h-10 ${sidebarCollapsed ? 'w-10 px-0' : 'w-full justify-start'}`}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
              {!sidebarCollapsed && <span>{isDark ? 'Light mode' : 'Dark mode'}</span>}
            </button>
            <button
              onClick={() => {
                localStorage.removeItem(tokenKey);
                setToken('');
              }}
              className={`${styles.secondary} h-10 ${sidebarCollapsed ? 'w-10 px-0' : 'w-full justify-start'}`}
              aria-label="Sign out"
            >
              <LogOut size={15} /> {!sidebarCollapsed && <span>Sign out</span>}
            </button>
          </div>

          <nav className="mt-6 grid gap-1">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`flex h-10 items-center rounded-md text-left text-sm font-medium ${
                    sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
                  } ${
                    section === item.id
                      ? 'bg-[var(--admin-active)] text-[var(--admin-active-text)]'
                      : 'text-[var(--admin-muted)]'
                  }`}
                >
                  <Icon size={16} /> {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 p-4 sm:p-6">
          <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold capitalize">{section}</h2>
              <p className="text-sm text-[var(--admin-muted)]">Photos, blogs, projects, newsletter, and page copy are all editable here.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={loadAll} disabled={loading} className={styles.secondary}>Reload</button>
              <button onClick={savePortfolio} disabled={loading} className={styles.primary}><Save size={15} /> Save changes</button>
            </div>
          </header>

          {message && <div className="mb-5 rounded-md border border-[var(--admin-border)] bg-[var(--admin-secondary)] px-3 py-2 text-sm text-[var(--admin-text)]">{message}</div>}

          {section === 'overview' && (
            <div className="grid gap-4 md:grid-cols-4">
              {[
                ['Projects', portfolio.projects.length],
                ['Photo Events', portfolio.photoEvents.length],
                ['Blog Posts', portfolio.blogPosts.length],
                ['Subscribers', activeSubscribers],
              ].map(([label, value]) => (
                <div key={label} className={`${styles.card} p-5`}>
                  <p className="text-sm text-[var(--admin-muted)]">{label}</p>
                  <p className="mt-2 text-3xl font-semibold">{value}</p>
                </div>
              ))}
            </div>
          )}

          {section === 'projects' && (
            <EditorShell
              items={portfolio.projects}
              selectedId={selectedProject}
              onSelect={setSelectedProject}
              onAdd={addProject}
              getLabel={(item) => item.name || item.id}
            >
              {selectedProjectItem && (
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="ID" value={selectedProjectItem.id} onChange={(value) => {
                    const nextId = slugify(value);
                    updateProject(selectedProjectItem.id, { id: nextId });
                    setSelectedProject(nextId);
                  }} />
                  <TextField label="Name" value={selectedProjectItem.name} onChange={(value) => updateProject(selectedProjectItem.id, { name: value })} />
                  <TextField label="Tag" value={selectedProjectItem.tag || ''} onChange={(value) => updateProject(selectedProjectItem.id, { tag: value })} />
                  <TextField label="Sort order" type="number" value={String(selectedProjectItem.sortOrder ?? 999)} onChange={(value) => updateProject(selectedProjectItem.id, { sortOrder: Number(value) || 999 })} />
                  <TextArea label="Description" value={selectedProjectItem.description} onChange={(value) => updateProject(selectedProjectItem.id, { description: value })} className="md:col-span-2" />
                  <TextField label="Live URL" value={selectedProjectItem.liveUrl} onChange={(value) => updateProject(selectedProjectItem.id, { liveUrl: value || '#' })} />
                  <TextField label="GitHub URL" value={selectedProjectItem.githubUrl || ''} onChange={(value) => updateProject(selectedProjectItem.id, { githubUrl: value || '#' })} />
                  <TextField label="Image URL" value={selectedProjectItem.imageUrl || ''} onChange={(value) => updateProject(selectedProjectItem.id, { imageUrl: value || null })} />
                  <FileField label="Upload image" onChange={(file) => uploadProjectImage(file, selectedProjectItem.id)} />
                  <TextField label="Tech, comma separated" value={selectedProjectItem.tech.join(', ')} onChange={(value) => updateProject(selectedProjectItem.id, { tech: splitList(value) })} className="md:col-span-2" />
                  <ToggleRow
                    values={[
                      ['Featured', selectedProjectItem.featured !== false, (checked) => updateProject(selectedProjectItem.id, { featured: checked })],
                      ['Archived', Boolean(selectedProjectItem.archived), (checked) => updateProject(selectedProjectItem.id, { archived: checked })],
                    ]}
                  />
                  <div className="md:col-span-2">
                    <button onClick={() => deleteProject(selectedProjectItem.id)} className={styles.danger}><Trash2 size={15} /> Delete project</button>
                  </div>
                </div>
              )}
            </EditorShell>
          )}

          {section === 'photos' && (
            <EditorShell
              items={portfolio.photoEvents}
              selectedId={selectedPhoto}
              onSelect={setSelectedPhoto}
              onAdd={addPhoto}
              getLabel={(item) => item.title || item.id}
            >
              {selectedPhotoItem && (
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="ID" value={selectedPhotoItem.id} onChange={(value) => {
                    const nextId = slugify(value);
                    updatePhoto(selectedPhotoItem.id, { id: nextId });
                    setSelectedPhoto(nextId);
                  }} />
                  <TextField label="Title" value={selectedPhotoItem.title} onChange={(value) => updatePhoto(selectedPhotoItem.id, { title: value })} />
                  <TextField label="Date" value={selectedPhotoItem.date} onChange={(value) => updatePhoto(selectedPhotoItem.id, { date: value })} />
                  <TextField label="Sort order" type="number" value={String(selectedPhotoItem.sortOrder ?? 999)} onChange={(value) => updatePhoto(selectedPhotoItem.id, { sortOrder: Number(value) || 999 })} />
                  <TextArea label="Description" value={selectedPhotoItem.description} onChange={(value) => updatePhoto(selectedPhotoItem.id, { description: value })} className="md:col-span-2" />
                  <FileField label="Upload photos" multiple onFiles={(files) => uploadPhotoImages(files, selectedPhotoItem.id)} />
                  <ToggleRow values={[['Pinned', Boolean(selectedPhotoItem.pinned), (checked) => updatePhoto(selectedPhotoItem.id, { pinned: checked })]]} />
                  <div className="md:col-span-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {selectedPhotoItem.images.map((image, index) => (
                      <div key={`${image}-${index}`} className="overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-input)]">
                        <img src={image} alt="" className="aspect-video w-full object-cover" />
                        <button
                          onClick={() => updatePhoto(selectedPhotoItem.id, { images: selectedPhotoItem.images.filter((_, i) => i !== index) })}
                          className="w-full border-t border-[var(--admin-border)] px-3 py-2 text-xs font-medium text-[var(--admin-text)]"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="md:col-span-2">
                    <button onClick={() => deletePhoto(selectedPhotoItem.id)} className={styles.danger}><Trash2 size={15} /> Delete photo event</button>
                  </div>
                </div>
              )}
            </EditorShell>
          )}

          {section === 'blogs' && (
            <EditorShell
              items={portfolio.blogPosts}
              selectedId={selectedBlog}
              onSelect={setSelectedBlog}
              onAdd={addBlog}
              getLabel={(item) => item.title || item.slug}
              actions={<button onClick={importDevTo} disabled={loading} className={styles.secondary}>Import from DEV</button>}
            >
              {selectedBlogItem && (
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="ID" value={selectedBlogItem.id} onChange={(value) => {
                    const nextId = slugify(value);
                    updateBlog(selectedBlogItem.id, { id: nextId });
                    setSelectedBlog(nextId);
                  }} />
                  <TextField label="Slug" value={selectedBlogItem.slug} onChange={(value) => updateBlog(selectedBlogItem.id, { slug: slugify(value) })} />
                  <TextField label="Title" value={selectedBlogItem.title} onChange={(value) => updateBlog(selectedBlogItem.id, { title: value })} />
                  <TextField label="Published at" type="datetime-local" value={selectedBlogItem.publishedAt.slice(0, 16)} onChange={(value) => updateBlog(selectedBlogItem.id, { publishedAt: new Date(value).toISOString() })} />
                  <TextField label="Reading time minutes" type="number" value={String(selectedBlogItem.readingTimeMinutes ?? 1)} onChange={(value) => updateBlog(selectedBlogItem.id, { readingTimeMinutes: Number(value) || 1 })} />
                  <TextField label="Cover image URL" value={selectedBlogItem.coverImage || ''} onChange={(value) => updateBlog(selectedBlogItem.id, { coverImage: value || null })} />
                  <FileField label="Upload cover" onChange={(file) => uploadBlogCover(file, selectedBlogItem.id)} />
                  <TextField label="Original/source URL" value={selectedBlogItem.sourceUrl || ''} onChange={(value) => updateBlog(selectedBlogItem.id, { sourceUrl: value || undefined })} className="md:col-span-2" />
                  <TextArea label="Excerpt" value={selectedBlogItem.excerpt} onChange={(value) => updateBlog(selectedBlogItem.id, { excerpt: value })} className="md:col-span-2" />
                  <TextField label="Tags, comma separated" value={selectedBlogItem.tags.join(', ')} onChange={(value) => updateBlog(selectedBlogItem.id, { tags: splitList(value) })} className="md:col-span-2" />
                  <div className="grid gap-4 md:col-span-2 xl:grid-cols-2">
                    <TextArea label="Markdown body" rows={24} value={selectedBlogItem.body} onChange={(value) => updateBlog(selectedBlogItem.id, { body: value })} />
                    <BlogMarkdownPreview markdown={selectedBlogItem.body || selectedBlogItem.excerpt || 'No content available.'} />
                  </div>
                  <ToggleRow
                    values={[
                      ['Featured', selectedBlogItem.featured !== false, (checked) => updateBlog(selectedBlogItem.id, { featured: checked })],
                      ['Archived', Boolean(selectedBlogItem.archived), (checked) => updateBlog(selectedBlogItem.id, { archived: checked })],
                    ]}
                  />
                  <div className="md:col-span-2">
                    <button onClick={() => deleteBlog(selectedBlogItem.id)} className={styles.danger}><Trash2 size={15} /> Delete blog post</button>
                  </div>
                </div>
              )}
            </EditorShell>
          )}

          {section === 'newsletter' && (
            <div className="grid gap-5">
              <div className={`${styles.card} grid gap-4 p-4 md:grid-cols-2`}>
                <TextField label="Newsletter title" value={newsletterSettings.title} onChange={(value) => updateNewsletterSettings({ title: value })} />
                <TextField label="From name" value={newsletterSettings.fromName || ''} onChange={(value) => updateNewsletterSettings({ fromName: value })} />
                <TextArea label="Description" value={newsletterSettings.description} onChange={(value) => updateNewsletterSettings({ description: value })} className="md:col-span-2" />
                <TextField label="Welcome subject" value={newsletterSettings.welcomeSubject} onChange={(value) => updateNewsletterSettings({ welcomeSubject: value })} />
                <TextArea label="Welcome email text" value={newsletterSettings.welcomeText} onChange={(value) => updateNewsletterSettings({ welcomeText: value })} className="md:col-span-2" />
              </div>
              <div className={`${styles.card} grid gap-4 p-4 xl:grid-cols-2`}>
                <div className="grid gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold">Newsletter campaign</h3>
                      <p className="text-sm text-[var(--admin-muted)]">Use email-compatible HTML with inline styles for Gmail and other clients.</p>
                    </div>
                    <button onClick={sendNewsletter} disabled={sendingNewsletter || activeSubscribers === 0} className={styles.primary}>
                      {sendingNewsletter ? 'Sending...' : `Send to ${activeSubscribers} active`}
                    </button>
                  </div>
                  <TextField label="Campaign subject" value={newsletterSettings.campaignSubject || ''} onChange={(value) => updateNewsletterSettings({ campaignSubject: value })} />
                  <TextField label="Preview text" value={newsletterSettings.campaignPreviewText || ''} onChange={(value) => updateNewsletterSettings({ campaignPreviewText: value })} />
                  <TextArea label="Email-compatible HTML" rows={18} value={newsletterSettings.campaignHtml || ''} onChange={(value) => updateNewsletterSettings({ campaignHtml: value })} />
                  <TextArea label="Plain-text fallback" rows={6} value={newsletterSettings.campaignText || ''} onChange={(value) => updateNewsletterSettings({ campaignText: value })} />
                </div>
                <div className="min-h-[520px] overflow-hidden rounded-lg border border-[var(--admin-border)] bg-white">
                  <iframe
                    title="Newsletter HTML preview"
                    srcDoc={newsletterSettings.campaignHtml || '<p style="font-family:Arial,sans-serif;padding:24px;">No HTML yet.</p>'}
                    className="h-full min-h-[520px] w-full border-0 bg-white"
                  />
                </div>
              </div>
              <div className={`${styles.card} overflow-hidden`}>
                <div className="flex items-center justify-between border-b border-[var(--admin-border)] p-4">
                  <h3 className="font-semibold">Subscribers</h3>
                  <span className="text-sm text-[var(--admin-muted)]">{activeSubscribers} active</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--admin-row)] text-xs uppercase tracking-wide text-[var(--admin-muted)]">
                      <tr><th className="px-4 py-3">Email</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Subscribed</th><th className="px-4 py-3"></th></tr>
                    </thead>
                    <tbody>
                      {subscribers.map((subscriber) => (
                        <tr key={subscriber.id} className="border-t border-[var(--admin-border)]">
                          <td className="px-4 py-3">{subscriber.email}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => updateSubscriber(subscriber, { is_active: !subscriber.is_active })} className={subscriber.is_active ? styles.primary : styles.secondary}>
                              {subscriber.is_active ? 'Active' : 'Paused'}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-[var(--admin-muted)]">{new Date(subscriber.subscribed_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-right"><button onClick={() => deleteSubscriber(subscriber)} className={styles.danger}><Trash2 size={14} /></button></td>
                        </tr>
                      ))}
                      {subscribers.length === 0 && <tr><td className="px-4 py-8 text-center text-[var(--admin-muted)]" colSpan={4}>No subscribers yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {section === 'copy' && (
            <div className={`${styles.card} grid gap-4 p-4 md:grid-cols-2`}>
              {[
                ['simplifiedPhotosIntro', 'Simplified photos'],
                ['simplifiedBlogIntro', 'Simplified blog'],
                ['simplifiedProjectsIntro', 'Simplified projects'],
                ['vscodeProjectsIntro', 'Desktop projects'],
                ['portfolioIntro', 'Portfolio intro'],
                ['aboutIntro', 'About intro'],
              ].map(([key, label]) => {
                const value = (portfolio.sections as any)[key] ?? { title: '', subtitle: '' };
                return (
                  <div key={key} className="rounded-lg border border-[var(--admin-border)] p-3">
                    <p className="mb-3 text-sm font-semibold">{label}</p>
                    <div className="grid gap-3">
                      <TextField label="Title" value={value.title || ''} onChange={(title) => setPortfolio((current) => ({ ...current, sections: { ...current.sections, [key]: { ...value, title } } }))} />
                      <TextField label="Subtitle" value={value.subtitle || ''} onChange={(subtitle) => setPortfolio((current) => ({ ...current, sections: { ...current.sections, [key]: { ...value, subtitle } } }))} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

const EditorShell = <TItem extends { id: string }>({
  items,
  selectedId,
  onSelect,
  onAdd,
  getLabel,
  actions,
  children,
}: {
  items: TItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  getLabel: (item: TItem) => string;
  actions?: ReactNode;
  children: ReactNode;
}) => (
  <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
    <aside className={`${styles.card} overflow-hidden`}>
      <div className="flex items-center justify-between gap-2 border-b border-[var(--admin-border)] p-3">
        <button onClick={onAdd} className={styles.primary}><Plus size={15} /> New</button>
        {actions}
      </div>
      <div className="max-h-[420px] overflow-y-auto">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`block w-full border-b border-[var(--admin-border)] px-3 py-3 text-left text-sm ${
              selectedId === item.id
                ? 'bg-[var(--admin-active)] text-[var(--admin-active-text)]'
                : 'text-[var(--admin-muted)]'
            }`}
          >
            <span className="block font-semibold">{getLabel(item)}</span>
            <span className="text-xs opacity-70">{item.id}</span>
          </button>
        ))}
        {items.length === 0 && <p className="px-3 py-8 text-sm text-[var(--admin-muted)]">Nothing here yet.</p>}
      </div>
    </aside>
    <div className={`${styles.card} p-4`}>{children}</div>
  </div>
);

const TextField = ({
  label,
  value,
  onChange,
  type = 'text',
  className = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  className?: string;
}) => (
  <label className={`${styles.label} ${className}`}>
    <span>{label}</span>
    <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={styles.field} />
  </label>
);

const TextArea = ({
  label,
  value,
  onChange,
  rows = 4,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  className?: string;
}) => (
  <label className={`${styles.label} ${className}`}>
    <span>{label}</span>
    <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} className={styles.field} />
  </label>
);

const FileField = ({
  label,
  multiple = false,
  onChange,
  onFiles,
}: {
  label: string;
  multiple?: boolean;
  onChange?: (file: File) => void;
  onFiles?: (files: FileList) => void;
}) => (
  <label className={styles.label}>
    <span>{label}</span>
    <span className={`${styles.secondary} w-full cursor-pointer`}>
      <ImagePlus size={15} /> Choose image{multiple ? 's' : ''}
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(event) => {
          const files = event.target.files;
          if (!files?.length) return;
          if (multiple && onFiles) onFiles(files);
          if (!multiple && onChange) onChange(files[0]);
          event.currentTarget.value = '';
        }}
      />
    </span>
  </label>
);

const ToggleRow = ({
  values,
}: {
  values: Array<[string, boolean, (checked: boolean) => void]>;
}) => (
  <div className="flex flex-wrap gap-3 md:col-span-2">
    {values.map(([label, checked, onChange]) => (
      <label key={label} className="inline-flex items-center gap-2 rounded-md border border-[var(--admin-border)] bg-[var(--admin-secondary)] px-3 py-2 text-sm font-medium text-[var(--admin-text)]">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="accent-[var(--admin-active)]" />
        {label}
      </label>
    ))}
  </div>
);

const BlogMarkdownPreview = ({ markdown }: { markdown: string }) => (
  <section className="min-h-[520px] rounded-lg border border-[var(--admin-border)] bg-[var(--admin-input)] p-4">
    <div className="mb-3 flex items-center justify-between border-b border-[var(--admin-border)] pb-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">Live markdown preview</p>
      <span className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-secondary)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--admin-text)]">
        GFM
      </span>
    </div>
    <div className="prose max-w-none text-[var(--admin-text)] prose-headings:text-[var(--admin-text)] prose-a:text-[var(--admin-text)] prose-strong:text-[var(--admin-text)] prose-code:rounded prose-code:bg-[var(--admin-secondary)] prose-code:px-1 prose-code:py-0.5 prose-code:text-[var(--admin-text)] prose-pre:border prose-pre:border-[var(--admin-border)] prose-pre:bg-[var(--admin-secondary)] prose-img:rounded-lg prose-img:border prose-img:border-[var(--admin-border)]">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>
        {markdown}
      </ReactMarkdown>
    </div>
  </section>
);

export default Admin;
