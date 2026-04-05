/**
 * Analytics Routes
 * GET /api/analytics/summary    — all analytics in one call
 * GET /api/analytics/heatmap    — order heatmap (day x hour)
 * GET /api/analytics/revenue    — revenue trend + moving average
 * GET /api/analytics/dishes     — top dishes ranking
 * GET /api/analytics/delivery   — delivery time distribution
 * GET /api/analytics/customers  — customer retention metrics
 * GET /api/analytics/restaurants — restaurant performance ranking
 */

const express = require('express');
const router = express.Router();
const { historicalOrders, restaurants } = require('../models/dataStore');
const {
  computeOrderHeatmap,
  computeRevenueAnalytics,
  computeTopDishes,
  computeCustomerRetention,
  computeDeliveryDistribution,
  computeRestaurantRankings,
} = require('../analytics/orderAnalytics');

// GET /api/analytics/summary
router.get('/summary', (req, res) => {
  const orders = historicalOrders;
  const revenue = computeRevenueAnalytics(orders);
  const heatmap = computeOrderHeatmap(orders);
  const topDishes = computeTopDishes(orders, 5);
  const retention = computeCustomerRetention(orders);
  const delivery = computeDeliveryDistribution(orders);
  const rankings = computeRestaurantRankings(orders, restaurants).slice(0, 5);

  res.json({
    summary: {
      totalOrders: orders.length,
      totalRevenue: revenue.totalRevenue,
      avgOrderValue: revenue.avgOrderValue,
      revenueGrowth: revenue.revenueGrowth,
      avgDeliveryTime: delivery.avgDeliveryTime,
      onTimeRate: delivery.onTimeRate,
      retentionRate: retention.retentionRate,
      uniqueCustomers: retention.totalUniqueCustomers,
      peakTime: heatmap.peakSlot,
    },
    heatmap,
    revenue,
    topDishes,
    retention,
    delivery,
    topRestaurants: rankings,
    generatedAt: new Date().toISOString(),
  });
});

router.get('/heatmap', (req, res) => {
  res.json(computeOrderHeatmap(historicalOrders));
});

router.get('/revenue', (req, res) => {
  const days = parseInt(req.query.days) || 30;
  res.json(computeRevenueAnalytics(historicalOrders, days));
});

router.get('/dishes', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  res.json({ topDishes: computeTopDishes(historicalOrders, limit) });
});

router.get('/customers', (req, res) => {
  res.json(computeCustomerRetention(historicalOrders));
});

router.get('/delivery', (req, res) => {
  res.json(computeDeliveryDistribution(historicalOrders));
});

router.get('/restaurants', (req, res) => {
  res.json({ rankings: computeRestaurantRankings(historicalOrders, restaurants) });
});

module.exports = router;
