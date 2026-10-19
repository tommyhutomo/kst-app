import { getSql } from '../lib/db.js';
import { getQuery, readJsonBody, sendError, sendJson, withHandler } from '../lib/http.js';
import { parseAmountInput } from '../lib/format.js';

export default withHandler(async (req, res) => {
  const sql = getSql();

  if (req.method === 'GET') {
    const q = getQuery(req);
    const propertyId = q.property_id ? Number(q.property_id) : null;
    const floor = q.floor_no ? Number(q.floor_no) : null;
    const typeId = q.kamar_type_id ? Number(q.kamar_type_id) : null;
    const status = q.status || null;
    const vacantOnly = q.vacant === '1' || q.vacant === 'true';

    if (vacantOnly) {
      const rows = await sql`SELECT * FROM v_kamar_kosong ORDER BY property_name, room_no`;
      sendJson(res, 200, { data: rows });
      return;
    }

    const rows = await sql`
      SELECT
        k.*,
        p.property_name,
        p.property_code,
        tk.kamar_type_name
      FROM t_kamar k
      JOIN t_property p ON p.property_id = k.property_id
      JOIN t_tipe_kamar tk ON tk.kamar_type_id = k.kamar_type_id
      WHERE (${propertyId}::bigint IS NULL OR k.property_id = ${propertyId})
        AND (${floor}::int IS NULL OR k.floor_no = ${floor})
        AND (${typeId}::bigint IS NULL OR k.kamar_type_id = ${typeId})
        AND (${status}::text IS NULL OR k.status = ${status})
      ORDER BY p.property_name, k.room_no
    `;
    sendJson(res, 200, { data: rows });
    return;
  }

  if (req.method === 'POST') {
    const body = await readJsonBody(req);
    const rent = parseAmountInput(body.monthly_rental);
    const rows = await sql`
      INSERT INTO t_kamar (
        property_id, room_no, floor_no, kamar_type_id,
        max_occupancy, monthly_rental, status
      ) VALUES (
        ${body.property_id},
        ${body.room_no},
        ${body.floor_no ?? null},
        ${body.kamar_type_id},
        ${body.max_occupancy ?? 1},
        ${rent},
        ${body.status || 'Kosong'}
      )
      RETURNING *
    `;
    sendJson(res, 201, { data: rows[0] });
    return;
  }

  sendError(res, 405, 'Method not allowed');
});
