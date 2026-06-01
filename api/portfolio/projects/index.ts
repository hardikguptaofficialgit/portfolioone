export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  try {
    const { handlePortfolioProjects } = await import('../../_lib/portfolio-handlers');
    return await handlePortfolioProjects(req, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[portfolio/projects] bootstrap failed:', message);

    if (req?.method === 'GET') {
      try {
        const { loadPortfolioSeed } = await import('../../_lib/portfolio-seed');
        const projects = loadPortfolioSeed().projects.filter((p) => !p.archived);
        return res.status(200).json({
          ok: true,
          data: projects,
          meta: { source: 'seed', degraded: true },
        });
      } catch {
        /* fall through */
      }
    }

    return res.status(500).json({ error: message });
  }
}
