import { getSql } from '../../lib/db.js';
import { readJsonBody, sendError, sendJson, withHandler } from '../../lib/http.js';

export default withHandler(async (req, res) => {
  const id = Number(req.query.id);
  if (!id) {
    sendError(res, 400, 'Invalid id');
    return;
  }
  const sql = getSql();

  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM t_tipe_property WHERE tipe_property_id = ${id}`;
    if (!rows[0]) {
      sendError(res, 404, 'Not found');
      return;
    }
    sendJson(res, 200, { data: rows[0] });
    return;
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const body = await readJsonBody(req);
    const rows = await sql`
      UPDATE t_tipe_property SET
        property_type_code = COALESCE(${body.property_type_code ?? null}, property_type_code),
        property_type_name = COALESCE(${body.property_type_name ?? null}, property_type_name),
        description = COALESCE(${body.description ?? null}, description),
        active_flag = COALESCE(${body.active_flag ?? null}, active_flag)
      WHERE tipe_property_id = ${id}
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
    await sql`DELETE FROM t_tipe_property WHERE tipe_property_id = ${id}`;
    sendJson(res, 200, { ok: true });
    return;
  }

  sendError(res, 405, 'Method not allowed');
});
