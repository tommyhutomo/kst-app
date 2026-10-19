import { getSql } from '../../lib/db.js';
import { getQuery, sendJson, withHandler } from '../../lib/http.js';

export default withHandler(async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end();
    return;
  }
  const status = getQuery(req).booking_status || null;
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM v_booking
    WHERE (${status}::text IS NULL OR booking_status = ${status})
    ORDER BY booking_date DESC
  `;
  sendJson(res, 200, { data: rows });
});
