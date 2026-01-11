// Simple global cache for serverless (persists during warm instances)
const globalCache = {
  data: {},
  
  set(key, value, ttl = 60000) {
    this.data[key] = {
      value,
      expires: Date.now() + ttl
    };
  },
  
  get(key) {
    const item = this.data[key];
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      delete this.data[key];
      return null;
    }
    
    return item.value;
  },
  
  has(key) {
    return this.get(key) !== null;
  },
  
  delete(key) {
    delete this.data[key];
  }
};

module.exports = globalCache;
