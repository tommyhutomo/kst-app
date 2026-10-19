-- ============================================================
-- Kost Management System - Table DDL
-- Target: Neon PostgreSQL (serverless Postgres, Vercel)
-- Generated from ERD (t_property, t_kamar, t_penghuni, t_transaksi,
-- t_booking and their master/reference tables)
-- ============================================================

-- Creation order respects foreign key dependencies:
--   1. Master/reference tables (t_tipe_property, t_tipe_kamar, t_tipe_transaksi)
--   2. t_property
--   3. t_kamar
--   4. t_penghuni
--   5. t_penghuni_kamar
--   6. t_transaksi
--   7. t_booking

-- ------------------------------------------------------------
-- 1. t_tipe_property
-- ------------------------------------------------------------
CREATE TABLE t_tipe_property (
    tipe_property_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    property_type_code  VARCHAR(30)  NOT NULL,
    property_type_name  VARCHAR(100),
    description         VARCHAR(255),
    active_flag         CHAR(1)      NOT NULL DEFAULT 'Y' CHECK (active_flag IN ('Y','N')),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_tipe_property_code UNIQUE (property_type_code)
);

-- ------------------------------------------------------------
-- 2. t_tipe_kamar
-- ------------------------------------------------------------
CREATE TABLE t_tipe_kamar (
    kamar_type_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kamar_code       VARCHAR(50)  NOT NULL,
    kamar_type_name  VARCHAR(100) NOT NULL,
    description      VARCHAR(255),
    active_flag      CHAR(1)      NOT NULL DEFAULT 'Y' CHECK (active_flag IN ('Y','N')),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_tipe_kamar_code UNIQUE (kamar_code)
);

-- ------------------------------------------------------------
-- 3. t_tipe_transaksi
-- ------------------------------------------------------------
CREATE TABLE t_tipe_transaksi (
    tipe_transaksi_id  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code               VARCHAR(30)  NOT NULL,
    nama               VARCHAR(100) NOT NULL,
    category           VARCHAR(20)  NOT NULL CHECK (category IN ('Pemasukan','Pengeluaran')),
    description        VARCHAR(255),
    active_flag        CHAR(1)      NOT NULL DEFAULT 'Y' CHECK (active_flag IN ('Y','N')),
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_tipe_transaksi_code UNIQUE (code)
);

-- ------------------------------------------------------------
-- 4. t_property
-- ------------------------------------------------------------
CREATE TABLE t_property (
    property_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipe_property_id   BIGINT       NOT NULL,
    property_code      VARCHAR(30)  NOT NULL,
    property_name      VARCHAR(200) NOT NULL,
    address1           VARCHAR(200) NOT NULL,
    address2           VARCHAR(200),
    city               VARCHAR(100),
    state              VARCHAR(100),
    postcode           VARCHAR(20),
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_property_code UNIQUE (property_code),
    CONSTRAINT fk_property_tipe_property
        FOREIGN KEY (tipe_property_id) REFERENCES t_tipe_property (tipe_property_id)
);

CREATE INDEX idx_property_tipe_property_id ON t_property (tipe_property_id);
CREATE INDEX idx_property_city ON t_property (city);

-- ------------------------------------------------------------
-- 5. t_kamar
-- ------------------------------------------------------------
CREATE TABLE t_kamar (
    kamar_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    property_id     BIGINT        NOT NULL,
    room_no         VARCHAR(20)   NOT NULL,
    floor_no        INT,
    kamar_type_id   BIGINT        NOT NULL,
    max_occupancy   INT           NOT NULL DEFAULT 1,
    monthly_rental  DECIMAL(12,2) NOT NULL,
    status          VARCHAR(20)   NOT NULL DEFAULT 'Kosong'
                    CHECK (status IN ('Kosong','Terisi','Maintenance')),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_kamar_property_room UNIQUE (property_id, room_no),
    CONSTRAINT fk_kamar_property
        FOREIGN KEY (property_id) REFERENCES t_property (property_id),
    CONSTRAINT fk_kamar_tipe_kamar
        FOREIGN KEY (kamar_type_id) REFERENCES t_tipe_kamar (kamar_type_id)
);

CREATE INDEX idx_kamar_property_id ON t_kamar (property_id);
CREATE INDEX idx_kamar_kamar_type_id ON t_kamar (kamar_type_id);
CREATE INDEX idx_kamar_status ON t_kamar (status);

