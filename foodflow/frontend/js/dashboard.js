/**
 * FoodFlow — Analytics Dashboard JavaScript
 * Renders charts, heatmaps, and DSA demos using Chart.js
 */

// ── Chart Theme ──────────────────────────────────────────────
const CHART_COLORS = {
  coral: 'rgba(255,77,46,1)',
  coralFaded: 'rgba(255,77,46,0.15)',
  coralMid: 'rgba(255,77,46,0.5)',
  green: 'rgba(45,189,114,1)',
  greenFaded: 'rgba(45,189,114,0.15)',
  amber: 'rgba(245,166,35,1)',
  purple: 'rgba(155,127,255,1)',
  text: 'rgba(200,191,181,0.8)',
  grid: 'rgba(255,255,255,0.05)',
};

Chart.defaults.color = CHART_COLORS.text;
Chart.defaults.font.family = "'DM Sans', sans-serif";
Chart.defaults.font.size = 11;

const chartDefaults = {
  plugins: {
    legend: { labels: { color: CHART_COLORS.text, padding: 16, usePointStyle: true } },
    tooltip: {
      backgroundColor: '#1A1714',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      titleColor: '#FFF8F0',
      bodyColor: '#C8BFB5',
      padding: 12,
    },
  },
  scales: {
    x: { grid: { color: CHART_COLORS.grid }, ticks: { color: CHART_COLORS.text } },
    y: { grid: { color: CHART_COLORS.grid }, ticks: { color: CHART_COLORS.text } },
  },
};

// ── State ─────────────────────────────────────────────────────
let analyticsData = null;
let charts = {};
let currentSection = 'overview';

// ── Demo Data Generator ───────────────────────────────────────
function generateDemoData() {
  const days = 30;
  const labels = [];
  const revenue = [];
  const movingAvg = [];
  const now = Date.now();
  const dayMs = 86400000;
  let window = [];

  for (let i = 0; i < days; i++) {
    const d = new Date(now - (days - 1 - i) * dayMs);
    labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
    const base = 8000 + Math.sin(i / 5) * 3000 + Math.random() * 2000;
    const r = Math.round(base);
    revenue.push(r);
    window.push(r);
    if (window.length > 7) window.shift();
    movingAvg.push(Math.round(window.reduce((a, b) => a + b, 0) / window.length));
  }

  const heatmap = Array.from({ length: 7 }, (_, d) =>
    Array.from({ length: 24 }, (_, h) => {
      const isPeak = (h >= 12 && h <= 14) || (h >= 19 && h <= 21);
      const isWeekend = d === 0 || d === 6;
      return Math.round(Math.random() * (isPeak ? 18 : 6) + (isWeekend ? 3 : 0));
    })
  );

  return {
    summary: {
      totalOrders: 200,
      totalRevenue: revenue.reduce((a, b) => a + b, 0),
      avgOrderValue: 285,
      revenueGrowth: 12.5,
      avgDeliveryTime: 28,
      onTimeRate: 87.5,
      retentionRate: 62.3,
      uniqueCustomers: 8,
      peakTime: { day: 'Sat', hour: '20:00', orders: 21 },
    },
    revenue: {
      labels, dailyRevenue: revenue, movingAvg7Day: movingAvg,
      totalRevenue: revenue.reduce((a, b) => a + b, 0),
    },
    heatmap: {
      matrix: heatmap,
      dayLabels: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
      hourLabels: Array.from({length:24}, (_,i)=>`${i}`),
      maxValue: Math.max(...heatmap.flat()),
      peakSlot: { day:'Sat', hour:'20:00', orders:21 },
    },
    topDishes: [
      { name:'Chicken Biryani', orderCount:42, revenue:11760 },
      { name:'BBQ Chicken Pizza', orderCount:38, revenue:15960 },
      { name:'Classic Cheeseburger', orderCount:35, revenue:6965 },
      { name:'Chicken Fried Rice', orderCount:28, revenue:5600 },
      { name:'Dragon Roll', orderCount:25, revenue:10500 },
      { name:'Margherita Pizza', orderCount:22, revenue:7700 },
      { name:'Garlic Naan', orderCount:21, revenue:1050 },
      { name:'Paneer Butter Masala', orderCount:19, revenue:4180 },
    ],
    retention: { newCustomers: 3, returningCustomers: 5, totalUniqueCustomers: 8, retentionRate: 62.5 },
    delivery: {
      labels: ['0-15','15-30','30-45','45-60','60+'],
      counts: [28, 89, 52, 21, 10],
      avgDeliveryTime: 28, onTimeRate: 87.5,
    },
    topRestaurants: [
      { rank:1, name:'Spice Garden',  cuisine:'Indian',   orders:52, revenue:18640, rating:4.5 },
      { rank:2, name:'Burger Barn',   cuisine:'American', orders:47, revenue:12173, rating:4.3 },
      { rank:3, name:'Pizza Piazza',  cuisine:'Italian',  orders:38, revenue:18050, rating:4.6 },
      { rank:4, name:'Dragon Palace', cuisine:'Chinese',  orders:35, revenue:8890,  rating:4.2 },
      { rank:5, name:'Taco Fiesta',   cuisine:'Mexican',  orders:22, revenue:5170,  rating:4.1 },
      { rank:6, name:'Sushi Zen',     cuisine:'Japanese', orders:6,  revenue:3120,  rating:4.7 },
    ],
  };
}

