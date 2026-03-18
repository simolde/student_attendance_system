type Entry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Entry>();

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

export function rateLimit(
  key: string,
  options: RateLimitOptions
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + options.windowMs;
    store.set(key, {
      count: 1,
      resetAt,
    });

    return {
      success: true,
      remaining: options.limit - 1,
      resetAt,
    };
  }

  if (entry.count >= options.limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count += 1;
  store.set(key, entry);

  return {
    success: true,
    remaining: options.limit - entry.count,
    resetAt: entry.resetAt,
  };
}