/**
 * In-Memory Data Store
 * Acts as the database for the demo. Replace with MongoDB/PostgreSQL for production.
 */

const { v4: uuidv4 } = require('uuid');

// ── Sample Restaurants ────────────────────────────────────────────────────────
const restaurants = [
  {
    id: 'rest_001', name: 'Spice Garden', cuisine: 'Indian', rating: 4.5,
    deliveryTime: 30, minOrder: 150, priceRange: '$$', isOpen: true,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
    address: 'Zone_A', lat: 19.076, lng: 72.877,
    tags: ['Biryani', 'Curry', 'North Indian'],
    menu: [
      { id: 'd001', name: 'Chicken Biryani', price: 280, category: 'Main Course', rating: 4.7, isVeg: false, image: '🍛' },
      { id: 'd002', name: 'Paneer Butter Masala', price: 220, category: 'Main Course', rating: 4.5, isVeg: true, image: '🧆' },
      { id: 'd003', name: 'Garlic Naan', price: 50, category: 'Breads', rating: 4.3, isVeg: true, image: '🫓' },
      { id: 'd004', name: 'Dal Makhani', price: 180, category: 'Main Course', rating: 4.4, isVeg: true, image: '🍲' },
      { id: 'd005', name: 'Mango Lassi', price: 80, category: 'Beverages', rating: 4.6, isVeg: true, image: '🥤' },
    ],
  },
  {
    id: 'rest_002', name: 'Dragon Palace', cuisine: 'Chinese', rating: 4.2,
    deliveryTime: 25, minOrder: 200, priceRange: '$$', isOpen: true,
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400',
    address: 'Zone_B', lat: 19.082, lng: 72.865,
    tags: ['Noodles', 'Dim Sum', 'Fried Rice'],
    menu: [
      { id: 'd011', name: 'Chicken Fried Rice', price: 200, category: 'Rice', rating: 4.3, isVeg: false, image: '🍳' },
      { id: 'd012', name: 'Veg Hakka Noodles', price: 180, category: 'Noodles', rating: 4.1, isVeg: true, image: '🍜' },
      { id: 'd013', name: 'Kung Pao Chicken', price: 320, category: 'Main Course', rating: 4.5, isVeg: false, image: '🐔' },
      { id: 'd014', name: 'Spring Rolls (6pc)', price: 150, category: 'Starters', rating: 4.2, isVeg: true, image: '🥟' },
      { id: 'd015', name: 'Hot & Sour Soup', price: 120, category: 'Soups', rating: 4.0, isVeg: false, image: '🍵' },
    ],
  },
  {
    id: 'rest_003', name: 'Pizza Piazza', cuisine: 'Italian', rating: 4.6,
    deliveryTime: 35, minOrder: 300, priceRange: '$$$', isOpen: true,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
    address: 'Zone_C', lat: 19.071, lng: 72.889,
    tags: ['Pizza', 'Pasta', 'Burgers'],
    menu: [
      { id: 'd021', name: 'Margherita Pizza', price: 350, category: 'Pizza', rating: 4.7, isVeg: true, image: '🍕' },
      { id: 'd022', name: 'BBQ Chicken Pizza', price: 420, category: 'Pizza', rating: 4.8, isVeg: false, image: '🍕' },
      { id: 'd023', name: 'Penne Arrabbiata', price: 280, category: 'Pasta', rating: 4.4, isVeg: true, image: '🍝' },
      { id: 'd024', name: 'Garlic Bread', price: 120, category: 'Sides', rating: 4.5, isVeg: true, image: '🥖' },
      { id: 'd025', name: 'Tiramisu', price: 180, category: 'Desserts', rating: 4.9, isVeg: true, image: '🍮' },
    ],
  },
  {
    id: 'rest_004', name: 'Burger Barn', cuisine: 'American', rating: 4.3,
    deliveryTime: 20, minOrder: 100, priceRange: '$', isOpen: true,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    address: 'Zone_A', lat: 19.078, lng: 72.875,
    tags: ['Burgers', 'Fries', 'Shakes'],
    menu: [
      { id: 'd031', name: 'Classic Cheeseburger', price: 199, category: 'Burgers', rating: 4.4, isVeg: false, image: '🍔' },
      { id: 'd032', name: 'Veggie Delight Burger', price: 169, category: 'Burgers', rating: 4.2, isVeg: true, image: '🍔' },
      { id: 'd033', name: 'Crispy Fries (L)', price: 89, category: 'Sides', rating: 4.5, isVeg: true, image: '🍟' },
      { id: 'd034', name: 'Chocolate Shake', price: 129, category: 'Beverages', rating: 4.6, isVeg: true, image: '🥤' },
      { id: 'd035', name: 'Chicken Wings (8pc)', price: 249, category: 'Starters', rating: 4.3, isVeg: false, image: '🍗' },
    ],
  },
  {
    id: 'rest_005', name: 'Sushi Zen', cuisine: 'Japanese', rating: 4.7,
    deliveryTime: 40, minOrder: 400, priceRange: '$$$', isOpen: false,
    image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400',
    address: 'Zone_E', lat: 19.065, lng: 72.895,
    tags: ['Sushi', 'Ramen', 'Tempura'],
    menu: [
      { id: 'd041', name: 'Salmon Nigiri (2pc)', price: 280, category: 'Sushi', rating: 4.8, isVeg: false, image: '🍣' },
      { id: 'd042', name: 'Dragon Roll', price: 420, category: 'Sushi', rating: 4.9, isVeg: false, image: '🍱' },
      { id: 'd043', name: 'Chicken Ramen', price: 380, category: 'Noodles', rating: 4.7, isVeg: false, image: '🍜' },
      { id: 'd044', name: 'Tempura Platter', price: 350, category: 'Starters', rating: 4.6, isVeg: false, image: '🦐' },
      { id: 'd045', name: 'Miso Soup', price: 120, category: 'Soups', rating: 4.4, isVeg: true, image: '🥣' },
    ],
  },
  {
    id: 'rest_006', name: 'Taco Fiesta', cuisine: 'Mexican', rating: 4.1,
    deliveryTime: 28, minOrder: 180, priceRange: '$$', isOpen: true,
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',
    address: 'Zone_D', lat: 19.074, lng: 72.882,
    tags: ['Tacos', 'Burritos', 'Nachos'],
    menu: [
      { id: 'd051', name: 'Chicken Tacos (3pc)', price: 220, category: 'Tacos', rating: 4.2, isVeg: false, image: '🌮' },
      { id: 'd052', name: 'Bean & Cheese Burrito', price: 190, category: 'Burritos', rating: 4.0, isVeg: true, image: '🌯' },
      { id: 'd053', name: 'Loaded Nachos', price: 250, category: 'Starters', rating: 4.3, isVeg: true, image: '🫔' },
      { id: 'd054', name: 'Guacamole & Chips', price: 150, category: 'Starters', rating: 4.1, isVeg: true, image: '🥑' },
      { id: 'd055', name: 'Horchata', price: 90, category: 'Beverages', rating: 4.0, isVeg: true, image: '🥛' },
    ],
  },
];

