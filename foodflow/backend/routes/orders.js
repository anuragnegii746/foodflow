/**
 * Order Routes
 * POST /api/orders          — place new order (enqueued via MinHeap)
 * GET  /api/orders          — list orders
 * GET  /api/orders/:id      — get single order
 * PATCH /api/orders/:id/status — update order status
 * GET  /api/orders/queue    — view dispatch queue (DSA demo)
 * GET  /api/orders/route    — get delivery route for order
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { addOrder, getOrders, getRestaurantById } = require('../models/dataStore');
const { dijkstra } = require('../dsa/Dijkstra');

// GET /api/orders/queue — view MinHeap dispatch queue
router.get('/queue', (req, res) => {
  const { dispatchQueue } = req.dsa;
  res.json({
    ...dispatchQueue.getStats(),
    dsaInfo: {
      algorithm: 'Min-Heap Priority Queue',
      complexity: { insert: 'O(log n)', extractMin: 'O(log n)', peek: 'O(1)' },
      description: 'Orders are dispatched by priority: VIP first, then by shortest estimated delivery time',
    },
  });
});

// POST /api/orders — place new order
router.post('/', (req, res) => {
  const { userId, restaurantId, items, deliveryZone, isVIP } = req.body;

  if (!userId || !restaurantId || !items?.length) {
    return res.status(400).json({ error: 'userId, restaurantId, and items are required' });
  }

  const restaurant = getRestaurantById(restaurantId);
  if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
  if (!restaurant.isOpen) return res.status(400).json({ error: 'Restaurant is currently closed' });

  // Calculate total
  const menuMap = new Map(restaurant.menu.map(d => [d.id, d]));
  let subtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    const dish = menuMap.get(item.dishId);
    if (!dish) return res.status(400).json({ error: `Dish ${item.dishId} not found` });
    const qty = Math.max(1, parseInt(item.quantity) || 1);
    subtotal += dish.price * qty;
    validatedItems.push({ dishId: dish.id, name: dish.name, price: dish.price, quantity: qty });
  }

  const deliveryFee = subtotal < 300 ? 40 : 0;
  const totalAmount = subtotal + deliveryFee;

  if (totalAmount < restaurant.minOrder) {
    return res.status(400).json({
      error: `Minimum order is ₹${restaurant.minOrder}. Your total: ₹${subtotal}`,
    });
  }

  // Compute delivery route via Dijkstra
  const { cityGraph } = req.dsa;
  const from = restaurant.address || 'RestaurantHub';
  const to = deliveryZone || 'CustomerArea';
  const route = dijkstra(cityGraph, from, to);
  const estimatedDeliveryTime = route.reachable
    ? Math.max(restaurant.deliveryTime, route.totalTimeMinutes)
    : restaurant.deliveryTime;

  const order = {
    id: uuidv4(),
    userId,
    restaurantId,
    restaurantName: restaurant.name,
    items: validatedItems,
    subtotal,
    deliveryFee,
    totalAmount,
    status: 'pending',
    estimatedDeliveryTime,
    actualDeliveryTime: null,
    isVIP: isVIP || false,
    deliveryRoute: route,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Add to database
  addOrder(order);

  // Enqueue in MinHeap dispatch queue
  const { dispatchQueue } = req.dsa;
  const queueEntry = dispatchQueue.enqueue(order);

  res.status(201).json({
    order,
    queuePosition: queueEntry,
    deliveryRoute: route,
    message: `Order placed! Estimated delivery: ${estimatedDeliveryTime} mins`,
    dsaUsed: ['Min-Heap (dispatch queue)', "Dijkstra's (delivery route)"],
  });
});

// GET /api/orders — list orders
router.get('/', (req, res) => {
  const { userId, restaurantId, status } = req.query;
  const orders = getOrders({ userId, restaurantId, status });
  res.json({ orders, total: orders.length });
});

// GET /api/orders/:id
router.get('/:id', (req, res) => {
  const orders = getOrders();
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', (req, res) => {
  const { status, actualDeliveryTime } = req.body;
  const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const orders = getOrders();
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.status = status;
  order.updatedAt = new Date().toISOString();
  if (actualDeliveryTime) order.actualDeliveryTime = actualDeliveryTime;

  res.json({ order, message: `Order status updated to: ${status}` });
});

module.exports = router;
