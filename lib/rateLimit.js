// Simple in-memory rate limiter — no external packages needed.
// Uses a Map keyed by IP. Each entry stores an array of timestamps.
// Automatically prunes expired entries every 60 seconds.

const store = new Map();
const PRUNE_INTERVAL = 60_000; // 1 minute

let pruneTimer = null;

function startPrune() {
  if (pruneTimer) return;
  pruneTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of store) {
      const valid = timestamps.filter((t) => now - t < 60_000);
      if (valid.length === 0) store.delete(key);
      else store.set(key, valid);
    }
  }, PRUNE_INTERVAL);
  // Allow the Node process to exit naturally
  if (pruneTimer.unref) pruneTimer.unref();
}

/**
 * Check whether a request from `ip` exceeds `maxRequests` in the
 * last 60 seconds.
 * @param {string} ip
 * @param {number} maxRequests
 * @returns {boolean} true if the request is allowed, false if rate-limited
 */
export function allowRequest(ip, maxRequests = 10) {
  startPrune();
  const now = Date.now();
  const timestamps = (store.get(ip) || []).filter((t) => now - t < 60_000);
  if (timestamps.length >= maxRequests) return false;
  timestamps.push(now);
  store.set(ip, timestamps);
  return true;
}
