import { getSql } from '../../lib/db.js';
import { getQuery, sendJson, withHandler } from '../../lib/http.js';

export default withHandler(async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end();
    return;
  }
  const q = getQuery(req);
  const year = q.billing_year ? Number(q.billing_year) : null;
  const month = q.billing_month ? Number(q.billing_month) : null;
  const penghuniId = q.penghuni_id ? Number(q.penghuni_id) : null;
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM v_tagihan_penghuni
    WHERE (${year}::smallint IS NULL OR billing_year = ${year})
      AND (${month}::smallint IS NULL OR billing_month = ${month})
      AND (${penghuniId}::bigint IS NULL OR penghuni_id = ${penghuniId})
    ORDER BY billing_year DESC, billing_month DESC, full_name
  `;
  sendJson(res, 200, { data: rows });
});
