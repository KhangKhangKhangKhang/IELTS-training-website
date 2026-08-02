const CACHE_TTL_MS = 60_000;
const cache = new Map();

export const cachedFetch = async (key, fetcher) => {
  const now = Date.now();
  const entry = cache.get(key);
  if (entry && entry.expiry > now) {
    return entry.value;
  }
  const value = await fetcher();
  cache.set(key, { value, expiry: now + CACHE_TTL_MS });
  return value;
};

export const invalidateCache = (keyPattern) => {
  if (!keyPattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(keyPattern)) {
      cache.delete(key);
    }
  }
};
