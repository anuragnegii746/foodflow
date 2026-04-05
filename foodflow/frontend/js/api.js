/**
 * FoodFlow API Client
 * Centralized fetch wrapper for all backend API calls
 */

const API_BASE = 'https://foodflow-vfqm.onrender.com/api';

class ApiClient {
  constructor(base = API_BASE) {
    this.base = base;
    this.defaultHeaders = { 'Content-Type': 'application/json' };
  }

  async _fetch(path, options = {}) {
    const url = `${this.base}${path}`;
    try {
      const res = await fetch(url, {
        ...options,
        headers: { ...this.defaultHeaders, ...options.headers },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.error(`API error [${path}]:`, err.message);
      throw err;
    }
  }

  // ── Restaurants ────────────────────────────────────────────
  getRestaurants(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this._fetch(`/restaurants${params ? '?' + params : ''}`);
  }

  searchRestaurants(query, limit = 10) {
    return this._fetch(`/restaurants/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  getRestaurant(id) {
    return this._fetch(`/restaurants/${id}`);
  }

  getMenu(id, filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this._fetch(`/restaurants/${id}/menu${params ? '?' + params : ''}`);
  }

  getDeliveryRoute(from, to) {
    return this._fetch(`/restaurants/route?from=${from}&to=${to}`);
  }

  // ── Orders ─────────────────────────────────────────────────
  placeOrder(orderData) {
    return this._fetch('/orders', { method: 'POST', body: JSON.stringify(orderData) });
  }

  getOrders(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this._fetch(`/orders${params ? '?' + params : ''}`);
  }

  getOrder(id) {
    return this._fetch(`/orders/${id}`);
  }

  getOrderQueue() {
    return this._fetch('/orders/queue');
  }

  updateOrderStatus(id, status, actualDeliveryTime) {
    return this._fetch(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, actualDeliveryTime }),
    });
  }

  // ── Analytics ──────────────────────────────────────────────
  getAnalyticsSummary() {
    return this._fetch('/analytics/summary');
  }

  getRevenueAnalytics(days = 30) {
    return this._fetch(`/analytics/revenue?days=${days}`);
  }

  getHeatmap() {
    return this._fetch('/analytics/heatmap');
  }

  getTopDishes(limit = 10) {
    return this._fetch(`/analytics/dishes?limit=${limit}`);
  }

  getDeliveryDistribution() {
    return this._fetch('/analytics/delivery');
  }

  getRestaurantRankings() {
    return this._fetch('/analytics/restaurants');
  }

  // ── Chatbot ────────────────────────────────────────────────
  sendChatMessage(message, conversationHistory = [], userId = null) {
    return this._fetch('/chatbot/message', {
      method: 'POST',
      body: JSON.stringify({ message, conversationHistory, userId }),
    });
  }

  // ── DSA Demo ───────────────────────────────────────────────
  getDSADemo() {
    return this._fetch('/dsa/demo');
  }

  getHealth() {
    return this._fetch('/health');
  }
}

// Singleton instance
window.api = new ApiClient();

// ── Cart State (Hash Map for O(1) operations) ─────────────────
class CartManager {
  constructor() {
    this.items = new Map();       // dishId -> { dish, quantity }
    this.restaurantId = null;
    this.restaurantName = '';
    this._listeners = [];
    this._loadFromStorage();
  }

  subscribe(fn) { this._listeners.push(fn); }
  _notify() { this._listeners.forEach(fn => fn(this.getState())); }

  addItem(dish, restaurantId, restaurantName) {
    if (this.restaurantId && this.restaurantId !== restaurantId) {
      if (!confirm('Adding items from a different restaurant will clear your cart. Continue?')) return false;
      this.clear();
    }
    this.restaurantId = restaurantId;
    this.restaurantName = restaurantName;

    const existing = this.items.get(dish.id);
    if (existing) {
      existing.quantity++;
    } else {
      this.items.set(dish.id, { dish, quantity: 1 });
    }
    this._saveToStorage();
    this._notify();
    return true;
  }

  removeItem(dishId) {
    const item = this.items.get(dishId);
    if (!item) return;
    if (item.quantity > 1) {
      item.quantity--;
    } else {
      this.items.delete(dishId);
      if (this.items.size === 0) this.restaurantId = null;
    }
    this._saveToStorage();
    this._notify();
  }

  deleteItem(dishId) {
    this.items.delete(dishId);
    if (this.items.size === 0) this.restaurantId = null;
    this._saveToStorage();
    this._notify();
  }

  clear() {
    this.items.clear();
    this.restaurantId = null;
    this.restaurantName = '';
    this._saveToStorage();
    this._notify();
  }

  getState() {
    const itemsArray = [...this.items.values()];
    const subtotal = itemsArray.reduce((sum, { dish, quantity }) => sum + dish.price * quantity, 0);
    const deliveryFee = subtotal > 0 && subtotal < 300 ? 40 : 0;
    return {
      items: itemsArray,
      count: itemsArray.reduce((sum, { quantity }) => sum + quantity, 0),
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      restaurantId: this.restaurantId,
      restaurantName: this.restaurantName,
    };
  }

  _saveToStorage() {
    try {
      const state = { items: [...this.items.entries()], restaurantId: this.restaurantId, restaurantName: this.restaurantName };
      sessionStorage.setItem('foodflow_cart', JSON.stringify(state));
    } catch {}
  }

  _loadFromStorage() {
    try {
      const saved = JSON.parse(sessionStorage.getItem('foodflow_cart') || '{}');
      if (saved.items) {
        this.items = new Map(saved.items);
        this.restaurantId = saved.restaurantId;
        this.restaurantName = saved.restaurantName;
      }
    } catch {}
  }
}

window.cart = new CartManager();

// ── Toast Utility ────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = '300ms';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

window.showToast = showToast;
