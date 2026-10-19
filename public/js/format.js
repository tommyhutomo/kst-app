(function () {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  function formatRupiah(amount) {
    const n = Number(amount);
    if (Number.isNaN(n)) return 'Rp 0';
    return `Rp ${n.toLocaleString('id-ID')}`;
  }

  function formatDateId(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function formatPeriod(month, year) {
    return `${MONTHS[(Number(month) || 1) - 1] || month} ${year}`;
  }

  function badgeForStatus(status, map) {
    const m = map[status] || { cls: 'badge-muted', label: status };
    return `<span class="badge ${m.cls}">${m.label}</span>`;
  }

  window.KostFormat = { formatRupiah, formatDateId, formatPeriod, badgeForStatus, MONTHS };
})();
