export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  try {
    const { handlePortfolioIndex } = await import('../_lib/portfolio-handlers');
    return await handlePortfolioIndex(req, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('[portfolio] handler bootstrap failed:', message, stack);

    if (req?.method === 'GET') {
      try {
        const { loadPortfolioSeed } = await import('../_lib/portfolio-seed');
        return res.status(200).json({
          ok: true,
          data: loadPortfolioSeed(),
          meta: { source: 'seed', writable: false, degraded: true },
        });
      } catch (seedError) {
        console.error('[portfolio] emergency seed failed:', seedError);
      }
    }

    return res.status(500).json({
      error: message,
      hint: 'Check Vercel function logs for portfolio API bootstrap errors.',
    });
  }
}
