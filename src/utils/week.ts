/** Jumbo's weekly offers run Monday through Sunday. */
export function getCurrentWeekRange(referenceDate: Date = new Date()): { start: Date; end: Date } {
  const day = referenceDate.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(referenceDate);
  start.setDate(referenceDate.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return { start, end };
}

export function formatDateRange(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}
