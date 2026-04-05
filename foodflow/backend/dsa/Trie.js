/**
 * DSA: Trie (Prefix Tree)
 * Used for: Real-time autocomplete search of restaurants, dishes, cuisines
 * Time Complexity: insert O(m), search O(m), autocomplete O(m + k)
 *   where m = word length, k = number of results
 * Space Complexity: O(ALPHABET_SIZE * m * n)
 */

class TrieNode {
  constructor() {
    this.children = new Map();   // character -> TrieNode
    this.isEndOfWord = false;
    this.metadata = [];          // stores restaurant/dish IDs & names at this word end
    this.frequency = 0;          // how often this term was searched (for ranking)
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
    this.totalWords = 0;
  }

  /**
   * Insert a word with associated metadata
   * @param {string} word
   * @param {object} meta - { id, name, type: 'restaurant'|'dish'|'cuisine', rating }
   */
  insert(word, meta = {}) {
    let node = this.root;
    const lower = word.toLowerCase().trim();

    for (const char of lower) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char);
    }

    if (!node.isEndOfWord) this.totalWords++;
    node.isEndOfWord = true;
    node.metadata.push(meta);
    return this;
  }

  /**
   * Search exact word — O(m)
   * Returns metadata array or null
   */
  search(word) {
    const node = this._traverse(word.toLowerCase().trim());
    if (!node || !node.isEndOfWord) return null;
    node.frequency++;
    return node.metadata;
  }

  /**
   * Check if prefix exists — O(m)
   */
  startsWith(prefix) {
    return this._traverse(prefix.toLowerCase().trim()) !== null;
  }

  /**
   * Autocomplete — returns top N suggestions for a prefix
   * O(m + k) where k = nodes visited
   * @param {string} prefix
   * @param {number} limit - max results
   */
  autocomplete(prefix, limit = 8) {
    const lower = prefix.toLowerCase().trim();
    const node = this._traverse(lower);
    if (!node) return [];

    const results = [];
    this._dfsCollect(node, lower, results, limit);

    // Sort by frequency (most searched first), then alphabetically
    results.sort((a, b) => b.frequency - a.frequency || a.word.localeCompare(b.word));
    return results.slice(0, limit);
  }

  /**
   * Delete a word — O(m)
   */
  delete(word) {
    this._deleteHelper(this.root, word.toLowerCase().trim(), 0);
  }

  /**
   * Get all words (for debugging/export)
   */
  getAllWords() {
    const results = [];
    this._dfsCollect(this.root, '', results, Infinity);
    return results;
  }

  // ── Private helpers ──────────────────────────────────────────

  _traverse(str) {
    let node = this.root;
    for (const char of str) {
      if (!node.children.has(char)) return null;
      node = node.children.get(char);
    }
    return node;
  }

  _dfsCollect(node, currentWord, results, limit) {
    if (results.length >= limit) return;

    if (node.isEndOfWord) {
      results.push({
        word: currentWord,
        metadata: node.metadata,
        frequency: node.frequency,
      });
    }

    for (const [char, child] of node.children) {
      if (results.length >= limit) break;
      this._dfsCollect(child, currentWord + char, results, limit);
    }
  }

  _deleteHelper(node, word, depth) {
    if (!node) return false;
    if (depth === word.length) {
      if (!node.isEndOfWord) return false;
      node.isEndOfWord = false;
      node.metadata = [];
      this.totalWords--;
      return node.children.size === 0;
    }
    const char = word[depth];
    if (!node.children.has(char)) return false;
    const shouldDelete = this._deleteHelper(node.children.get(char), word, depth + 1);
    if (shouldDelete) node.children.delete(char);
    return !node.isEndOfWord && node.children.size === 0;
  }
}

/**
 * FoodSearch — application-level search engine using Trie
 * Supports searching restaurants, dishes, and cuisines
 */
class FoodSearchEngine {
  constructor() {
    this.restaurantTrie = new Trie();
    this.dishTrie = new Trie();
    this.cuisineTrie = new Trie();
    this.indexedCount = { restaurants: 0, dishes: 0, cuisines: 0 };
  }

  indexRestaurant(restaurant) {
    const meta = {
      id: restaurant.id,
      name: restaurant.name,
      type: 'restaurant',
      rating: restaurant.rating,
      cuisine: restaurant.cuisine,
      deliveryTime: restaurant.deliveryTime,
    };

    // Index full name and each word separately for partial match
    this.restaurantTrie.insert(restaurant.name, meta);
    restaurant.name.split(' ').forEach(word => {
      if (word.length > 2) this.restaurantTrie.insert(word, meta);
    });

    // Index cuisine
    this.cuisineTrie.insert(restaurant.cuisine, {
      ...meta,
      type: 'cuisine',
    });

    this.indexedCount.restaurants++;
    return this;
  }

  indexDish(dish, restaurantId) {
    const meta = {
      id: dish.id,
      restaurantId,
      name: dish.name,
      type: 'dish',
      price: dish.price,
      category: dish.category,
    };
    this.dishTrie.insert(dish.name, meta);
    dish.name.split(' ').forEach(word => {
      if (word.length > 2) this.dishTrie.insert(word, meta);
    });
    this.indexedCount.dishes++;
    return this;
  }

  /**
   * Unified search across all tries
   */
  search(query, limit = 10) {
    if (!query || query.trim().length < 1) return { restaurants: [], dishes: [], cuisines: [] };

    const restaurants = this.restaurantTrie.autocomplete(query, limit);
    const dishes = this.dishTrie.autocomplete(query, limit);
    const cuisines = this.cuisineTrie.autocomplete(query, 5);

    return {
      restaurants: restaurants.flatMap(r => r.metadata).slice(0, limit),
      dishes: dishes.flatMap(d => d.metadata).slice(0, limit),
      cuisines: cuisines.flatMap(c => c.metadata).slice(0, 5),
      query,
      totalResults: restaurants.length + dishes.length + cuisines.length,
    };
  }

  getStats() {
    return {
      indexed: this.indexedCount,
      totalRestaurantWords: this.restaurantTrie.totalWords,
      totalDishWords: this.dishTrie.totalWords,
    };
  }
}

module.exports = { Trie, FoodSearchEngine };
