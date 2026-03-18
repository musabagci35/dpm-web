type Entry = {
    count: number;
    expiresAt: number;
  };
  
  const store = new Map<string, Entry>();
  
  export function rateLimit(
    key: string,
    limit = 5,
    windowMs = 10 * 60 * 1000
  ) {
    const now = Date.now();
    const current = store.get(key);
  
    if (!current || current.expiresAt < now) {
      store.set(key, { count: 1, expiresAt: now + windowMs });
      return { success: true, remaining: limit - 1 };
    }
  
    if (current.count >= limit) {
      return { success: false, remaining: 0 };
    }
  
    current.count += 1;
    store.set(key, current);
    return { success: true, remaining: limit - current.count };
  }