-- Optional demo data for Kost Management System (run after 02_views.sql)

INSERT INTO t_tipe_property (property_type_code, property_type_name, description)
VALUES
  ('KOST_PUTRA', 'Kost Putra', 'Khusus penghuni pria'),
  ('KOST_PUTRI', 'Kost Putri', 'Khusus penghuni wanita'),
  ('KOST_CAMPUR', 'Kost Campur', 'Campuran')
ON CONFLICT (property_type_code) DO NOTHING;

INSERT INTO t_tipe_kamar (kamar_code, kamar_type_name, description)
VALUES
  ('STD', 'Standard', 'Kamar standard'),
  ('DLX', 'Deluxe', 'Kamar deluxe'),
  ('VIP', 'VIP', 'Kamar VIP')
ON CONFLICT (kamar_code) DO NOTHING;

INSERT INTO t_tipe_transaksi (code, nama, category, description)
VALUES
  ('SEWA_BULANAN', 'Sewa Bulanan', 'Pemasukan', 'Pembayaran sewa kamar bulanan'),
  ('DENDA', 'Denda Keterlambatan', 'Pemasukan', 'Denda keterlambatan bayar'),
  ('DEPOSIT', 'Deposit', 'Pemasukan', 'Deposit penghuni / booking'),
  ('LISTRIK_AIR', 'Listrik & Air', 'Pengeluaran', 'Biaya utilitas'),
  ('MAINTENANCE', 'Maintenance', 'Pengeluaran', 'Perawatan properti'),
  ('GAJI', 'Gaji Staff', 'Pengeluaran', 'Gaji petugas'),
  ('ATK', 'ATK & Lainnya', 'Pengeluaran', 'ATK dan biaya lain')
ON CONFLICT (code) DO NOTHING;

INSERT INTO t_property (tipe_property_id, property_code, property_name, address1, city, state, postcode)
SELECT tp.tipe_property_id, 'PR-001', 'Kost Melati', 'Jl. Melati No. 12', 'Jakarta', 'DKI Jakarta', '10110'
FROM t_tipe_property tp WHERE tp.property_type_code = 'KOST_PUTRI'
ON CONFLICT (property_code) DO NOTHING;

INSERT INTO t_property (tipe_property_id, property_code, property_name, address1, city, state, postcode)
SELECT tp.tipe_property_id, 'PR-002', 'Kost Mawar', 'Jl. Mawar No. 5', 'Bandung', 'Jawa Barat', '40111'
FROM t_tipe_property tp WHERE tp.property_type_code = 'KOST_PUTRA'
ON CONFLICT (property_code) DO NOTHING;

INSERT INTO t_property (tipe_property_id, property_code, property_name, address1, city, state, postcode)
SELECT tp.tipe_property_id, 'PR-003', 'Kost Anggrek', 'Jl. Anggrek No. 8', 'Surabaya', 'Jawa Timur', '60111'
FROM t_tipe_property tp WHERE tp.property_type_code = 'KOST_CAMPUR'
ON CONFLICT (property_code) DO NOTHING;

INSERT INTO t_kamar (property_id, room_no, floor_no, kamar_type_id, max_occupancy, monthly_rental, status)
SELECT p.property_id, 'A-101', 1, tk.kamar_type_id, 1, 1500000, 'Terisi'
FROM t_property p, t_tipe_kamar tk
WHERE p.property_code = 'PR-001' AND tk.kamar_code = 'STD'
ON CONFLICT (property_id, room_no) DO NOTHING;

INSERT INTO t_kamar (property_id, room_no, floor_no, kamar_type_id, max_occupancy, monthly_rental, status)
SELECT p.property_id, 'A-102', 1, tk.kamar_type_id, 1, 1850000, 'Kosong'
FROM t_property p, t_tipe_kamar tk
WHERE p.property_code = 'PR-001' AND tk.kamar_code = 'DLX'
ON CONFLICT (property_id, room_no) DO NOTHING;

INSERT INTO t_kamar (property_id, room_no, floor_no, kamar_type_id, max_occupancy, monthly_rental, status)
SELECT p.property_id, 'B-204', 2, tk.kamar_type_id, 2, 2500000, 'Terisi'
FROM t_property p, t_tipe_kamar tk
WHERE p.property_code = 'PR-002' AND tk.kamar_code = 'VIP'
ON CONFLICT (property_id, room_no) DO NOTHING;

INSERT INTO t_penghuni (full_name, no_ktp, phone_no, email, status)
VALUES
  ('Budi Santoso', '3174010101900001', '0812-1111-2222', 'budi@email.com', 'Aktif'),
  ('Siti Aminah', '3276010202900002', '0813-3333-4444', 'siti@email.com', 'Aktif'),
  ('Andi Wijaya', '3578010303900003', '0821-5555-6666', 'andi@email.com', 'Aktif')
ON CONFLICT DO NOTHING;

INSERT INTO t_penghuni_kamar (penghuni_id, kamar_id, checkin_date, agreed_rental, deposit_amount, status)
SELECT pen.penghuni_id, k.kamar_id, DATE '2026-01-15', 1500000, 500000, 'Aktif'
FROM t_penghuni pen, t_kamar k, t_property p
WHERE pen.full_name = 'Budi Santoso' AND k.room_no = 'A-101' AND p.property_id = k.property_id AND p.property_code = 'PR-001'
ON CONFLICT DO NOTHING;

INSERT INTO t_penghuni_kamar (penghuni_id, kamar_id, checkin_date, agreed_rental, deposit_amount, status)
SELECT pen.penghuni_id, k.kamar_id, DATE '2026-02-01', 2500000, 500000, 'Aktif'
FROM t_penghuni pen, t_kamar k, t_property p
WHERE pen.full_name = 'Siti Aminah' AND k.room_no = 'B-204' AND p.property_id = k.property_id AND p.property_code = 'PR-002'
ON CONFLICT DO NOTHING;

INSERT INTO t_transaksi (penghuni_kamar_id, tipe_transaksi_id, transaction_date, billing_month, billing_year, amount, remarks)
SELECT pk.penghuni_kamar_id, tt.tipe_transaksi_id, DATE '2026-10-01', 10, 2026, 1500000, 'Lunas'
FROM t_penghuni_kamar pk
JOIN t_penghuni pen ON pen.penghuni_id = pk.penghuni_id
JOIN t_tipe_transaksi tt ON tt.code = 'SEWA_BULANAN'
WHERE pen.full_name = 'Budi Santoso' AND pk.status = 'Aktif'
LIMIT 1;

INSERT INTO t_booking (kamar_id, customer_name, phone_no, booking_date, expected_checkin, deposit_amount, booking_status)
SELECT k.kamar_id, 'Rina Kartika', '0812-3456-7890', CURRENT_DATE, CURRENT_DATE + 14, 500000, 'Menunggu Konfirmasi'
FROM t_kamar k
JOIN t_property p ON p.property_id = k.property_id
WHERE k.room_no = 'A-102' AND p.property_code = 'PR-001';
