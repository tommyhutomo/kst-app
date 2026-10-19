import { getSql } from '../lib/db.js';
import { getQuery, readJsonBody, sendError, sendJson, withHandler } from '../lib/http.js';

export default withHandler(async (req, res) => {
  const sql = getSql();

  if (req.method === 'GET') {
    const q = getQuery(req);
    const search = q.search ? `%${q.search}%` : null;
    const city = q.city || null;
    const tipeId = q.tipe_property_id ? Number(q.tipe_property_id) : null;

    const rows = await sql`
      SELECT
        p.*,
        tp.property_type_name,
        tp.property_type_code,
        (SELECT COUNT(*)::int FROM t_kamar k WHERE k.property_id = p.property_id) AS total_kamar
      FROM t_property p
      JOIN t_tipe_property tp ON tp.tipe_property_id = p.tipe_property_id
      WHERE (${search}::text IS NULL OR p.property_name ILIKE ${search})
        AND (${city}::text IS NULL OR p.city = ${city})
        AND (${tipeId}::bigint IS NULL OR p.tipe_property_id = ${tipeId})
      ORDER BY p.property_name ASC
    `;
    sendJson(res, 200, { data: rows });
    return;
  }

  if (req.method === 'POST') {
    const body = await readJsonBody(req);
    const code = body.property_code || `PR-${Date.now().toString().slice(-6)}`;
    const rows = await sql`
      INSERT INTO t_property (
        tipe_property_id, property_code, property_name,
        address1, address2, city, state, postcode
      ) VALUES (
        ${body.tipe_property_id},
        ${code},
        ${body.property_name},
        ${body.address1},
        ${body.address2 || null},
        ${body.city || null},
        ${body.state || null},
        ${body.postcode || null}
      )
      RETURNING *
    `;
    sendJson(res, 201, { data: rows[0] });
    return;
  }

  sendError(res, 405, 'Method not allowed');
});
