export const DATE_LOCALE = 'ar-SY-u-ca-gregory-nu-latn';
export const NUMBER_LOCALE = 'ar-SY-u-nu-latn';

export function formatDate(value: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options,
  }).format(date);
}

export function formatNumber(value: number | string | null | undefined, options?: Intl.NumberFormatOptions) {
  if (value === null || value === undefined || value === '') return '0';
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return '0';
  return new Intl.NumberFormat(NUMBER_LOCALE, options).format(num);
}

export function formatCurrencySYP(value: number | string | null | undefined) {
  // We render as "{number} ل.س" to match existing UI copy.
  return `${formatNumber(value)} ل.س`;
}
