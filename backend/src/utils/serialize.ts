export function decimalToNumber(
  value: { toNumber(): number } | number | null | undefined
): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : value.toNumber();
}
