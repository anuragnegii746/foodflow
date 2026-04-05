/**
 * Restaurant Routes
 * GET /api/restaurants         — list all with filters
 * GET /api/restaurants/search  — Trie-powered autocomplete search
 * GET /api/restaurants/:id     — get one (LRU cached)
 * GET /api/restaurants/:id/menu — get menu (LRU cached)
 * GET /api/restaurants/route   — Dijkstra delivery route
 */

const express = require('express');
const router = express.Router();
const { restaurants } = require('../models/dataStore');
const { dijkstra } = require('../dsa/Dijkstra');

// GET /api/restaurants — list with optional filters
router.get('/', (req, res) => {
  const { cuisine, minRating, maxDeliveryTime, isOpen, priceRange } = req.query;

  let result = [...restaurants];

  if (cuisine) result = result.filter(r => r.cuisine.toLowerCase() === cuisine.toLowerCase());
  if (minRating) result = result.filter(r => r.rating >= parseFloat(minRating));
  if (maxDeliveryTime) result = result.filter(r => r.deliveryTime <= parseInt(maxDeliveryTime));
  if (isOpen !== undefined) result = result.filter(r => r.isOpen === (isOpen === 'true'));
  if (priceRange) result = result.filter(r => r.priceRange === priceRange);

  // Remove menu from listing for performance
  const listing = result.map(({ menu, ...r }) => ({ ...r, menuItemCount: menu.length }));

  res.json({ restaurants: listing, total: listing.length, filters: req.query });
});

// GET /api/restaurants/search?q=pizza — Trie autocomplete
router.get('/search', (req, res) => {
  const { q, limit = 10 } = req.query;
  if (!q || q.trim().length === 0) {
    return res.json({ results: [], query: '' });
  }

  const { searchEngine } = req.dsa;
  const results = searchEngine.search(q, parseInt(limit));

  res.json({
    ...results,
    dsaInfo: {
      algorithm: 'Trie (Prefix Tree)',
      complexity: 'O(m + k) where m=prefix length, k=results',
      indexedTerms: searchEngine.getStats(),
    },
  });
});

// GET /api/restaurants/route?from=RestaurantHub&to=CustomerArea
router.get('/route', (req, res) => {
  const { from = 'RestaurantHub', to = 'CustomerArea' } = req.query;
  const { cityGraph } = req.dsa;

  const route = dijkstra(cityGraph, from, to);

  res.json({
    ...route,
    dsaInfo: {
      algorithm: "Dijkstra's Shortest Path",
      complexity: 'O((V + E) log V)',
      graphStats: cityGraph.getStats(),
    },
  });
});

// GET /api/restaurants/:id — single restaurant (LRU cached)
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const { menuCache } = req.dsa;

  // Try cache first
  const cacheKey = `restaurant:${id}`;
  const cached = menuCache.get(cacheKey);
  if (cached) {
    return res.json({ ...cached, _cached: true, cacheStats: menuCache.getStats() });
  }

  const restaurant = restaurants.find(r => r.id === id);
  if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

  menuCache.put(cacheKey, restaurant);
  res.json({ ...restaurant, _cached: false });
});

// GET /api/restaurants/:id/menu — get menu (LRU cached)
router.get('/:id/menu', (req, res) => {
  const { id } = req.params;
  const { menuCache } = req.dsa;
  const { category, isVeg, maxPrice } = req.query;

  const cacheKey = `menu:${id}`;
  let restaurant = menuCache.get(cacheKey);

  if (!restaurant) {
    restaurant = restaurants.find(r => r.id === id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    menuCache.put(cacheKey, restaurant);
  }

  let menu = [...restaurant.menu];
  if (category) menu = menu.filter(d => d.category === category);
  if (isVeg === 'true') menu = menu.filter(d => d.isVeg);
  if (maxPrice) menu = menu.filter(d => d.price <= parseInt(maxPrice));

  const categories = [...new Set(restaurant.menu.map(d => d.category))];

  res.json({
    restaurantId: id,
    restaurantName: restaurant.name,
    menu,
    categories,
    total: menu.length,
    cacheStats: menuCache.getStats(),
  });
});

module.exports = router;
