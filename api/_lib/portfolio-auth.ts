declare const process: {
  env: Record<string, string | undefined>;
};

export const getPortfolioApiKey = () =>
  process.env.PORTFOLIO_API_KEY || process.env.MCP_PORTFOLIO_API_KEY || '';

export const assertPortfolioAuth = (req: { headers?: Record<string, string | string[] | undefined> }) => {
  const expected = getPortfolioApiKey();
  if (!expected) {
    throw new Error(
      'Portfolio write API is disabled. Set PORTFOLIO_API_KEY in your environment to enable mutations.'
    );
  }

  const header = req.headers?.authorization || req.headers?.Authorization;
  const value = Array.isArray(header) ? header[0] : header;
  const token = typeof value === 'string' && value.startsWith('Bearer ') ? value.slice(7).trim() : '';

  if (!token || token !== expected) {
    const err = new Error('Unauthorized');
    (err as Error & { statusCode?: number }).statusCode = 401;
    throw err;
  }
};

export const isWriteEnabled = () => Boolean(getPortfolioApiKey());
