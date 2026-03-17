export function parseHistoryPage(value: string | string[] | undefined): number {
  const firstValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(firstValue ?? "1");

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}
