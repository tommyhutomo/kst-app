import { getSql } from '../../lib/db.js';
import { getQuery, sendJson, withHandler } from '../../lib/http.js';

export default withHandler(async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end();
    return;
  }
  const months = Math.min(Number(getQuery(req).months || 6), 12);
  const sql = getSql();
  const rows = await sql`
    WITH periods AS (
      SELECT
        (date_trunc('month', CURRENT_DATE) - (n || ' months')::interval)::date AS period_start
      FROM generate_series(0, ${months - 1}) AS n
    )
    SELECT
      EXTRACT(YEAR FROM p.period_start)::int AS billing_year,
      EXTRACT(MONTH FROM p.period_start)::int AS billing_month,
      COALESCE(SUM(CASE WHEN tt.category = 'Pemasukan' THEN t.amount ELSE 0 END), 0) AS pemasukan,
      COALESCE(SUM(CASE WHEN tt.category = 'Pengeluaran' THEN t.amount ELSE 0 END), 0) AS pengeluaran
    FROM periods p
    LEFT JOIN t_transaksi t
      ON t.billing_year = EXTRACT(YEAR FROM p.period_start)::smallint
     AND t.billing_month = EXTRACT(MONTH FROM p.period_start)::smallint
    LEFT JOIN t_tipe_transaksi tt ON tt.tipe_transaksi_id = t.tipe_transaksi_id
    GROUP BY p.period_start
    ORDER BY p.period_start ASC
  `;
  sendJson(res, 200, { data: rows });
});
