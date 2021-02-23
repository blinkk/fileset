export function prettyDate(date: Date) {
  return new Date(date).toLocaleString([], {
    year: '2-digit',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
