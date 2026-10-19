import { getSql } from '../../lib/db.js';
import { sendJson, withHandler } from '../../lib/http.js';

export default withHandler(async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end();
    return;
  }
  const sql = getSql();
  const rows = await sql`
    WITH aktif AS (
      SELECT * FROM v_penghuni_aktif
    ),
    paid AS (
      SELECT DISTINCT pk.penghuni_kamar_id
      FROM t_transaksi t
      JOIN t_tipe_transaksi tt ON tt.tipe_transaksi_id = t.tipe_transaksi_id
      JOIN t_penghuni_kamar pk ON pk.penghuni_kamar_id = t.penghuni_kamar_id
      WHERE tt.code = 'SEWA_BULANAN'
        AND t.billing_year = EXTRACT(YEAR FROM CURRENT_DATE)::smallint
        AND t.billing_month = EXTRACT(MONTH FROM CURRENT_DATE)::smallint
    )
    SELECT
      a.full_name,
      a.room_no,
      a.property_name,
      (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date AS jatuh_tempo,
      a.agreed_rental AS amount,
      CASE WHEN paid.penghuni_kamar_id IS NULL THEN 'Belum Bayar' ELSE 'Lunas' END AS status
    FROM aktif a
    LEFT JOIN paid ON paid.penghuni_kamar_id = a.penghuni_kamar_id
    ORDER BY jatuh_tempo ASC, a.full_name ASC
    LIMIT 20
  `;
  sendJson(res, 200, { data: rows });
});
