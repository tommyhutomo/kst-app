import { getSql } from '../lib/db.js';
import { readJsonBody, sendError, sendJson, withHandler } from '../lib/http.js';

export default withHandler(async (req, res) => {
  const sql = getSql();
  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM t_tipe_kamar ORDER BY kamar_type_name ASC`;
    sendJson(res, 200, { data: rows });
    return;
  }
  if (req.method === 'POST') {
    const body = await readJsonBody(req);
    const rows = await sql`
      INSERT INTO t_tipe_kamar (kamar_code, kamar_type_name, description, active_flag)
      VALUES (
        ${body.kamar_code},
        ${body.kamar_type_name},
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
