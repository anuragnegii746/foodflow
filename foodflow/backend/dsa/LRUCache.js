/**
 * DSA: LRU Cache (Least Recently Used Cache)
 * Used for: Caching frequently accessed restaurant menus and search results.
 *           Avoids redundant data lookups for hot restaurants.
 *
 * Implementation: Doubly Linked List + HashMap
 * Time Complexity: get O(1), put O(1), delete O(1)
 * Space Complexity: O(capacity)
 *
 * The doubly linked list maintains order (MRU at head, LRU at tail).
 * The HashMap gives O(1) access to any node.
 */

class DLinkedNode {
  constructor(key = null, value = null) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
    this.accessCount = 0;
    this.createdAt = Date.now();
    this.lastAccessed = Date.now();
  }
}

class LRUCache {
  constructor(capacity = 100, ttlMs = 5 * 60 * 1000) {
    this.capacity = capacity;
    this.ttlMs = ttlMs;       // Time-to-live in milliseconds
    this.cache = new Map();   // key -> DLinkedNode

    // Sentinel nodes (dummy head and tail)
    this.head = new DLinkedNode();  // MRU end
    this.tail = new DLinkedNode();  // LRU end
    this.head.next = this.tail;
    this.tail.prev = this.head;

    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * Get value by key — O(1)
   * Returns null if not found or expired
   */
  get(key) {
    if (!this.cache.has(key)) {
      this.misses++;
      return null;
    }

    const node = this.cache.get(key);

    // Check TTL expiry
    if (Date.now() - node.createdAt > this.ttlMs) {
      this._removeNode(node);
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Move to head (most recently used)
    this._moveToHead(node);
    node.accessCount++;
    node.lastAccessed = Date.now();
    this.hits++;
    return node.value;
  }

  /**
   * Set key-value pair — O(1)
   */
  put(key, value) {
    if (this.cache.has(key)) {
      const node = this.cache.get(key);
      node.value = value;
      node.createdAt = Date.now();  // refresh TTL
      this._moveToHead(node);
      return;
    }

    const newNode = new DLinkedNode(key, value);
    this.cache.set(key, newNode);
    this._addToHead(newNode);

    // Evict LRU if over capacity
    if (this.cache.size > this.capacity) {
      const lru = this._removeTail();
      this.cache.delete(lru.key);
      this.evictions++;
    }
  }

  /**
   * Delete a key — O(1)
   */
  delete(key) {
    if (!this.cache.has(key)) return false;
    const node = this.cache.get(key);
    this._removeNode(node);
    this.cache.delete(key);
    return true;
  }

  /**
   * Invalidate all keys matching a prefix
   */
  invalidatePrefix(prefix) {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      capacity: this.capacity,
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRate: total > 0 ? ((this.hits / total) * 100).toFixed(2) + '%' : '0%',
      ttlSeconds: this.ttlMs / 1000,
    };
  }

  /**
   * Get all cached keys (for inspection)
   */
  keys() {
    return [...this.cache.keys()];
  }

  clear() {
    this.cache.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  // ── Private DLL helpers ──────────────────────────────────────

  _addToHead(node) {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next.prev = node;
    this.head.next = node;
  }

  _removeNode(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _moveToHead(node) {
    this._removeNode(node);
    this._addToHead(node);
  }

  _removeTail() {
    const lru = this.tail.prev;
    this._removeNode(lru);
    return lru;
  }
}

module.exports = { LRUCache };
