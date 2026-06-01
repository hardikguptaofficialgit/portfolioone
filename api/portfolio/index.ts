import { handlePortfolioIndex } from '../_lib/portfolio-handlers';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  try {
    return await handlePortfolioIndex(req, res);
  } catch (error) {
    console.error('[portfolio] unhandled handler error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Portfolio handler failed.',
    });
  }
}
