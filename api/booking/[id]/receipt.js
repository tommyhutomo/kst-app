import { getSql } from '../../../lib/db.js';
import { formatDateId, formatRupiah } from '../../../lib/format.js';
import { sendError, withHandler } from '../../../lib/http.js';

const COMPANY_NAME = process.env.RECEIPT_COMPANY_NAME || 'TOMITHA HOUSING';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default withHandler(async (req, res) => {
  if (req.method !== 'GET') {
    sendError(res, 405, 'Method not allowed');
    return;
  }
  const id = Number(req.query.id);
  if (!id) {
    sendError(res, 400, 'Invalid booking id');
    return;
  }

  const sql = getSql();
  const rows = await sql`
    SELECT
      b.booking_id,
      b.customer_name,
      b.phone_no,
      b.booking_date,
      b.expected_checkin,
      b.deposit_amount,
      k.room_no,
      pr.property_name,
      pr.property_code,
      tk.kamar_type_name AS room_type
    FROM t_booking b
    JOIN t_kamar k ON k.kamar_id = b.kamar_id
    JOIN t_property pr ON pr.property_id = k.property_id
    JOIN t_tipe_kamar tk ON tk.kamar_type_id = k.kamar_type_id
    WHERE b.booking_id = ${id}
  `;
  const b = rows[0];
  if (!b) {
    sendError(res, 404, 'Booking not found');
    return;
  }

  const receiptNo = `BR-${b.booking_id}`;
  const deposit = formatRupiah(b.deposit_amount);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(receiptNo)} — Booking Receipt</title>
<style>
  body{font-family:Segoe UI,Arial,sans-serif;color:#111;margin:32px;}
  h1{font-size:22px;margin:0 0 4px;}
  h2{font-size:16px;font-weight:600;margin:24px 0 8px;}
  table{border-collapse:collapse;width:100%;max-width:640px;margin-bottom:12px;}
  td,th{border:1px solid #cbd5e1;padding:8px 10px;text-align:left;font-size:14px;}
  th{background:#f1f5f9;width:38%;}
  .meta{margin-bottom:20px;font-size:14px;}
  .notes{font-size:12px;color:#475569;margin-top:24px;line-height:1.5;}
  @media print{body{margin:16px;}}
</style>
</head>
<body>
  <h1>${escapeHtml(COMPANY_NAME)}</h1>
  <div><strong>BOOKING RECEIPT</strong></div>
  <div class="meta">
    <div>Receipt Number: <strong>${escapeHtml(receiptNo)}</strong></div>
    <div>Booking Date: ${escapeHtml(formatDateId(b.booking_date))}</div>
  </div>

  <h2>Customer Information</h2>
  <table>
    <tr><th>Customer Name</th><td>${escapeHtml(b.customer_name)}</td></tr>
    <tr><th>Phone Number</th><td>${escapeHtml(b.phone_no)}</td></tr>
  </table>

  <h2>Property / Room Information</h2>
  <table>
    <tr><th>Property Name</th><td>${escapeHtml(b.property_name)}</td></tr>
    <tr><th>Property Code</th><td>${escapeHtml(b.property_code)}</td></tr>
    <tr><th>Room No</th><td>${escapeHtml(b.room_no)}</td></tr>
    <tr><th>Room Type</th><td>${escapeHtml(b.room_type)}</td></tr>
    <tr><th>Expected Check-In</th><td>${escapeHtml(formatDateId(b.expected_checkin))}</td></tr>
  </table>

  <h2>Payment Information</h2>
  <table>
    <tr><th>Description</th><th>Amount (RP)</th></tr>
    <tr><td>Booking Deposit</td><td>${escapeHtml(deposit.replace(/^Rp\s?/, ''))}</td></tr>
    <tr><th>Total Paid</th><th>RP ${escapeHtml(deposit.replace(/^Rp\s?/, ''))}</th></tr>
  </table>

  <div class="notes">
    <p>This receipt confirms the room booking reservation.</p>
    <p>The deposit paid will be treated according to the tenancy agreement upon check-in.</p>
    <p>Please keep this receipt for future reference.</p>
  </div>
</body>
</html>`;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html);
});
