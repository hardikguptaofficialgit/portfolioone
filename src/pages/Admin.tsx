import { useEffect, useMemo, useState } from 'react';
import type { Project } from '@/content/types';

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

const tokenKey = 'portfolio_admin_token';

const styles = {
  page: 'min-h-screen bg-black text-slate-50',
  shell: 'rounded-[2rem] border border-white/10 bg-slate-950/72 shadow-[0_18px_42px_rgba(0,0,0,0.24)] backdrop-blur-xl',
  panel: 'rounded-[1.75rem] border border-white/10 bg-slate-950/68 shadow-[0_12px_30px_rgba(0,0,0,0.20)] backdrop-blur-xl',
  field:
    'w-full rounded-[1rem] border border-white/12 bg-white/[0.07] px-3 py-2.5 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 hover:border-blue-400/70 hover:bg-white/[0.09] focus:border-blue-400 focus:bg-white/[0.10] focus:ring-4 focus:ring-blue-500/18',
  label: 'space-y-1.5 text-sm font-medium text-slate-300',
  primaryButton:
    'rounded-[1rem] bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/25 disabled:cursor-not-allowed disabled:opacity-55',
  secondaryButton:
    'rounded-[1rem] border border-white/12 bg-white/[0.07] px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-blue-400/50 hover:bg-blue-500/12 hover:text-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-500/20',
  dangerButton:
    'rounded-[1rem] border border-rose-400/25 bg-rose-950/18 px-4 py-2.5 text-sm font-semibold text-rose-200 transition hover:border-rose-300/50 hover:bg-rose-500/14 hover:text-rose-100 focus:outline-none focus:ring-4 focus:ring-rose-500/18',
};

const toProjectPayload = (project: Project) => ({
  ...project,
  tech: Array.isArray(project.tech) ? project.tech : [],
  sortOrder: Number(project.sortOrder) || 999,
  featured: Boolean(project.featured),
  archived: Boolean(project.archived),
  imageUrl: project.imageUrl || null,
});

