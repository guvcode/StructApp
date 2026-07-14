export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  return value.split('T')[0] ?? value;
}