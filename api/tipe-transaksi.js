import { getSql } from '../lib/db.js';
import { readJsonBody, sendError, sendJson, withHandler } from '../lib/http.js';

export default withHandler(async (req, res) => {
  const sql = getSql();
  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM t_tipe_transaksi ORDER BY category, nama`;
    sendJson(res, 200, { data: rows });
    return;
  }
  if (req.method === 'POST') {
    const body = await readJsonBody(req);
    const rows = await sql`
      INSERT INTO t_tipe_transaksi (code, nama, category, description, active_flag)
      VALUES (
        ${body.code},
        ${body.nama},
        ${body.category},
        ${body.description || null},
        ${body.active_flag || 'Y'}
      )
      RETURNING *
    `;
    sendJson(res, 201, { data: rows[0] });
    return;
  }
  sendError(res, 405, 'Method not allowed');
});
