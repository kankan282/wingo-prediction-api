// Ultra-fast in-memory caching system
class PredictionCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 100;
    this.ttl = 60000; // 1 minute TTL
  }

  set(key, value) {
    // Auto-cleanup if cache is too large
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  has(key) {
    return this.cache.has(key) && this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
  }
}

// Singleton instance
const predictionCache = new PredictionCache();

module.exports = predictionCache;
