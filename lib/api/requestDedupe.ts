const inFlight = new Map<string, Promise<unknown>>();

export function dedupeRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;

  const request = fn().finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, request);
  return request;
}
