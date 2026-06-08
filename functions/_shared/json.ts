export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...init.headers,
    },
  });

export const parseJsonBody = async <T = Record<string, unknown>>(request: Request): Promise<T> => {
  const text = await request.text();
  if (!text.trim()) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
};

export const unauthorized = () => json({ error: 'Unauthorized.' }, { status: 401 });

export const methodNotAllowed = () => json({ error: 'Method not allowed.' }, { status: 405 });
