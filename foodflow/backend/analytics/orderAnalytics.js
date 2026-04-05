/**
 * Data Analytics Module
 * Provides: order trends, revenue analysis, heatmaps, customer metrics
 * DSA used: sorting, hash maps, sliding window, running averages
 */

/**
 * QuickSort implementation for ranking (used internally)
 * Time: O(n log n) average, O(n²) worst
 */
function quickSort(arr, comparator, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pi = partition(arr, comparator, low, high);
    quickSort(arr, comparator, low, pi - 1);
    quickSort(arr, comparator, pi + 1, high);
  }
  return arr;
}

function partition(arr, comparator, low, high) {
  const pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j++) {
    if (comparator(arr[j], pivot) <= 0) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}

/**
 * Sliding Window — Moving average for revenue trend
 * O(n) time, O(k) space where k = window size
 */
function movingAverage(data, windowSize) {
  const result = [];
  let windowSum = 0;
  const window = [];

  for (let i = 0; i < data.length; i++) {
    window.push(data[i]);
    windowSum += data[i];

    if (window.length > windowSize) {
      windowSum -= window.shift();
    }
    result.push(Number((windowSum / window.length).toFixed(2)));
  }
  return result;
}

/**
 * Order Heatmap — orders by day of week × hour of day
 * Returns 7x24 matrix
 */
function computeOrderHeatmap(orders) {
  const heatmap = Array.from({ length: 7 }, () => new Array(24).fill(0));
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (const order of orders) {
    const date = new Date(order.createdAt);
    const day = date.getDay();
    const hour = date.getHours();
    heatmap[day][hour]++;
  }

  return {
    matrix: heatmap,
    dayLabels: days,
    hourLabels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    maxValue: Math.max(...heatmap.flat()),
    peakSlot: findPeakSlot(heatmap, days),
  };
}

function findPeakSlot(matrix, days) {
  let max = 0, peakDay = 0, peakHour = 0;
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      if (matrix[d][h] > max) {
        max = matrix[d][h];
        peakDay = d;
        peakHour = h;
      }
    }
  }
  return { day: days[peakDay], hour: `${peakHour}:00`, orders: max };
}

/**
 * Revenue Analytics — daily revenue with 7-day moving average
 */
function computeRevenueAnalytics(orders, days = 30) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const dailyRevenue = new Array(days).fill(0);
  const dailyOrderCount = new Array(days).fill(0);

  for (const order of orders) {
    const daysAgo = Math.floor((now - new Date(order.createdAt).getTime()) / dayMs);
    if (daysAgo < days && order.status !== 'cancelled') {
      dailyRevenue[days - 1 - daysAgo] += order.totalAmount;
      dailyOrderCount[days - 1 - daysAgo]++;
    }
  }

  const labels = Array.from({ length: days }, (_, i) => {
    const d = new Date(now - (days - 1 - i) * dayMs);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  const totalRevenue = dailyRevenue.reduce((a, b) => a + b, 0);
  const totalOrders = dailyOrderCount.reduce((a, b) => a + b, 0);

  return {
    labels,
    dailyRevenue: dailyRevenue.map(v => Math.round(v)),
    movingAvg7Day: movingAverage(dailyRevenue, 7).map(v => Math.round(v)),
    dailyOrderCount,
    totalRevenue: Math.round(totalRevenue),
    totalOrders,
    avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
    revenueGrowth: computeGrowth(dailyRevenue),
  };
}

function computeGrowth(dailyRevenue) {
  const half = Math.floor(dailyRevenue.length / 2);
  const firstHalf = dailyRevenue.slice(0, half).reduce((a, b) => a + b, 0);
  const secondHalf = dailyRevenue.slice(half).reduce((a, b) => a + b, 0);
  if (firstHalf === 0) return 0;
  return Number(((secondHalf - firstHalf) / firstHalf * 100).toFixed(1));
}

/**
 * Top Dishes — ranked by order frequency
 * Uses HashMap to count, then QuickSort to rank
 */
function computeTopDishes(orders, limit = 10) {
  const dishCount = new Map();
  const dishRevenue = new Map();

  for (const order of orders) {
    if (!order.items) continue;
    for (const item of order.items) {
      const key = item.dishId || item.name;
      dishCount.set(key, (dishCount.get(key) || 0) + item.quantity);
      dishRevenue.set(key, (dishRevenue.get(key) || 0) + item.price * item.quantity);
    }
  }

  const dishes = [...dishCount.entries()].map(([id, count]) => ({
    id,
    name: id,
    orderCount: count,
    revenue: Math.round(dishRevenue.get(id) || 0),
  }));

  quickSort(dishes, (a, b) => b.orderCount - a.orderCount);
  return dishes.slice(0, limit);
}

/**
 * Customer Retention — new vs returning
 */
function computeCustomerRetention(orders) {
  const customerOrders = new Map();

  for (const order of orders) {
    const uid = order.userId;
    if (!customerOrders.has(uid)) customerOrders.set(uid, 0);
    customerOrders.set(uid, customerOrders.get(uid) + 1);
  }

  let newCustomers = 0, returningCustomers = 0;
  for (const [, count] of customerOrders) {
    if (count === 1) newCustomers++;
    else returningCustomers++;
  }

  const total = newCustomers + returningCustomers;
  return {
    newCustomers,
    returningCustomers,
    totalUniqueCustomers: total,
    retentionRate: total > 0 ? Number((returningCustomers / total * 100).toFixed(1)) : 0,
  };
}

/**
 * Delivery Time Distribution — histogram buckets
 */
function computeDeliveryDistribution(orders) {
  const buckets = { '0-15': 0, '15-30': 0, '30-45': 0, '45-60': 0, '60+': 0 };
  let total = 0, sum = 0;

  for (const order of orders) {
    if (order.actualDeliveryTime) {
      const t = order.actualDeliveryTime;
      sum += t;
      total++;
      if (t <= 15) buckets['0-15']++;
      else if (t <= 30) buckets['15-30']++;
      else if (t <= 45) buckets['30-45']++;
      else if (t <= 60) buckets['45-60']++;
      else buckets['60+']++;
    }
  }

  return {
    buckets,
    labels: Object.keys(buckets),
    counts: Object.values(buckets),
    avgDeliveryTime: total > 0 ? Math.round(sum / total) : 0,
    onTimeRate: total > 0 ? Number(((buckets['0-15'] + buckets['15-30']) / total * 100).toFixed(1)) : 0,
  };
}

/**
 * Restaurant Performance Rankings
 */
function computeRestaurantRankings(orders, restaurants) {
  const stats = new Map(restaurants.map(r => [r.id, {
    id: r.id, name: r.name, cuisine: r.cuisine,
    orders: 0, revenue: 0, rating: r.rating,
  }]));

  for (const order of orders) {
    if (stats.has(order.restaurantId)) {
      const s = stats.get(order.restaurantId);
      s.orders++;
      s.revenue += order.totalAmount || 0;
    }
  }

  const ranked = [...stats.values()];
  quickSort(ranked, (a, b) => b.orders - a.orders);

  return ranked.map((r, i) => ({ ...r, rank: i + 1, revenue: Math.round(r.revenue) }));
}

module.exports = {
  computeOrderHeatmap,
  computeRevenueAnalytics,
  computeTopDishes,
  computeCustomerRetention,
  computeDeliveryDistribution,
  computeRestaurantRankings,
  movingAverage,
  quickSort,
};