const Admin = () => {
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey) || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState<Project>(emptyProject);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedId),
    [projects, selectedId]
  );

  useEffect(() => {
    if (selectedProject) setDraft(selectedProject);
  }, [selectedProject]);

  const request = async (url: string, init: RequestInit = {}) => {
    const res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init.headers || {}),
      },
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload.error || 'Request failed.');
    return payload;
  };

  const loadProjects = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const payload = await request('/api/admin/projects');
      const next = Array.isArray(payload.data) ? payload.data : [];
      setProjects(next);
      if (!selectedId && next[0]) setSelectedId(next[0].id);
      setMessage(`Loaded ${next.length} projects.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload.token) throw new Error(payload.error || 'Login failed.');
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

  const saveProject = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const isNew = !projects.some((project) => project.id === draft.id);
      const url = isNew ? '/api/admin/projects' : `/api/admin/projects/${encodeURIComponent(draft.id)}`;
      const payload = await request(url, {
        method: isNew ? 'POST' : 'PATCH',
        body: JSON.stringify(toProjectPayload(draft)),
      });
      setMessage(isNew ? 'Project created.' : 'Project updated.');
      await loadProjects();
      if (payload.data?.id) setSelectedId(payload.data.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setLoading(false);
    }
  };

  const deleteSelected = async () => {
    if (!draft.id || !confirm(`Delete ${draft.name || draft.id}?`)) return;
    setLoading(true);
    try {
      await request(`/api/admin/projects/${encodeURIComponent(draft.id)}`, { method: 'DELETE' });
      setSelectedId('');
      setDraft(emptyProject);
      setMessage('Project deleted.');
      await loadProjects();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Delete failed.');
    } finally {
      setLoading(false);
    }
  };

  const updateDraft = (key: keyof Project, value: string | boolean | number | string[] | null) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  if (!token) {
    return (
      <main className={`${styles.page} flex items-center justify-center px-4`}>
        <form onSubmit={login} className={`${styles.shell} w-full max-w-sm space-y-5 p-6`}>
          <div>
            <h1 className="text-xl font-semibold text-slate-50">Admin</h1>
            <p className="mt-1 text-sm text-slate-400">Sign in to manage portfolio projects.</p>
          </div>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder="Email"
            className={styles.field}
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Password"
            className={styles.field}
          />
          <button disabled={loading} className={`${styles.primaryButton} w-full`}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          {message && <p className="text-xs font-medium text-slate-400">{message}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className={`${styles.shell} flex items-center justify-between gap-4 p-5`}>
          <div>
            <h1 className="text-xl font-semibold text-slate-50">Project Admin</h1>
            <p className="text-sm text-slate-400">Create, edit, archive, feature, and delete portfolio projects.</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem(tokenKey);
              setToken('');
            }}
            className={styles.secondaryButton}
          >
            Sign out
          </button>
        </header>

        <div className="grid gap-6 py-6 md:grid-cols-[280px_1fr]">
          <aside className={`${styles.panel} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-white/10 p-3">
              <span className="text-sm font-semibold text-slate-100">Projects</span>
              <button
                onClick={() => {
                  setSelectedId('');
                  setDraft({ ...emptyProject, sortOrder: projects.length + 1 });
                }}
                className="rounded-[0.85rem] bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
              >
                New
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedId(project.id)}
                  className={`block w-full border-b border-white/10 px-3 py-3 text-left text-sm transition ${
                    selectedId === project.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-200 hover:bg-blue-500/12 hover:text-blue-100'
                  }`}
                >
                  <span className="block font-medium">{project.name}</span>
                  <span className={`text-xs ${selectedId === project.id ? 'text-blue-100' : 'text-slate-500'}`}>
                    {project.id}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <form onSubmit={saveProject} className={`${styles.panel} space-y-4 p-4`}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className={styles.label}>
                <span>ID</span>
                <input value={draft.id} onChange={(e) => updateDraft('id', e.target.value)} className={styles.field} placeholder="my-project" />
              </label>
              <label className={styles.label}>
                <span>Name</span>
                <input value={draft.name} onChange={(e) => updateDraft('name', e.target.value)} className={styles.field} />
              </label>
              <label className={styles.label}>
                <span>Tag</span>
                <input value={draft.tag || ''} onChange={(e) => updateDraft('tag', e.target.value)} className={styles.field} />
              </label>
              <label className={styles.label}>
                <span>Sort order</span>
                <input type="number" value={draft.sortOrder ?? 999} onChange={(e) => updateDraft('sortOrder', Number(e.target.value))} className={styles.field} />
              </label>
              <label className={`${styles.label} md:col-span-2`}>
                <span>Description</span>
                <textarea value={draft.description} onChange={(e) => updateDraft('description', e.target.value)} rows={4} className={styles.field} />
              </label>
              <label className={styles.label}>
                <span>Live URL</span>
                <input value={draft.liveUrl} onChange={(e) => updateDraft('liveUrl', e.target.value)} className={styles.field} />
              </label>
              <label className={styles.label}>
                <span>GitHub URL</span>
                <input value={draft.githubUrl || ''} onChange={(e) => updateDraft('githubUrl', e.target.value)} className={styles.field} />
              </label>
              <label className={styles.label}>
                <span>Image URL</span>
                <input value={draft.imageUrl || ''} onChange={(e) => updateDraft('imageUrl', e.target.value || null)} className={styles.field} />
              </label>
              <label className={styles.label}>
                <span>Tech, comma separated</span>
                <input value={draft.tech.join(', ')} onChange={(e) => updateDraft('tech', e.target.value.split(',').map((item) => item.trim()).filter(Boolean))} className={styles.field} />
              </label>
            </div>

            <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-300">
              <label className="inline-flex items-center gap-2 rounded-[1rem] border border-white/10 bg-white/[0.06] px-3 py-2">
                <input className="accent-blue-600" type="checkbox" checked={draft.featured !== false} onChange={(e) => updateDraft('featured', e.target.checked)} />
                Featured
              </label>
              <label className="inline-flex items-center gap-2 rounded-[1rem] border border-white/10 bg-white/[0.06] px-3 py-2">
                <input className="accent-blue-600" type="checkbox" checked={Boolean(draft.archived)} onChange={(e) => updateDraft('archived', e.target.checked)} />
                Archived
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
              <button disabled={loading} className={styles.primaryButton}>
                {loading ? 'Saving...' : 'Save project'}
              </button>
              {draft.id && (
                <button type="button" onClick={deleteSelected} className={styles.dangerButton}>
                  Delete
                </button>
              )}
              {message && <p className="text-sm font-medium text-slate-400">{message}</p>}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Admin;