// ── Sample Orders (for analytics) ────────────────────────────────────────────
function generateSampleOrders() {
  const orders = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const userIds = ['u001', 'u002', 'u003', 'u004', 'u005', 'u006', 'u007', 'u008'];
  const statuses = ['delivered', 'delivered', 'delivered', 'cancelled', 'delivered'];

  for (let i = 0; i < 200; i++) {
    const restaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
    const item = restaurant.menu[Math.floor(Math.random() * restaurant.menu.length)];
    const qty = Math.floor(Math.random() * 3) + 1;
    const daysAgo = Math.random() * 30;
    const hour = Math.floor(Math.random() * 24);
    const date = new Date(now - daysAgo * dayMs);
    date.setHours(hour);

    orders.push({
      id: uuidv4(),
      userId: userIds[Math.floor(Math.random() * userIds.length)],
      restaurantId: restaurant.id,
      items: [{ dishId: item.id, name: item.name, price: item.price, quantity: qty }],
      totalAmount: item.price * qty + 30, // + delivery fee
      status: statuses[Math.floor(Math.random() * statuses.length)],
      actualDeliveryTime: Math.floor(Math.random() * 60) + 10,
      estimatedDeliveryTime: restaurant.deliveryTime,
      createdAt: date.toISOString(),
      isVIP: Math.random() < 0.1,
    });
  }
  return orders;
}

// ── Users ─────────────────────────────────────────────────────────────────────
const users = [
  { id: 'u001', name: 'Arjun Sharma', email: 'arjun@example.com', password: '$2a$10$hash', phone: '+91-9876543210', addresses: ['Zone_A'] },
  { id: 'u002', name: 'Priya Patel', email: 'priya@example.com', password: '$2a$10$hash', phone: '+91-9876543211', addresses: ['Zone_C'] },
];

// Live order store (in memory)
let liveOrders = generateSampleOrders();
const historicalOrders = [...liveOrders];

function addOrder(order) {
  liveOrders.push(order);
  historicalOrders.push(order);
}

function getOrders(filters = {}) {
  let result = [...liveOrders];
  if (filters.userId) result = result.filter(o => o.userId === filters.userId);
  if (filters.restaurantId) result = result.filter(o => o.restaurantId === filters.restaurantId);
  if (filters.status) result = result.filter(o => o.status === filters.status);
  return result;
}

function getRestaurantById(id) {
  return restaurants.find(r => r.id === id) || null;
}

function getUserById(id) {
  return users.find(u => u.id === id) || null;
}

module.exports = {
  restaurants,
  users,
  liveOrders,
  historicalOrders,
  addOrder,
  getOrders,
  getRestaurantById,
  getUserById,
};
