(function () {
  const page = document.body && document.body.dataset.page;
  if (!page || page === 'login') return;

  const F = window.KostFormat;

  async function loadDashboard() {
    const [summaryRes, trendRes, pieRes, dueRes] = await Promise.all([
      KostApi.get('/dashboard/summary'),
      KostApi.get('/dashboard/income-expense?months=6'),
      KostApi.get('/dashboard/pengeluaran-pie'),
      KostApi.get('/dashboard/tagihan-jatuh-tempo'),
    ]);
    const s = summaryRes.data || {};
    const cards = document.querySelectorAll('.stat-card .value');
    if (cards[0]) cards[0].textContent = s.total_penghuni_aktif ?? '0';
    if (cards[1]) cards[1].textContent = s.total_kamar_kosong ?? '0';
    if (cards[2]) cards[2].textContent = F.formatRupiah(s.total_pemasukan_bulan_ini);
    if (cards[3]) cards[3].textContent = s.total_booking_bulan_ini ?? '0';
    const subs = document.querySelectorAll('.stat-card .sub');
    if (subs[1] && s.total_kamar != null) subs[1].textContent = `dari ${s.total_kamar} kamar`;
    if (subs[3]) subs[3].textContent = `menunggu konfirmasi: ${s.total_booking_menunggu ?? 0}`;

    const trend = trendRes.data || [];
    const barEl = document.getElementById('barChart');
    if (barEl && window.Chart) {
      new Chart(barEl, {
        type: 'bar',
        data: {
          labels: trend.map((r) => F.MONTHS[r.billing_month - 1] || r.billing_month),
          datasets: [
            { label: 'Pemasukan', data: trend.map((r) => Number(r.pemasukan)), backgroundColor: '#2563eb' },
            { label: 'Pengeluaran', data: trend.map((r) => Number(r.pengeluaran)), backgroundColor: '#f97316' },
          ],
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
      });
    }

    const pie = pieRes.data || [];
    const pieEl = document.getElementById('pieChart');
    if (pieEl && window.Chart) {
      const colors = ['#2563eb', '#f97316', '#16a34a', '#eab308', '#9333ea', '#64748b'];
      new Chart(pieEl, {
        type: 'pie',
        data: {
          labels: pie.map((r) => r.tipe_transaksi_nama),
          datasets: [{ data: pie.map((r) => Number(r.total_amount)), backgroundColor: colors }],
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
      });
    }

    const tbody = document.querySelector('[data-table="due-bills"] tbody');
    if (tbody) {
      tbody.innerHTML = (dueRes.data || [])
        .map(
          (row) => `<tr>
          <td>${row.full_name}</td><td>${row.room_no}</td><td>${row.property_name}</td>
          <td>${F.formatDateId(row.jatuh_tempo)}</td><td>${F.formatRupiah(row.amount)}</td>
          <td>${F.badgeForStatus(row.status, { 'Belum Bayar': { cls: 'badge-warning', label: 'Belum Bayar' }, Lunas: { cls: 'badge-success', label: 'Lunas' } })}</td>
        </tr>`
        )
        .join('');
    }
  }

  async function loadProperties() {
    const search = document.querySelector('[data-filter="search"]');
    const tipe = document.querySelector('[data-filter="tipe"]');
    const city = document.querySelector('[data-filter="city"]');
    const params = new URLSearchParams();
    if (search && search.value.trim()) params.set('search', search.value.trim());
    if (tipe && tipe.value) params.set('tipe_property_id', tipe.value);
    if (city && city.value) params.set('city', city.value);
    const res = await KostApi.get(`/properties?${params}`);
    const tbody = document.querySelector('[data-table="property"] tbody');
    if (!tbody) return;
    tbody.innerHTML = (res.data || [])
      .map(
        (p) => `<tr>
        <td>${p.property_code}</td><td>${p.property_name}</td><td>${p.property_type_name || '-'}</td>
        <td>${p.address1}</td><td>${p.city || '-'}</td><td>${p.total_kamar ?? 0}</td>
        <td><span class="badge badge-success">Aktif</span></td>
        <td><a class="btn btn-sm btn-outline" href="kamar.html?property_id=${p.property_id}">Lihat Kamar</a></td>
      </tr>`
      )
      .join('');
  }

  async function loadKamar() {
    const params = new URLSearchParams(window.location.search);
    const propertyId = params.get('property_id');
    const q = propertyId ? `?property_id=${propertyId}` : '';
    const res = await KostApi.get(`/kamar${q}`);
    const tbody = document.querySelector('[data-table="kamar"] tbody');
    if (!tbody) return;
    const statusMap = {
      Kosong: { cls: 'badge-success', label: 'Kosong' },
      Terisi: { cls: 'badge-danger', label: 'Terisi' },
      Maintenance: { cls: 'badge-warning', label: 'Maintenance' },
    };
    tbody.innerHTML = (res.data || [])
      .map(
        (k) => `<tr>
        <td>KM-${k.kamar_id}</td><td>${k.property_name}</td><td>${k.room_no}</td><td>${k.floor_no ?? '-'}</td>
        <td>${k.kamar_type_name}</td><td>${k.max_occupancy}</td><td>${F.formatRupiah(k.monthly_rental)}</td>
        <td>${F.badgeForStatus(k.status, statusMap)}</td><td>-</td>
      </tr>`
      )
      .join('');
  }

  async function loadBooking() {
    const res = await KostApi.get('/booking');
    const tbody = document.querySelector('[data-table="booking"] tbody');
    if (!tbody) return;
    const statusMap = {
      'Menunggu Konfirmasi': { cls: 'badge-warning', label: 'Menunggu' },
      Dikonfirmasi: { cls: 'badge-success', label: 'Dikonfirmasi' },
      Dibatalkan: { cls: 'badge-danger', label: 'Dibatalkan' },
    };
    tbody.innerHTML = (res.data || [])
      .map(
        (b) => `<tr>
        <td>BK-${String(b.booking_id).padStart(4, '0')}</td>
        <td>${b.room_no} (${b.property_name})</td><td>${b.customer_name}</td><td>${b.phone_no}</td>
        <td>${F.formatDateId(b.booking_date)}</td><td>${F.formatDateId(b.expected_checkin)}</td>
        <td>${F.formatRupiah(b.deposit_amount)}</td><td>${F.badgeForStatus(b.booking_status, statusMap)}</td>
        <td>
          <a class="btn btn-sm btn-outline" href="/api/booking/${b.booking_id}/receipt" target="_blank">Receipt</a>
          ${b.booking_status === 'Menunggu Konfirmasi' ? `<button class="btn btn-sm btn-outline" data-confirm-booking="${b.booking_id}">Konfirmasi</button>` : ''}
        </td>
      </tr>`
      )
      .join('');
    tbody.querySelectorAll('[data-confirm-booking]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await KostApi.patch(`/booking/${btn.dataset.confirmBooking}`, { booking_status: 'Dikonfirmasi' });
        loadBooking();
      });
    });
  }

  async function loadTransaksi() {
    const res = await KostApi.get('/transaksi');
    const tbody = document.querySelector('[data-table="transaksi"] tbody');
    if (!tbody) return;
    tbody.innerHTML = (res.data || [])
      .map(
        (t) => `<tr>
        <td>TX-${t.transaksi_id}</td><td>${t.full_name}</td><td>${t.room_no}</td><td>${t.tipe_transaksi_nama}</td>
        <td>${F.formatPeriod(t.billing_month, t.billing_year)}</td><td>${F.formatDateId(t.transaction_date)}</td>
        <td>${F.formatRupiah(t.amount)}</td><td>${t.remarks || '-'}</td>
      </tr>`
      )
      .join('');
  }

  async function loadMasterTable(apiPath, tableKey, rowHtml) {
    const res = await KostApi.get(apiPath);
    const tbody = document.querySelector(`[data-table="${tableKey}"] tbody`);
    if (!tbody) return;
    tbody.innerHTML = (res.data || []).map(rowHtml).join('');
  }

  async function loadReport(apiPath, tableKey, rowHtml) {
    const res = await KostApi.get(apiPath);
    const tbody = document.querySelector(`[data-table="${tableKey}"] tbody`);
    if (!tbody) return;
    tbody.innerHTML = (res.data || []).map(rowHtml).join('') || '<tr><td colspan="99">Tidak ada data</td></tr>';
  }

  const loaders = {
    dashboard: loadDashboard,
    property: loadProperties,
    kamar: loadKamar,
    booking: loadBooking,
    transaksi: loadTransaksi,
    'tipe-property': () =>
      loadMasterTable('/tipe-property', 'tipe-property', (r) =>
        `<tr><td>${r.property_type_code}</td><td>${r.property_type_name || '-'}</td><td>${r.description || '-'}</td><td>${r.active_flag}</td></tr>`
      ),
    'tipe-kamar': () =>
      loadMasterTable('/tipe-kamar', 'tipe-kamar', (r) =>
        `<tr><td>${r.kamar_code}</td><td>${r.kamar_type_name}</td><td>${r.description || '-'}</td><td>${r.active_flag}</td></tr>`
      ),
    'tipe-transaksi': () =>
      loadMasterTable('/tipe-transaksi', 'tipe-transaksi', (r) =>
        `<tr><td>${r.code}</td><td>${r.nama}</td><td>${r.category}</td><td>${r.description || '-'}</td><td>${r.active_flag}</td></tr>`
      ),
    'report-penghuni': () =>
      loadReport('/reports/penghuni-aktif', 'report-penghuni', (r) =>
        `<tr><td>${r.full_name}</td><td>${r.no_ktp || '-'}</td><td>${r.phone_no || '-'}</td><td>${r.property_name}</td><td>${r.room_no}</td><td>${F.formatDateId(r.checkin_date)}</td><td>${F.formatRupiah(r.agreed_rental)}</td><td><span class="badge badge-success">Aktif</span></td></tr>`
      ),
    'report-kamar': () =>
      loadReport('/reports/kamar-kosong', 'report-kamar', (r) =>
        `<tr><td>${r.property_name}</td><td>${r.room_no}</td><td>${r.floor_no ?? '-'}</td><td>${r.kamar_type_name}</td><td>${F.formatRupiah(r.monthly_rental)}</td><td>-</td><td><span class="badge badge-success">Kosong</span></td></tr>`
      ),
    'report-tagihan': () =>
      loadReport('/reports/tagihan-penghuni', 'report-tagihan', (r) =>
        `<tr><td>${r.full_name}</td><td>${r.room_no}</td><td>${r.property_name}</td><td>${F.formatPeriod(r.billing_month, r.billing_year)}</td><td>${F.formatRupiah(r.amount)}</td><td>${F.formatDateId(r.transaction_date)}</td><td>${r.remarks || '-'}</td></tr>`
      ),
    'report-keuangan': () =>
      loadReport('/reports/keuangan', 'report-keuangan', (r) =>
        `<tr><td>${F.formatDateId(r.transaction_date)}</td><td>${r.property_name}</td><td>${r.tipe_transaksi_nama}</td><td>${r.category}</td><td>${r.remarks || '-'}</td><td>${F.formatRupiah(r.amount)}</td></tr>`
      ),
    'report-booking': () =>
      loadReport('/reports/booking', 'report-booking', (r) =>
        `<tr><td>BK-${String(r.booking_id).padStart(4, '0')}</td><td>${r.room_no}</td><td>${r.property_name}</td><td>${r.customer_name}</td><td>${F.formatDateId(r.booking_date)}</td><td>${F.formatDateId(r.expected_checkin)}</td><td>${F.formatRupiah(r.deposit_amount)}</td><td>${r.booking_status}</td></tr>`
      ),
  };

  const loader = loaders[page];
  if (loader) {
    loader().catch((err) => {
      console.error(err);
      const content = document.querySelector('.content');
      if (content && !content.querySelector('.api-error')) {
        const div = document.createElement('div');
        div.className = 'api-error badge badge-danger';
        div.style.display = 'block';
        div.style.marginBottom = '12px';
        div.textContent = `Gagal memuat data API: ${err.message}. Pastikan DATABASE_URL dan schema SQL sudah dijalankan.`;
        content.prepend(div);
      }
    });
  }
})();
