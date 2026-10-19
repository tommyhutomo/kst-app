-- ============================================================
-- Kost Management System - View DDL
-- Target: Neon PostgreSQL
-- Maps to the Report / Dashboard requirement sheet:
--   Penghuni Aktif            -> v_penghuni_aktif
--   Kamar Kosong               -> v_kamar_kosong
--   Tagihan Penghuni           -> v_tagihan_penghuni
--   Keuangan (Pemasukan & Pengeluaran) -> v_keuangan
--   Booking                    -> v_booking
--   Dashboard Summary          -> v_dashboard_summary
--   Pie Chart Pengeluaran      -> v_pengeluaran_by_tipe
-- Run after 01_tables.sql
-- ============================================================

-- ------------------------------------------------------------
-- v_penghuni_aktif
-- Tables: t_penghuni, t_penghuni_kamar, t_kamar, t_property
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_penghuni_aktif AS
SELECT
    p.penghuni_id,
    p.full_name,
    p.no_ktp,
    p.phone_no,
    p.email,
    p.emergency_contact,
    pk.penghuni_kamar_id,
    pk.checkin_date,
    pk.agreed_rental,
    pk.deposit_amount,
    pk.status            AS status_penghunian,
    k.kamar_id,
    k.room_no,
    k.floor_no,
    k.monthly_rental,
    pr.property_id,
    pr.property_name,
    pr.city,
    pr.state
FROM t_penghuni p
JOIN t_penghuni_kamar pk ON pk.penghuni_id = p.penghuni_id
JOIN t_kamar k            ON k.kamar_id = pk.kamar_id
JOIN t_property pr        ON pr.property_id = k.property_id
WHERE pk.status = 'Aktif'
  AND pk.checkout_date IS NULL;

-- ------------------------------------------------------------
-- v_kamar_kosong
-- Tables: t_kamar, t_property, t_penghuni_kamar
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_kamar_kosong AS
SELECT
    k.kamar_id,
    k.room_no,
    k.floor_no,
    k.monthly_rental,
    k.status,
    tk.kamar_type_id,
    tk.kamar_type_name,
    pr.property_id,
    pr.property_name,
    pr.city
FROM t_kamar k
JOIN t_property pr   ON pr.property_id = k.property_id
JOIN t_tipe_kamar tk ON tk.kamar_type_id = k.kamar_type_id
WHERE NOT EXISTS (
    SELECT 1
    FROM t_penghuni_kamar pk
    WHERE pk.kamar_id = k.kamar_id
      AND pk.status = 'Aktif'
      AND pk.checkout_date IS NULL
);

-- ------------------------------------------------------------
-- v_tagihan_penghuni
-- Tables: t_transaksi, t_penghuni_kamar, t_penghuni, t_kamar, t_tipe_transaksi
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_tagihan_penghuni AS
SELECT
    t.transaksi_id,
    p.penghuni_id,
    p.full_name,
    k.kamar_id,
    k.room_no,
    pr.property_id,
    pr.property_name,
    tt.tipe_transaksi_id,
    tt.nama              AS tipe_transaksi_nama,
    tt.category,
    t.billing_month,
    t.billing_year,
    t.transaction_date,
    t.amount,
    t.remarks
FROM t_transaksi t
JOIN t_penghuni_kamar pk  ON pk.penghuni_kamar_id = t.penghuni_kamar_id
JOIN t_penghuni p         ON p.penghuni_id = pk.penghuni_id
JOIN t_kamar k            ON k.kamar_id = pk.kamar_id
JOIN t_property pr        ON pr.property_id = k.property_id
JOIN t_tipe_transaksi tt  ON tt.tipe_transaksi_id = t.tipe_transaksi_id;

-- ------------------------------------------------------------
-- v_keuangan (Pemasukan & Pengeluaran)
-- Tables: t_transaksi, t_tipe_transaksi, t_penghuni_kamar, t_property
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_keuangan AS
SELECT
    t.transaksi_id,
    t.transaction_date,
    t.billing_month,
    t.billing_year,
    pr.property_id,
    pr.property_name,
    tt.tipe_transaksi_id,
    tt.nama               AS tipe_transaksi_nama,
    tt.category,
    t.amount,
    t.remarks
FROM t_transaksi t
JOIN t_tipe_transaksi tt ON tt.tipe_transaksi_id = t.tipe_transaksi_id
JOIN t_penghuni_kamar pk ON pk.penghuni_kamar_id = t.penghuni_kamar_id
JOIN t_kamar k            ON k.kamar_id = pk.kamar_id
JOIN t_property pr        ON pr.property_id = k.property_id;

-- ------------------------------------------------------------
-- v_booking
-- Tables: t_booking, t_kamar, t_property
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_booking AS
SELECT
    b.booking_id,
    b.customer_name,
    b.phone_no,
    b.booking_date,
    b.expected_checkin,
    b.deposit_amount,
    b.booking_status,
    k.kamar_id,
    k.room_no,
    pr.property_id,
    pr.property_name
FROM t_booking b
JOIN t_kamar k      ON k.kamar_id = b.kamar_id
JOIN t_property pr  ON pr.property_id = k.property_id;

-- ------------------------------------------------------------
-- v_pengeluaran_by_tipe (Pie Chart Pengeluaran)
-- Tables: t_transaksi, t_tipe_transaksi
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_pengeluaran_by_tipe AS
SELECT
    tt.tipe_transaksi_id,
    tt.nama        AS tipe_transaksi_nama,
    t.billing_year,
    t.billing_month,
    SUM(t.amount) AS total_amount
FROM t_transaksi t
JOIN t_tipe_transaksi tt ON tt.tipe_transaksi_id = t.tipe_transaksi_id
WHERE tt.category = 'Pengeluaran'
GROUP BY tt.tipe_transaksi_id, tt.nama, t.billing_year, t.billing_month;

-- ------------------------------------------------------------
-- v_dashboard_summary (Multiple aggregated views)
-- Single-row dashboard KPI summary based on current month
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT
    (SELECT COUNT(*) FROM v_penghuni_aktif)              AS total_penghuni_aktif,
    (SELECT COUNT(*) FROM v_kamar_kosong)                AS total_kamar_kosong,
    (SELECT COUNT(*) FROM t_kamar)                       AS total_kamar,
    (
        SELECT COALESCE(SUM(t.amount), 0)
        FROM t_transaksi t
        JOIN t_tipe_transaksi tt ON tt.tipe_transaksi_id = t.tipe_transaksi_id
        WHERE tt.category = 'Pemasukan'
          AND t.billing_year  = EXTRACT(YEAR  FROM CURRENT_DATE)::SMALLINT
          AND t.billing_month = EXTRACT(MONTH FROM CURRENT_DATE)::SMALLINT
    ) AS total_pemasukan_bulan_ini,
    (
        SELECT COALESCE(SUM(t.amount), 0)
        FROM t_transaksi t
        JOIN t_tipe_transaksi tt ON tt.tipe_transaksi_id = t.tipe_transaksi_id
        WHERE tt.category = 'Pengeluaran'
          AND t.billing_year  = EXTRACT(YEAR  FROM CURRENT_DATE)::SMALLINT
          AND t.billing_month = EXTRACT(MONTH FROM CURRENT_DATE)::SMALLINT
    ) AS total_pengeluaran_bulan_ini,
    (
        SELECT COUNT(*) FROM t_booking
        WHERE booking_status = 'Menunggu Konfirmasi'
    ) AS total_booking_menunggu,
    (
        SELECT COUNT(*) FROM t_booking
        WHERE booking_date >= date_trunc('month', CURRENT_DATE)
    ) AS total_booking_bulan_ini;
