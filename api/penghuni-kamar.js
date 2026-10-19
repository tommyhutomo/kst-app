import { getSql } from '../lib/db.js';
import { getQuery, sendJson, withHandler } from '../lib/http.js';

/** Active occupancies for pembayaran dropdown */
export default withHandler(async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end();
    return;
  }
  const q = getQuery(req);
  const propertyId = q.property_id ? Number(q.property_id) : null;
  const sql = getSql();
  const rows = await sql`
    SELECT
      pk.penghuni_kamar_id,
      pk.agreed_rental,
      p.penghuni_id,
      p.full_name,
      k.kamar_id,
      k.room_no,
      pr.property_id,
      pr.property_name
    FROM t_penghuni_kamar pk
    JOIN t_penghuni p ON p.penghuni_id = pk.penghuni_id
    JOIN t_kamar k ON k.kamar_id = pk.kamar_id
    JOIN t_property pr ON pr.property_id = k.property_id
    WHERE pk.status = 'Aktif' AND pk.checkout_date IS NULL
      AND (${propertyId}::bigint IS NULL OR pr.property_id = ${propertyId})
    ORDER BY p.full_name, k.room_no
  `;
  sendJson(res, 200, { data: rows });
});
