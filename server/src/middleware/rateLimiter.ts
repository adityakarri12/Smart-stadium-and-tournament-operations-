import { Request, Response, NextFunction } from 'express';

interface ClientRateLimit {
  tokens: number;
  lastRefill: number;
}

const ipCache = new Map<string, ClientRateLimit>();
const REFILL_INTERVAL_MS = 1000; // Refill 1 token per second
const MAX_TOKENS = 60; // Up to 60 burst requests

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  
  if (!ipCache.has(ip)) {
    ipCache.set(ip, { tokens: MAX_TOKENS, lastRefill: now });
  }

  const clientData = ipCache.get(ip)!;
  const timePassedMs = now - clientData.lastRefill;
  const refillTokens = Math.floor(timePassedMs / REFILL_INTERVAL_MS);
  
  if (refillTokens > 0) {
    clientData.tokens = Math.min(MAX_TOKENS, clientData.tokens + refillTokens);
    clientData.lastRefill = now;
  }

  if (clientData.tokens <= 0) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.'
    });
  }

  clientData.tokens--;
  next();
};

// Periodically clean up old IP entries to prevent memory leak (DoS vector)
// Run cleanup every 5 minutes, removing entries that haven't refilled in over 10 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
const INACTIVE_TIMEOUT = 10 * 60 * 1000;

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipCache.entries()) {
    if (now - data.lastRefill > INACTIVE_TIMEOUT) {
      ipCache.delete(ip);
    }
  }
}, CLEANUP_INTERVAL);

// Allow the node process to exit during tests or builds without waiting for the timer
if (typeof cleanupTimer.unref === 'function') {
  cleanupTimer.unref();
}

