import { getSql } from '../lib/db.js';
import { getQuery, readJsonBody, sendError, sendJson, withHandler } from '../lib/http.js';
import { parseAmountInput } from '../lib/format.js';

export default withHandler(async (req, res) => {
  const sql = getSql();

  if (req.method === 'GET') {
    const q = getQuery(req);
    const status = q.booking_status || null;
    const search = q.search ? `%${q.search}%` : null;
    const dateFrom = q.booking_date_from || null;

    const rows = await sql`
      SELECT * FROM v_booking
      WHERE (${status}::text IS NULL OR booking_status = ${status})
        AND (${search}::text IS NULL OR customer_name ILIKE ${search})
        AND (${dateFrom}::date IS NULL OR booking_date >= ${dateFrom}::date)
      ORDER BY booking_date DESC, booking_id DESC
    `;
    sendJson(res, 200, { data: rows });
    return;
  }

  if (req.method === 'POST') {
    const body = await readJsonBody(req);
    const deposit = body.deposit_amount != null ? parseAmountInput(body.deposit_amount) : null;
    const rows = await sql`
      INSERT INTO t_booking (
        kamar_id, customer_name, phone_no, booking_date,
        expected_checkin, deposit_amount, booking_status
      ) VALUES (
        ${body.kamar_id},
        ${body.customer_name},
        ${body.phone_no},
        ${body.booking_date || new Date().toISOString().slice(0, 10)},
        ${body.expected_checkin || null},
        ${deposit},
        ${body.booking_status || 'Menunggu Konfirmasi'}
      )
      RETURNING *
    `;
    sendJson(res, 201, { data: rows[0] });
    return;
  }

  sendError(res, 405, 'Method not allowed');
});
