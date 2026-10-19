import { getSql } from '../../lib/db.js';
import { readJsonBody, sendError, sendJson, withHandler } from '../../lib/http.js';

export default withHandler(async (req, res) => {
  const id = Number(req.query.id);
  if (!id) {
    sendError(res, 400, 'Invalid id');
    return;
  }
  const sql = getSql();

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const body = await readJsonBody(req);
    const rows = await sql`
      UPDATE t_tipe_kamar SET
        kamar_code = COALESCE(${body.kamar_code ?? null}, kamar_code),
        kamar_type_name = COALESCE(${body.kamar_type_name ?? null}, kamar_type_name),
        description = COALESCE(${body.description ?? null}, description),
        active_flag = COALESCE(${body.active_flag ?? null}, active_flag)
      WHERE kamar_type_id = ${id}
      RETURNING *
    `;
    if (!rows[0]) {
      sendError(res, 404, 'Not found');
      return;
    }
    sendJson(res, 200, { data: rows[0] });
    return;
  }

  if (req.method === 'DELETE') {
    await sql`DELETE FROM t_tipe_kamar WHERE kamar_type_id = ${id}`;
    sendJson(res, 200, { ok: true });
    return;
  }

  sendError(res, 405, 'Method not allowed');
});
