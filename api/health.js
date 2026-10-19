import { sendJson, withHandler } from '../lib/http.js';

export default withHandler(async (_req, res) => {
  sendJson(res, 200, {
    ok: true,
    service: 'kost-manager',
    database: Boolean(process.env.DATABASE_URL),
  });
});
