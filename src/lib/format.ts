export const SITE_TIME_ZONE = 'Asia/Shanghai';

const dayFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: SITE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function part(date: Date, type: Intl.DateTimeFormatPartTypes): string {
  return dayFormat.formatToParts(date).find((item) => item.type === type)?.value ?? '';
}

/** YYYY-MM-DD in the site time zone. */
export function dayKey(date: Date): string {
  return `${part(date, 'year')}-${part(date, 'month')}-${part(date, 'day')}`;
}

/** Display date as 2026.10.18 in the site time zone. */
export function formatDate(date: Date): string {
  return dayKey(date).replaceAll('-', '.');
}
