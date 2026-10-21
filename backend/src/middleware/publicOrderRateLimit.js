const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 10;
const MAX_BUCKETS = 10_000;
const requests = new Map();

export const publicOrderRateLimit = (req, res, next) => {
  const ip = String(req.ip || req.socket?.remoteAddress || 'unknown').slice(0, 64);
  const now = Date.now();
  const current = requests.get(ip);
  const bucket = !current || now >= current.resetAt
    ? { count: 0, resetAt: now + WINDOW_MS }
    : current;

  if (bucket.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    res.set('Retry-After', String(retryAfter));
    res.set('X-RateLimit-Limit', String(MAX_REQUESTS));
    res.set('X-RateLimit-Remaining', '0');
    res.set('X-RateLimit-Reset', String(bucket.resetAt));
    return res.status(429).json({ success: false, error: 'Too many order requests. Try again later.' });
  }

  bucket.count += 1;
  requests.delete(ip);
  requests.set(ip, bucket);
  while (requests.size > MAX_BUCKETS) requests.delete(requests.keys().next().value);
  
  // Add rate limit headers for successful requests
  const remaining = Math.max(0, MAX_REQUESTS - bucket.count);
  res.set('X-RateLimit-Limit', String(MAX_REQUESTS));
  res.set('X-RateLimit-Remaining', String(remaining));
  res.set('X-RateLimit-Reset', String(bucket.resetAt));
  
  return next();
};
