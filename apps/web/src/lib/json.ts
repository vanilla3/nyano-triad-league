export function stringifyWithBigInt(value: unknown, space = 2): string {
  return JSON.stringify(
    value,
    (_k, v) => (typeof v === "bigint" ? v.toString() : v),
    space
  );
}