-- ------------------------------------------------------------
-- 6. t_penghuni
-- ------------------------------------------------------------
CREATE TABLE t_penghuni (
    penghuni_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name          VARCHAR(200) NOT NULL,
    no_ktp             VARCHAR(50),
    phone_no           VARCHAR(30),
    email              VARCHAR(200),
    emergency_contact  VARCHAR(200),
    status             VARCHAR(20)  DEFAULT 'Aktif'
                       CHECK (status IN ('Aktif','Non-Aktif')),
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_penghuni_status ON t_penghuni (status);
CREATE INDEX idx_penghuni_no_ktp ON t_penghuni (no_ktp);

-- ------------------------------------------------------------
-- 7. t_penghuni_kamar
-- ------------------------------------------------------------
CREATE TABLE t_penghuni_kamar (
    penghuni_kamar_id  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    penghuni_id        BIGINT        NOT NULL,
    kamar_id           BIGINT        NOT NULL,
    checkin_date       DATE          NOT NULL,
    checkout_date      DATE,
    agreed_rental      DECIMAL(12,2) NOT NULL,
    deposit_amount     DECIMAL(12,2),
    status             VARCHAR(20)   NOT NULL DEFAULT 'Aktif'
                       CHECK (status IN ('Aktif','Checkout')),
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT fk_penghuni_kamar_penghuni
        FOREIGN KEY (penghuni_id) REFERENCES t_penghuni (penghuni_id),
    CONSTRAINT fk_penghuni_kamar_kamar
        FOREIGN KEY (kamar_id) REFERENCES t_kamar (kamar_id),
    CONSTRAINT chk_penghuni_kamar_dates
        CHECK (checkout_date IS NULL OR checkout_date >= checkin_date)
);

CREATE INDEX idx_penghuni_kamar_penghuni_id ON t_penghuni_kamar (penghuni_id);
CREATE INDEX idx_penghuni_kamar_kamar_id ON t_penghuni_kamar (kamar_id);
CREATE INDEX idx_penghuni_kamar_status ON t_penghuni_kamar (status);

-- Ensure a room only has one active occupancy at a time
CREATE UNIQUE INDEX uq_penghuni_kamar_active_room
    ON t_penghuni_kamar (kamar_id)
    WHERE status = 'Aktif' AND checkout_date IS NULL;

-- ------------------------------------------------------------
-- 8. t_transaksi
-- ------------------------------------------------------------
CREATE TABLE t_transaksi (
    transaksi_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    penghuni_kamar_id    BIGINT        NOT NULL,
    tipe_transaksi_id    BIGINT        NOT NULL,
    transaction_date     DATE          NOT NULL,
    billing_month        SMALLINT      NOT NULL CHECK (billing_month BETWEEN 1 AND 12),
    billing_year         SMALLINT      NOT NULL CHECK (billing_year BETWEEN 2000 AND 2100),
    amount               DECIMAL(12,2) NOT NULL,
    remarks              VARCHAR(500),
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT fk_transaksi_penghuni_kamar
        FOREIGN KEY (penghuni_kamar_id) REFERENCES t_penghuni_kamar (penghuni_kamar_id),
    CONSTRAINT fk_transaksi_tipe_transaksi
        FOREIGN KEY (tipe_transaksi_id) REFERENCES t_tipe_transaksi (tipe_transaksi_id)
);

CREATE INDEX idx_transaksi_penghuni_kamar_id ON t_transaksi (penghuni_kamar_id);
CREATE INDEX idx_transaksi_tipe_transaksi_id ON t_transaksi (tipe_transaksi_id);
CREATE INDEX idx_transaksi_billing_period ON t_transaksi (billing_year, billing_month);
CREATE INDEX idx_transaksi_transaction_date ON t_transaksi (transaction_date);

-- ------------------------------------------------------------
-- 9. t_booking
-- ------------------------------------------------------------
CREATE TABLE t_booking (
    booking_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kamar_id          BIGINT        NOT NULL,
    customer_name     VARCHAR(200)  NOT NULL,
    phone_no          VARCHAR(30)   NOT NULL,
    booking_date      DATE          NOT NULL,
    expected_checkin  DATE,
    deposit_amount    DECIMAL(12,2),
    booking_status    VARCHAR(20)   NOT NULL DEFAULT 'Menunggu Konfirmasi'
                      CHECK (booking_status IN ('Menunggu Konfirmasi','Dikonfirmasi','Dibatalkan')),
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT fk_booking_kamar
        FOREIGN KEY (kamar_id) REFERENCES t_kamar (kamar_id)
);

CREATE INDEX idx_booking_kamar_id ON t_booking (kamar_id);
CREATE INDEX idx_booking_status ON t_booking (booking_status);
CREATE INDEX idx_booking_date ON t_booking (booking_date);
