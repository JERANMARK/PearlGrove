const WINDOW_MS = 15 * 60 * 1000;
const MAX_ACCOUNT_ATTEMPTS = 10;
const MAX_IP_ATTEMPTS = 30;
const MAX_KEYS = 10000;
const attempts = new Map();

export const loginRateLimit = (req, res, next) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 254) : '';
  const ip = String(req.ip || req.socket?.remoteAddress || 'unknown').slice(0, 64);
  const keys = [{ key: `ip:${ip}`, limit: MAX_IP_ATTEMPTS }, ...(email ? [{ key: `account:${email}`, limit: MAX_ACCOUNT_ATTEMPTS }] : [])];
  const now = Date.now();
  for (const { key, limit } of keys) {
    const entry = attempts.get(key);
    if (entry && now < entry.resetAt && entry.count >= limit) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      res.set('X-RateLimit-Limit', String(limit));
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', String(entry.resetAt));
      return res.status(429).json({ success: false, error: 'Too many login attempts. Try again later.' });
    }
  }
  for (const { key, limit } of keys) {
    const current = attempts.get(key);
    const entry = !current || now >= current.resetAt ? { count: 0, resetAt: now + WINDOW_MS } : current;
    entry.count += 1;
    attempts.delete(key);
    attempts.set(key, entry);
    
    // Add rate limit headers for successful requests
    const remaining = Math.max(0, limit - entry.count);
    res.set('X-RateLimit-Limit', String(limit));
    res.set('X-RateLimit-Remaining', String(remaining));
    res.set('X-RateLimit-Reset', String(entry.resetAt));
  }
  while (attempts.size > MAX_KEYS) attempts.delete(attempts.keys().next().value);
  req.loginRateLimitAccountKey = email ? `account:${email}` : null;
  req.loginRateLimitIpKey = `ip:${ip}`;
  next();
};

export const clearLoginRateLimit = (req) => {
  // Keep the IP bucket intact; clear the account bucket after successful authentication.
  if (req.loginRateLimitAccountKey) attempts.delete(req.loginRateLimitAccountKey);
};
