/**
 * Validador estricto de formato UUID (v1-v5 de PostgreSQL / RFC 4122)
 * Evita enviar strings demo ("season-2026", "competition-2026", "team-1") a columnas UUID en PostgreSQL.
 */
export function isUUID(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
}
