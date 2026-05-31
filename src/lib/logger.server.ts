// Logger servidor — para API routes, webhooks y procesos automáticos
// Nunca lanza excepciones — el logging no puede romper el flujo principal

import prisma from "@/lib/prisma";
import type { LogEventType } from "./logger";

export type { LogEventType };

export async function logServerEvent(
  type: LogEventType,
  options: {
    userId?: string | null;
    metadata?: Record<string, unknown>;
    source?: "SERVER" | "SYSTEM";
  } = {}
): Promise<void> {
  const { userId = null, metadata = {}, source = "SERVER" } = options;
  try {
    await prisma.activityLog.create({
      data: {
        type,
        source,
        userId: userId ?? null,
        metadata: metadata as object,
      },
    });
  } catch {
    // Silencioso — nunca lanzar desde el logger
  }
}

// Variante conveniente para errores del sistema
export async function logError(
  context: string,
  error: unknown,
  userId?: string | null
): Promise<void> {
  const message =
    error instanceof Error ? error.message : String(error);
  await logServerEvent("SYSTEM_ERROR", {
    userId,
    metadata: { context, message },
    source: "SYSTEM",
  });
}