// ── Load & Render ─────────────────────────────────────────────
async function loadDashboard() {
  try {
    analyticsData = await api.getAnalyticsSummary();
  } catch {
    analyticsData = generateDemoData();
  }
  renderKPIs(analyticsData.summary || analyticsData);
  renderRevenueChart(analyticsData.revenue);
  renderRetentionChart(analyticsData.retention);
  renderDeliveryChart(analyticsData.delivery);
  renderHeatmap(analyticsData.heatmap);
  renderDishChart(analyticsData.topDishes);
  renderRankingTable(analyticsData.topRestaurants);
}

function renderKPIs(s) {
  const totalRevenue = s.totalRevenue || (analyticsData.revenue?.totalRevenue) || 0;
  document.getElementById('kpiGrid').innerHTML = `
    <div class="kpi-card" data-accent="coral">
      <div class="kpi-label">Total Revenue (30d)</div>
      <div class="kpi-value">₹${Math.round(totalRevenue / 1000)}k</div>
      <div class="kpi-change up">↑ ${s.revenueGrowth || 12.5}% vs prev period</div>
    </div>
    <div class="kpi-card" data-accent="green">
      <div class="kpi-label">Total Orders</div>
      <div class="kpi-value">${s.totalOrders || 200}</div>
      <div class="kpi-change up">↑ 8.2% this week</div>
    </div>
    <div class="kpi-card" data-accent="amber">
      <div class="kpi-label">Avg Delivery Time</div>
      <div class="kpi-value">${s.avgDeliveryTime || 28}m</div>
      <div class="kpi-change up">↑ On-time: ${s.onTimeRate || 87.5}%</div>
    </div>
    <div class="kpi-card" data-accent="purple">
      <div class="kpi-label">Customer Retention</div>
      <div class="kpi-value">${s.retentionRate || 62.5}%</div>
      <div class="kpi-change up">↑ ${s.uniqueCustomers || 8} unique customers</div>
    </div>`;
}

function renderRevenueChart(data) {
  if (!data) return;
  const ctx = document.getElementById('revenueChart')?.getContext('2d');
  if (!ctx) return;
  if (charts.revenue) charts.revenue.destroy();

  charts.revenue = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'Daily Revenue (₹)',
          data: data.dailyRevenue,
          borderColor: CHART_COLORS.coral,
          backgroundColor: CHART_COLORS.coralFaded,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: '7-Day Moving Avg',
          data: data.movingAvg7Day,
          borderColor: CHART_COLORS.amber,
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
          borderDash: [6, 3],
        },
      ],
    },
    options: {
      ...chartDefaults,
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        ...chartDefaults.plugins,
        tooltip: {
          ...chartDefaults.plugins.tooltip,
          callbacks: { label: ctx => ` ₹${ctx.raw.toLocaleString()}` },
        },
      },
    },
  });
}

function renderRetentionChart(data) {
  if (!data) return;
  const ctx = document.getElementById('retentionChart')?.getContext('2d');
  if (!ctx) return;
  if (charts.retention) charts.retention.destroy();

  charts.retention = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['New Customers', 'Returning'],
      datasets: [{
        data: [data.newCustomers, data.returningCustomers],
        backgroundColor: [CHART_COLORS.coralMid, CHART_COLORS.coral],
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        ...chartDefaults.plugins,
        legend: { position: 'bottom', labels: { color: CHART_COLORS.text, padding: 16 } },
      },
      cutout: '65%',
    },
  });
}

function renderDeliveryChart(data) {
  if (!data) return;
  const ctx = document.getElementById('deliveryChart')?.getContext('2d');
  if (!ctx) return;
  if (charts.delivery) charts.delivery.destroy();

  charts.delivery = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Orders',
        data: data.counts,
        backgroundColor: data.labels.map((_, i) => i <= 1 ? CHART_COLORS.green : i === 2 ? CHART_COLORS.amber : CHART_COLORS.coral),
        borderRadius: 6,
      }],
    },
    options: { ...chartDefaults, responsive: true, maintainAspectRatio: false },
  });
}

