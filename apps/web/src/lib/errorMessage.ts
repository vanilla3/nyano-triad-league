/**
 * errorMessage — Extract a human-readable message from an unknown thrown value.
 *
 * Use this instead of `catch (e: any) { e.message }` for type-safe error handling.
 * Handles Error instances, strings, and arbitrary values gracefully.
 */
export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return String(e ?? "Unknown error");
}
