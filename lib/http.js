const PUBLIC_PATHS = new Set(['/api/health', '/api/auth/login']);

export function applyCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export function sendError(res, status, message, details) {
  sendJson(res, status, { error: message, ...(details ? { details } : {}) });
}

export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

export function getPath(req) {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  return url.pathname;
}

export function getQuery(req) {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  return Object.fromEntries(url.searchParams.entries());
}

export function requireAuth(req, res) {
  const path = getPath(req);
  if (PUBLIC_PATHS.has(path)) {
    return true;
  }
  if (/^\/api\/booking\/\d+\/receipt$/.test(path)) {
    return true;
  }
  const token = process.env.API_TOKEN;
  if (!token) {
    return true;
  }
  const auth = req.headers.authorization || '';
  if (auth === `Bearer ${token}`) {
    return true;
  }
  sendError(res, 401, 'Unauthorized');
  return false;
}

export function withHandler(handler) {
  return async (req, res) => {
    applyCors(req, res);
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }
    try {
      if (!requireAuth(req, res)) return;
      await handler(req, res);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Internal server error';
      const status = message.includes('not configured') ? 503 : 500;
      sendError(res, status, message);
    }
  };
}
