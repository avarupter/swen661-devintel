let counter = 0

/** Unique ids for new records. Call from event handlers, never during render. */
export function createId(prefix: string): string {
  counter += 1
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${counter}`
  return `${prefix}-${random}`
}
