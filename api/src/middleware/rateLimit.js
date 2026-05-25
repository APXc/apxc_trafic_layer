const buckets = new Map();

function cleanup(now) {
  for (const [key, value] of buckets.entries()) {
    if (value.expiresAt <= now) {
      buckets.delete(key);
    }
  }
}

export function createRateLimiter({ windowMs = 60_000, max = 60 } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    const routeKey = `${req.method}:${req.baseUrl || req.path}`;
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `${ip}:${routeKey}`;

    const current = buckets.get(key);
    if (!current || current.expiresAt <= now) {
      buckets.set(key, { count: 1, expiresAt: now + windowMs });
      cleanup(now);
      return next();
    }

    if (current.count >= max) {
      const retryAfter = Math.ceil((current.expiresAt - now) / 1000);
      res.set('Retry-After', String(Math.max(retryAfter, 1)));
      return res.status(429).json({ error: 'Too many requests' });
    }

    current.count += 1;
    return next();
  };
}
