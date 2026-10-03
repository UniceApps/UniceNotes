// null si la requête échoue ou dépasse le délai (ADE ne répond parfois jamais)
export function withTimeout<T>(ms: number, run: (signal: AbortSignal) => Promise<T | null>): Promise<T | null> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve(null);
    }, ms);
  });
  return Promise.race([run(controller.signal).catch(() => null), timeout]).finally(() => clearTimeout(timer));
}
