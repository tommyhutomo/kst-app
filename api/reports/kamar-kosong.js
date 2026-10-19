import { getSql } from '../../lib/db.js';
import { getQuery, sendJson, withHandler } from '../../lib/http.js';

export default withHandler(async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end();
    return;
  }
  const propertyId = getQuery(req).property_id ? Number(getQuery(req).property_id) : null;
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM v_kamar_kosong
    WHERE (${propertyId}::bigint IS NULL OR property_id = ${propertyId})
    ORDER BY property_name, room_no
  `;
  sendJson(res, 200, { data: rows });
});
