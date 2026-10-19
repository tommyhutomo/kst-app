import { getSql } from '../../lib/db.js';
import { readJsonBody, sendError, sendJson, withHandler } from '../../lib/http.js';
import { parseAmountInput } from '../../lib/format.js';

export default withHandler(async (req, res) => {
  const id = Number(req.query.id);
  if (!id) {
    sendError(res, 400, 'Invalid id');
    return;
  }
  const sql = getSql();

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const body = await readJsonBody(req);
    const rent = body.monthly_rental != null ? parseAmountInput(body.monthly_rental) : null;
    const rows = await sql`
      UPDATE t_kamar SET
        property_id = COALESCE(${body.property_id ?? null}, property_id),
        room_no = COALESCE(${body.room_no ?? null}, room_no),
        floor_no = COALESCE(${body.floor_no ?? null}, floor_no),
        kamar_type_id = COALESCE(${body.kamar_type_id ?? null}, kamar_type_id),
        max_occupancy = COALESCE(${body.max_occupancy ?? null}, max_occupancy),
        monthly_rental = COALESCE(${rent}, monthly_rental),
        status = COALESCE(${body.status ?? null}, status)
      WHERE kamar_id = ${id}
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
    await sql`DELETE FROM t_kamar WHERE kamar_id = ${id}`;
    sendJson(res, 200, { ok: true });
    return;
  }

  sendError(res, 405, 'Method not allowed');
});
