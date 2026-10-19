const MONTHS_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

export function formatRupiah(amount) {
  const n = Number(amount);
  if (Number.isNaN(n)) return 'Rp 0';
  return `Rp ${n.toLocaleString('id-ID')}`;
}

export function formatPeriod(month, year) {
  const m = Number(month);
  const y = Number(year);
  if (!m || !y) return '-';
  return `${MONTHS_ID[m - 1] || m} ${y}`;
}

export function formatDateId(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function parseAmountInput(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^\d.-]/g, '');
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
}
