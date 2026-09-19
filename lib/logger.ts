import { isProduction } from "./config";

type Level = "debug" | "info" | "warn" | "error";

function log(level: Level, message: string, context?: Record<string, unknown>) {
  if (isProduction && (level === "debug" || level === "info")) return;
  const record = {
    level,
    message,
    ...context,
    ts: new Date().toISOString(),
  };
  const line = JSON.stringify(record);
  if (level === "debug") {
    console.log(line);
    return;
  }
  console[level](line);
}

export const logger = {
  debug: (m: string, c?: Record<string, unknown>) => log("debug", m, c),
  info: (m: string, c?: Record<string, unknown>) => log("info", m, c),
  warn: (m: string, c?: Record<string, unknown>) => log("warn", m, c),
  error: (m: string, c?: Record<string, unknown>) => log("error", m, c),
};
