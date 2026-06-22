// ------------------------------------------------------------------
// Logger
//
// Purpose:
//   Structured logging for debuggability in serverless environments.
//
// Responsibility:
//   - Provides info(), warn(), error() functions
//   - Each call produces JSON: { timestamp, level, module, message, data }
//   - In development: pretty-prints to console with colors
//   - In production: writes JSON lines to stdout/stderr
//
// Dependencies:
//   - None (uses global console)
// -----------------------------------------------------------------/

export const log = {
  info(module: string, message: string, data?: Record<string, unknown>) {
    // Structured info log
  },
  warn(module: string, message: string, data?: Record<string, unknown>) {
    // Structured warning log
  },
  error(module: string, message: string, data?: Record<string, unknown>) {
    // Structured error log
  },
}
