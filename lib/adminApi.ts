interface FetchJsonOptions {
  authToken?: string | null;
  cacheKey?: string;
  cacheTtlMs?: number;
  method?: string;
  body?: unknown;
  retryCount?: number;
  retryDelayMs?: number;
}

const DEFAULT_RETRY_COUNT = 2;
const DEFAULT_RETRY_DELAY_MS = 400;
const DEFAULT_CACHE_TTL_MS = 15_000;

const getCachedValue = <T>(cacheKey?: string): T | null => {
  if (!cacheKey || typeof window === 'undefined') return null;

  try {
    const cached = window.localStorage.getItem(cacheKey);
    if (!cached) return null;

    const parsed = JSON.parse(cached) as { expiresAt: number; value: T };
    if (parsed.expiresAt > Date.now()) {
      return parsed.value;
    }

    window.localStorage.removeItem(cacheKey);
  } catch {
    window.localStorage.removeItem(cacheKey);
  }

  return null;
};

const setCachedValue = (cacheKey: string | undefined, value: unknown, ttlMs: number) => {
  if (!cacheKey || typeof window === 'undefined') return;

  window.localStorage.setItem(
    cacheKey,
    JSON.stringify({
      value,
      expiresAt: Date.now() + ttlMs,
    })
  );
};

export const fetchJsonWithRetry = async <T = unknown>(
  url: string,
  options: FetchJsonOptions = {}
): Promise<T> => {
  const {
    authToken,
    cacheKey,
    cacheTtlMs = DEFAULT_CACHE_TTL_MS,
    method = 'GET',
    body,
    retryCount = DEFAULT_RETRY_COUNT,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
  } = options;

  const cachedValue = getCachedValue<T>(cacheKey);
  if (cachedValue && method === 'GET') {
    return cachedValue;
  }

  const headers: HeadersInit = {
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      const response = await fetch(url, {
        method,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }

      const data = (await response.json()) as T;
      if (method === 'GET' && cacheKey) {
        setCachedValue(cacheKey, data, cacheTtlMs);
      }

      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      if (attempt === retryCount) break;
      await new Promise((resolve) => window.setTimeout(resolve, retryDelayMs * (attempt + 1)));
    }
  }

  throw lastError ?? new Error('Request failed');
};
