class RateLimiter {
  constructor(maxTokens, refillRateMs) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRateMs = refillRateMs;
    this.lastRefill = Date.now();
  }

  tryConsume() {
    this._refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  _refill() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor(timePassed / this.refillRateMs);
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
}

// Global rate limiter: 30 actions per minute (1 token every 2 seconds)
export const globalRateLimiter = new RateLimiter(30, 2000);

export function withRateLimit(actionName, fn) {
  return async (...args) => {
    if (!globalRateLimiter.tryConsume()) {
      throw new Error(`Rate limit exceeded. Please wait before trying again.`);
    }
    return await fn(...args);
  };
}
