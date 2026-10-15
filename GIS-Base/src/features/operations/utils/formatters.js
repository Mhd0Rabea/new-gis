export const formatNumber = (value) => new Intl.NumberFormat('ar-SY-u-nu-latn').format(Number(value || 0));
export const formatDateTime = (value) => {
  if (!value) return 'غير متوفر';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'غير متوفر' : new Intl.DateTimeFormat('ar-SY', { dateStyle: 'medium', timeStyle: 'short', hour12: true }).format(date);
};
export const displayValue = (value) => value === null || value === undefined || value === '' ? 'غير متوفر' : String(value);
