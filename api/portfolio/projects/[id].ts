export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  const id = String(req.query?.id || '');
  if (!id) {
    res.status(400).json({ error: 'Missing project id.' });
    return;
  }

  try {
    const { handlePortfolioProjectById } = await import('../../_lib/portfolio-handlers');
    return await handlePortfolioProjectById(req, res, id);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[portfolio/projects/id] bootstrap failed:', message);
    return res.status(500).json({ error: message });
  }
}