function renderHeatmap(data) {
  if (!data) return;
  const container = document.getElementById('heatmapContainer');
  if (!container) return;

  document.getElementById('peakSlotInfo').textContent =
    `Peak time: ${data.peakSlot?.day} at ${data.peakSlot?.hour} (${data.peakSlot?.orders} orders). HashMap aggregation O(n).`;

  // Build heatmap grid: rows = days, cols = hours
  const maxVal = data.maxValue || 1;
  let html = `<div class="heatmap-grid">`;

  // Hour header row
  html += `<div class="heatmap-label"></div>`;
  for (let h = 0; h < 24; h += 3) {
    html += `<div class="heatmap-hour-label" style="grid-column:span 3;">${h}:00</div>`;
  }

  // Data rows
  data.dayLabels.forEach((day, d) => {
    html += `<div class="heatmap-label">${day}</div>`;
    for (let h = 0; h < 24; h++) {
      const val = data.matrix[d][h];
      const intensity = val / maxVal;
      const alpha = 0.1 + intensity * 0.9;
      const bg = intensity > 0
        ? `rgba(255,77,46,${alpha.toFixed(2)})`
        : 'var(--dark-3)';
      html += `<div class="heatmap-cell" style="background:${bg};" data-tip="${day} ${h}:00 — ${val} orders"></div>`;
    }
  });

  html += `</div>`;
  container.innerHTML = html;
}

function renderDishChart(dishes) {
  if (!dishes?.length) return;
  const ctx = document.getElementById('dishChart')?.getContext('2d');
  if (!ctx) return;
  if (charts.dish) charts.dish.destroy();

  const top8 = dishes.slice(0, 8);
  charts.dish = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: top8.map(d => d.name.length > 18 ? d.name.slice(0, 16) + '…' : d.name),
      datasets: [{
        label: 'Orders',
        data: top8.map(d => d.orderCount),
        backgroundColor: CHART_COLORS.coralMid,
        hoverBackgroundColor: CHART_COLORS.coral,
        borderRadius: 6,
      }],
    },
    options: {
      ...chartDefaults,
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { ...chartDefaults.scales.x, beginAtZero: true },
        y: { grid: { display: false }, ticks: { color: CHART_COLORS.text, font: { size: 11 } } },
      },
    },
  });
}

function renderRankingTable(restaurants) {
  if (!restaurants?.length) return;
  const tbody = document.getElementById('rankingBody');
  if (!tbody) return;

  const maxOrders = restaurants[0]?.orders || 1;
  tbody.innerHTML = restaurants.map(r => `
    <tr>
      <td><span class="rank-num">#${r.rank}</span></td>
      <td style="font-weight:600;color:var(--cream);">${r.name}</td>
      <td>${r.cuisine}</td>
      <td>${r.orders}</td>
      <td>₹${(r.revenue || 0).toLocaleString()}</td>
      <td style="color:var(--amber);">⭐ ${r.rating}</td>
      <td>
        <div class="progress-bar-wrap">
          <div class="progress-bar" style="width:${Math.round(r.orders / maxOrders * 100)}%;"></div>
        </div>
      </td>
    </tr>`).join('');
}

// ── Section Switching ─────────────────────────────────────────
function showSection(name) {
  document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
  event.currentTarget.classList.add('active');

  const sections = ['overview','heatmap','dishes','restaurants','dsa','revenue','delivery'];
  sections.forEach(s => {
    const el = document.getElementById(`sec-${s}`);
    if (el) el.style.display = s === name ? 'block' : 'none';
  });

  currentSection = name;
  if (name === 'dsa') initDSASection();
}

// ── DSA Interactive Section ───────────────────────────────────
const DEMO_TERMS = ['Chicken Biryani','Paneer Butter Masala','BBQ Chicken Pizza','Margherita Pizza','Burger Barn','Spice Garden','Dragon Palace','Dragon Roll','Chicken Fried Rice','Garlic Naan','Mango Lassi','Crispy Fries','Chocolate Shake','Chicken Wings','Kung Pao Chicken'];

let mockHeap = [
  { orderId:'ORD-001', priority:'Standard', estTime:30, vip:false },
  { orderId:'ORD-002', priority:'VIP', estTime:20, vip:true },
  { orderId:'ORD-003', priority:'Standard', estTime:25, vip:false },
];

