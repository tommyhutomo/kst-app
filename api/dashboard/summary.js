import { getSql } from '../../lib/db.js';
import { getQuery, sendJson, withHandler } from '../../lib/http.js';

export default withHandler(async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end();
    return;
  }
  const sql = getSql();
  const q = getQuery(req);
  const year = q.year ? Number(q.year) : null;
  const month = q.month ? Number(q.month) : null;

  const rows = await sql`SELECT * FROM v_dashboard_summary LIMIT 1`;
  let summary = rows[0] || {};

  if (year && month) {
    const custom = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN tt.category = 'Pemasukan' THEN t.amount ELSE 0 END), 0) AS total_pemasukan_bulan_ini,
        COALESCE(SUM(CASE WHEN tt.category = 'Pengeluaran' THEN t.amount ELSE 0 END), 0) AS total_pengeluaran_bulan_ini
      FROM t_transaksi t
      JOIN t_tipe_transaksi tt ON tt.tipe_transaksi_id = t.tipe_transaksi_id
      WHERE t.billing_year = ${year} AND t.billing_month = ${month}
    `;
    summary = { ...summary, ...custom[0] };
  }

  sendJson(res, 200, { data: summary });
});
