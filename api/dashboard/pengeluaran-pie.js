import { getSql } from '../../lib/db.js';
import { getQuery, sendJson, withHandler } from '../../lib/http.js';

export default withHandler(async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end();
    return;
  }
  const q = getQuery(req);
  const year = q.year ? Number(q.year) : new Date().getFullYear();
  const month = q.month ? Number(q.month) : new Date().getMonth() + 1;
  const sql = getSql();
  const rows = await sql`
    SELECT tipe_transaksi_id, tipe_transaksi_nama, total_amount
    FROM v_pengeluaran_by_tipe
    WHERE billing_year = ${year} AND billing_month = ${month}
    ORDER BY total_amount DESC
  `;
  sendJson(res, 200, { data: rows, billing_year: year, billing_month: month });
});
