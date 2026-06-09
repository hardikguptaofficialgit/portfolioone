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
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <form onSubmit={login} className="w-full max-w-sm border border-white/20 p-6 space-y-5">
          <div>
            <h1 className="text-xl font-semibold">Admin</h1>
            <p className="mt-1 text-sm text-white/55">Sign in to manage portfolio projects.</p>
          </div>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder="Email"
            className="w-full bg-black border border-white/25 px-3 py-2 text-sm outline-none focus:border-white"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Password"
            className="w-full bg-black border border-white/25 px-3 py-2 text-sm outline-none focus:border-white"
          />
          <button disabled={loading} className="w-full bg-white text-black py-2 text-sm font-medium disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          {message && <p className="text-xs text-white/60">{message}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="flex items-center justify-between border-b border-white/15 pb-4">
          <div>
            <h1 className="text-xl font-semibold">Project Admin</h1>
            <p className="text-sm text-white/55">Create, edit, archive, feature, and delete portfolio projects.</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem(tokenKey);
              setToken('');
            }}
            className="border border-white/25 px-3 py-2 text-sm"
          >
            Sign out
          </button>
        </header>

        <div className="grid gap-6 py-6 md:grid-cols-[280px_1fr]">
          <aside className="border border-white/15">
            <div className="flex items-center justify-between border-b border-white/15 p-3">
              <span className="text-sm font-medium">Projects</span>
              <button
                onClick={() => {
                  setSelectedId('');
                  setDraft({ ...emptyProject, sortOrder: projects.length + 1 });
                }}
                className="bg-white px-2 py-1 text-xs text-black"
              >
                New
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedId(project.id)}
                  className={`block w-full border-b border-white/10 px-3 py-3 text-left text-sm ${
                    selectedId === project.id ? 'bg-white text-black' : 'hover:bg-white/10'
                  }`}
                >
                  <span className="block font-medium">{project.name}</span>
                  <span className="text-xs opacity-60">{project.id}</span>
                </button>
              ))}
            </div>
          </aside>

          <form onSubmit={saveProject} className="space-y-4 border border-white/15 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span>ID</span>
                <input value={draft.id} onChange={(e) => updateDraft('id', e.target.value)} className="w-full bg-black border border-white/25 px-3 py-2 outline-none focus:border-white" placeholder="my-project" />
              </label>
              <label className="space-y-1 text-sm">
                <span>Name</span>
                <input value={draft.name} onChange={(e) => updateDraft('name', e.target.value)} className="w-full bg-black border border-white/25 px-3 py-2 outline-none focus:border-white" />
              </label>
              <label className="space-y-1 text-sm">
                <span>Tag</span>
                <input value={draft.tag || ''} onChange={(e) => updateDraft('tag', e.target.value)} className="w-full bg-black border border-white/25 px-3 py-2 outline-none focus:border-white" />
              </label>
              <label className="space-y-1 text-sm">
                <span>Sort order</span>
                <input type="number" value={draft.sortOrder ?? 999} onChange={(e) => updateDraft('sortOrder', Number(e.target.value))} className="w-full bg-black border border-white/25 px-3 py-2 outline-none focus:border-white" />
              </label>
              <label className="space-y-1 text-sm md:col-span-2">
                <span>Description</span>
                <textarea value={draft.description} onChange={(e) => updateDraft('description', e.target.value)} rows={4} className="w-full bg-black border border-white/25 px-3 py-2 outline-none focus:border-white" />
              </label>
              <label className="space-y-1 text-sm">
                <span>Live URL</span>
                <input value={draft.liveUrl} onChange={(e) => updateDraft('liveUrl', e.target.value)} className="w-full bg-black border border-white/25 px-3 py-2 outline-none focus:border-white" />
              </label>
              <label className="space-y-1 text-sm">
                <span>GitHub URL</span>
                <input value={draft.githubUrl || ''} onChange={(e) => updateDraft('githubUrl', e.target.value)} className="w-full bg-black border border-white/25 px-3 py-2 outline-none focus:border-white" />
              </label>
              <label className="space-y-1 text-sm">
                <span>Image URL</span>
                <input value={draft.imageUrl || ''} onChange={(e) => updateDraft('imageUrl', e.target.value || null)} className="w-full bg-black border border-white/25 px-3 py-2 outline-none focus:border-white" />
              </label>
              <label className="space-y-1 text-sm">
                <span>Tech, comma separated</span>
                <input value={draft.tech.join(', ')} onChange={(e) => updateDraft('tech', e.target.value.split(',').map((item) => item.trim()).filter(Boolean))} className="w-full bg-black border border-white/25 px-3 py-2 outline-none focus:border-white" />
              </label>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={draft.featured !== false} onChange={(e) => updateDraft('featured', e.target.checked)} />
                Featured
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={Boolean(draft.archived)} onChange={(e) => updateDraft('archived', e.target.checked)} />
                Archived
              </label>
            </div>

            <div className="flex items-center gap-3 border-t border-white/15 pt-4">
              <button disabled={loading} className="bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50">
                {loading ? 'Saving...' : 'Save project'}
              </button>
              {draft.id && (
                <button type="button" onClick={deleteSelected} className="border border-white/25 px-4 py-2 text-sm">
                  Delete
                </button>
              )}
              {message && <p className="text-sm text-white/60">{message}</p>}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Admin;
