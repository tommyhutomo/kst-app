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

  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM v_booking WHERE booking_id = ${id}`;
    if (!rows[0]) {
      sendError(res, 404, 'Not found');
      return;
    }
    sendJson(res, 200, { data: rows[0] });
    return;
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const body = await readJsonBody(req);
    const deposit = body.deposit_amount != null ? parseAmountInput(body.deposit_amount) : null;
    const rows = await sql`
      UPDATE t_booking SET
        kamar_id = COALESCE(${body.kamar_id ?? null}, kamar_id),
        customer_name = COALESCE(${body.customer_name ?? null}, customer_name),
        phone_no = COALESCE(${body.phone_no ?? null}, phone_no),
        booking_date = COALESCE(${body.booking_date ?? null}, booking_date),
        expected_checkin = COALESCE(${body.expected_checkin ?? null}, expected_checkin),
        deposit_amount = COALESCE(${deposit}, deposit_amount),
        booking_status = COALESCE(${body.booking_status ?? null}, booking_status)
      WHERE booking_id = ${id}
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
    await sql`DELETE FROM t_booking WHERE booking_id = ${id}`;
    sendJson(res, 200, { ok: true });
    return;
  }

  sendError(res, 405, 'Method not allowed');
});
