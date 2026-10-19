import { readJsonBody, sendError, sendJson, withHandler } from '../../lib/http.js';

export default withHandler(async (req, res) => {
  if (req.method !== 'POST') {
    sendError(res, 405, 'Method not allowed');
    return;
  }
  const body = await readJsonBody(req);
  const email = String(body.email || body.username || '').trim().toLowerCase();
  const password = String(body.password || '');

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@kost.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme';

  if (email !== adminEmail || password !== adminPassword) {
    sendError(res, 401, 'Invalid email or password');
    return;
  }

  const token = process.env.API_TOKEN || 'dev-session-token';
  sendJson(res, 200, {
    token,
    user: {
      email: adminEmail,
      displayName: process.env.ADMIN_DISPLAY_NAME || 'Admin',
    },
  });
});
