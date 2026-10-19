import { getSql } from '../lib/db.js';
import { getQuery, readJsonBody, sendError, sendJson, withHandler } from '../lib/http.js';
import { parseAmountInput } from '../lib/format.js';

export default withHandler(async (req, res) => {
  const sql = getSql();

  if (req.method === 'GET') {
    const q = getQuery(req);
    const propertyId = q.property_id ? Number(q.property_id) : null;
    const year = q.billing_year ? Number(q.billing_year) : null;
    const month = q.billing_month ? Number(q.billing_month) : null;

    const rows = await sql`
      SELECT v.*,
        CASE
          WHEN v.category = 'Pemasukan' AND v.transaction_date IS NOT NULL THEN 'Lunas'
          WHEN v.category = 'Pemasukan' AND v.transaction_date IS NULL THEN 'Belum Bayar'
          ELSE COALESCE(v.remarks, '-')
        END AS payment_status
      FROM v_tagihan_penghuni v
      WHERE (${propertyId}::bigint IS NULL OR v.property_id = ${propertyId})
        AND (${year}::smallint IS NULL OR v.billing_year = ${year})
        AND (${month}::smallint IS NULL OR v.billing_month = ${month})
      ORDER BY v.billing_year DESC, v.billing_month DESC, v.full_name
    `;
    sendJson(res, 200, { data: rows });
    return;
  }

  if (req.method === 'POST') {
    const body = await readJsonBody(req);
    const amount = parseAmountInput(body.amount);
    if (amount == null) {
      sendError(res, 400, 'Invalid amount');
      return;
    }
    let billingMonth = body.billing_month;
    let billingYear = body.billing_year;
    if (body.billing_period) {
      const [y, m] = String(body.billing_period).split('-');
      billingYear = Number(y);
      billingMonth = Number(m);
    }
    const rows = await sql`
      INSERT INTO t_transaksi (
        penghuni_kamar_id, tipe_transaksi_id, transaction_date,
        billing_month, billing_year, amount, remarks
      ) VALUES (
        ${body.penghuni_kamar_id},
        ${body.tipe_transaksi_id},
        ${body.transaction_date || new Date().toISOString().slice(0, 10)},
        ${billingMonth},
        ${billingYear},
        ${amount},
        ${body.remarks || null}
      )
      RETURNING *
    `;
    sendJson(res, 201, { data: rows[0] });
    return;
  }

  sendError(res, 405, 'Method not allowed');
});
