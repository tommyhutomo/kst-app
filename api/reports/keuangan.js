import { getSql } from '../../lib/db.js';
import { getQuery, sendJson, withHandler } from '../../lib/http.js';

export default withHandler(async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end();
    return;
  }
  const q = getQuery(req);
  const propertyId = q.property_id ? Number(q.property_id) : null;
  const year = q.billing_year ? Number(q.billing_year) : null;
  const month = q.billing_month ? Number(q.billing_month) : null;
  const category = q.category || null;
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM v_keuangan
    WHERE (${propertyId}::bigint IS NULL OR property_id = ${propertyId})
      AND (${year}::smallint IS NULL OR billing_year = ${year})
      AND (${month}::smallint IS NULL OR billing_month = ${month})
      AND (${category}::text IS NULL OR category = ${category})
    ORDER BY transaction_date DESC, transaksi_id DESC
  `;
  sendJson(res, 200, { data: rows });
});
