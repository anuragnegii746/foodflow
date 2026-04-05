/**
 * FoodFlow Backend Server
 * Express.js REST API with DSA-powered features
 */
require("dotenv").config();
const express = require('express');
const cors = require('cors');

const restaurantRoutes = require('./routes/restaurants');
const orderRoutes = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics');
const chatbotRoutes = require('./routes/chatbot');

// ── Initialize DSA structures on startup ─────────────────────────────────────
const { FoodSearchEngine } = require('./dsa/Trie');
const { LRUCache } = require('./dsa/LRUCache');
const { OrderDispatchQueue } = require('./dsa/MinHeap');
const { buildCityGraph } = require('./dsa/Dijkstra');
const { restaurants } = require('./models/dataStore');

// Global DSA instances (shared across routes)
const searchEngine = new FoodSearchEngine();
const menuCache = new LRUCache(50, 5 * 60 * 1000);   // 50 items, 5 min TTL
const dispatchQueue = new OrderDispatchQueue();
const cityGraph = buildCityGraph();

// Index all restaurants and dishes into Trie
restaurants.forEach(restaurant => {
  searchEngine.indexRestaurant(restaurant);
  restaurant.menu.forEach(dish => searchEngine.indexDish(dish, restaurant.id));
});

console.log(`✅ Trie indexed: ${searchEngine.getStats().indexed.restaurants} restaurants, ${searchEngine.getStats().indexed.dishes} dishes`);
console.log(`✅ City graph: ${cityGraph.getStats().nodes} nodes, ${cityGraph.getStats().edges} edges`);
console.log(`✅ LRU Cache ready: capacity ${menuCache.capacity}`);
console.log(`✅ Order dispatch queue ready`);

// ── Express App ───────────────────────────────────────────────────────────────
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach DSA instances to every request
app.use((req, res, next) => {
  req.dsa = { searchEngine, menuCache, dispatchQueue, cityGraph };
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chatbot', chatbotRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    dsa: {
      searchEngine: searchEngine.getStats(),
      cache: menuCache.getStats(),
      dispatchQueue: dispatchQueue.getStats(),
      cityGraph: cityGraph.getStats(),
    },
  });
});

// ── DSA Demo endpoints ────────────────────────────────────────────────────────
app.get('/api/dsa/demo', (req, res) => {
  const { dijkstra } = require('./dsa/Dijkstra');
  const route = dijkstra(cityGraph, 'RestaurantHub', 'CustomerArea');

  res.json({
    message: 'Live DSA structures',
    trie: searchEngine.getStats(),
    lruCache: menuCache.getStats(),
    orderQueue: dispatchQueue.getStats(),
    dijkstraDemo: {
      description: 'Shortest delivery path from RestaurantHub to CustomerArea',
      ...route,
    },
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🍔 FoodFlow API running at http://localhost:${PORT}`);
  console.log(`📊 Analytics:  GET /api/analytics/summary`);
  console.log(`🔍 Search:     GET /api/restaurants/search?q=pizza`);
  console.log(`🗺  Route:      GET /api/orders/route?from=RestaurantHub&to=CustomerArea`);
  console.log(`🤖 Chatbot:    POST /api/chatbot/message`);
  console.log(`💡 DSA Demo:   GET /api/dsa/demo\n`);
});

module.exports = app;