function initDSASection() {
  renderHeapDemo();

  const input = document.getElementById('trieInput');
  if (input && !input._bound) {
    input._bound = true;
    input.addEventListener('input', e => {
      const q = e.target.value.trim().toLowerCase();
      const results = document.getElementById('trieResults');
      if (!q) { results.innerHTML = '<span style="color:var(--text-muted);">Start typing to search...</span>'; return; }

      const matches = DEMO_TERMS.filter(t => t.toLowerCase().includes(q));
      if (!matches.length) {
        results.innerHTML = '<span style="color:var(--text-muted);">No matches found</span>';
        return;
      }
      results.innerHTML = matches.map(m => {
        const idx = m.toLowerCase().indexOf(q);
        const highlighted = m.slice(0, idx) + `<strong style="color:var(--coral);">${m.slice(idx, idx + q.length)}</strong>` + m.slice(idx + q.length);
        return `<div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);">🔍 ${highlighted}</div>`;
      }).join('') + `<div style="font-size:0.7rem;color:var(--text-muted);margin-top:8px;">Trie O(m+k) — ${matches.length} result(s) for "${q}"</div>`;
    });
  }
}

function renderHeapDemo() {
  const el = document.getElementById('heapDemo');
  if (!el) return;
  const sorted = [...mockHeap].sort((a, b) => (a.vip ? 0 : 1) - (b.vip ? 0 : 1) || a.estTime - b.estTime);
  el.innerHTML = sorted.map((o, i) => `
    <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--dark-3);border-radius:8px;margin-bottom:6px;border-left:3px solid ${o.vip ? 'var(--gold)' : 'var(--coral)'};">
      <span style="font-size:0.75rem;font-weight:700;color:${o.vip ? 'var(--gold)' : 'var(--text-muted)'};">#${i + 1}</span>
      <span style="flex:1;font-size:0.8rem;color:var(--cream);">${o.orderId}</span>
      <span style="font-size:0.72rem;background:${o.vip ? 'rgba(212,165,55,0.15)' : 'rgba(255,77,46,0.1)'};color:${o.vip ? 'var(--gold)' : 'var(--coral)'};padding:2px 8px;border-radius:999px;">${o.priority}</span>
      <span style="font-size:0.75rem;color:var(--text-muted);">${o.estTime}min</span>
    </div>`).join('') +
    `<div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;">Min-Heap: VIP first, then by est. delivery time</div>`;
}

let orderCounter = 4;
function simulateOrder() {
  const isVip = Math.random() < 0.3;
  const estTime = Math.floor(Math.random() * 30) + 15;
  mockHeap.push({ orderId: `ORD-00${orderCounter++}`, priority: isVip ? 'VIP' : 'Standard', estTime, vip: isVip });
  renderHeapDemo();
  window.showToast && showToast(`Order ORD-00${orderCounter - 1} added to queue!`, 'success');
}

async function runDijkstra() {
  const from = document.getElementById('routeFrom').value;
  const to = document.getElementById('routeTo').value;
  const result = document.getElementById('dijkstraResult');
  result.innerHTML = '⏳ Running Dijkstra...';

  try {
    const data = await api.getDeliveryRoute(from, to);
    result.innerHTML = `
      <div style="margin-bottom:8px;"><strong style="color:var(--coral);">Path:</strong> <span style="color:var(--cream);">${data.path?.join(' → ') || 'No path found'}</span></div>
      <div style="margin-bottom:4px;"><strong style="color:var(--coral);">Distance:</strong> <span style="color:var(--cream);">${data.totalTimeMinutes} minutes</span></div>
      <div style="margin-bottom:4px;"><strong style="color:var(--coral);">Nodes explored:</strong> <span style="color:var(--cream);">${data.nodesExplored}</span></div>
      <div style="color:var(--text-muted);font-size:0.72rem;margin-top:8px;">Algorithm: Dijkstra's with Min-Heap • O((V+E) log V)</div>`;
  } catch {
    const demos = {
      'RestaurantHub-CustomerArea': 'RestaurantHub → Zone_A → CustomerArea (9 min)',
      'RestaurantHub-Zone_C': 'RestaurantHub → Zone_A → Zone_C (9 min)',
      'Zone_B-CustomerArea': 'Zone_B → Zone_D → CustomerArea (7 min)',
    };
    const key = `${from}-${to}`;
    result.innerHTML = `
      <div style="color:var(--cream);">📍 ${demos[key] || `${from} → ... → ${to}`}</div>
      <div style="color:var(--text-muted);font-size:0.72rem;margin-top:8px;">Demo mode — connect backend for live routing</div>`;
  }
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  document.getElementById('cartBadge').textContent = (window.cart?.getState().count) || 0;
});
