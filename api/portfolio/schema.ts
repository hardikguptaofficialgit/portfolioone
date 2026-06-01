export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  try {
    const { handlePortfolioSchema } = await import('../_lib/portfolio-handlers');
    return await handlePortfolioSchema(req, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
}
