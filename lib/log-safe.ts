/**
 * Error summary safe for logs: name, code and message only. Postgres errors
 * carry a `details` field that can echo the failing row (email, phone), so
 * whole error objects must never be logged. Email- and phone-like strings in
 * the message are masked as a backstop.
 */
export function safeError(err: unknown) {
  if (!err || typeof err !== "object") return redact(String(err));
  const e = err as { name?: unknown; code?: unknown; statusCode?: unknown; message?: unknown };
  return {
    name: e.name,
    code: e.code ?? e.statusCode,
    message: typeof e.message === "string" ? redact(e.message) : undefined,
  };
}

function redact(s: string): string {
  return s
    .replace(/[^\s@<>()"',;:]+@[^\s@<>()"',;:]+/g, "[email]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[number]");
}
