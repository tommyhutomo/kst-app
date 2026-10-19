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
    const rows = await sql`
      SELECT p.*, tp.property_type_name
      FROM t_property p
      JOIN t_tipe_property tp ON tp.tipe_property_id = p.tipe_property_id
      WHERE p.property_id = ${id}
    `;
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
      UPDATE t_property SET
        tipe_property_id = COALESCE(${body.tipe_property_id ?? null}, tipe_property_id),
        property_code = COALESCE(${body.property_code ?? null}, property_code),
        property_name = COALESCE(${body.property_name ?? null}, property_name),
        address1 = COALESCE(${body.address1 ?? null}, address1),
        address2 = COALESCE(${body.address2 ?? null}, address2),
        city = COALESCE(${body.city ?? null}, city),
        state = COALESCE(${body.state ?? null}, state),
        postcode = COALESCE(${body.postcode ?? null}, postcode)
      WHERE property_id = ${id}
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
    await sql`DELETE FROM t_property WHERE property_id = ${id}`;
    sendJson(res, 200, { ok: true });
    return;
  }

  sendError(res, 405, 'Method not allowed');
});
