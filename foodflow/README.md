# 🍔 FoodFlow — Zomato-style Food Ordering Platform

A full-stack food ordering web application inspired by Zomato, featuring:
- **DSA-powered backend** (Dijkstra's shortest path, Min-Heap priority queue, Trie autocomplete, LRU Cache)
- **Data Analytics dashboard** (order trends, revenue charts, heatmaps)
- **AI Chatbot** powered by Claude API for food recommendations
- Clean REST API backend with Express.js
- Responsive, modern frontend with real-time updates

---

## 📁 Project Structure

```
foodflow/
├── README.md
├── backend/
│   ├── server.js               # Express server entry point
│   ├── package.json
│   ├── routes/
│   │   ├── restaurants.js      # Restaurant CRUD routes
│   │   ├── orders.js           # Order management routes
│   │   ├── users.js            # User auth & profile routes
│   │   └── analytics.js        # Analytics data routes
│   ├── models/
│   │   ├── Restaurant.js       # Restaurant data model
│   │   ├── Order.js            # Order data model
│   │   └── User.js             # User data model
│   ├── dsa/
│   │   ├── MinHeap.js          # Priority queue for order dispatch
│   │   ├── Trie.js             # Autocomplete search
│   │   ├── Dijkstra.js         # Shortest delivery path
│   │   ├── LRUCache.js         # Caching menu/restaurant data
│   │   └── Graph.js            # City delivery graph
│   ├── analytics/
│   │   ├── orderAnalytics.js   # Order trend analysis
│   │   └── revenueAnalytics.js # Revenue computation
│   └── middleware/
│       ├── auth.js             # JWT authentication
│       └── rateLimit.js        # API rate limiting
├── frontend/
│   ├── index.html              # Homepage (restaurant listing)
│   ├── restaurant.html         # Restaurant menu page
│   ├── cart.html               # Cart & checkout
│   ├── dashboard.html          # Analytics dashboard
│   ├── css/
│   │   ├── main.css            # Global styles & design system
│   │   ├── components.css      # Reusable UI components
│   │   └── dashboard.css       # Analytics dashboard styles
│   └── js/
│       ├── api.js              # API client (fetch wrapper)
│       ├── cart.js             # Cart state management
│       ├── search.js           # Search with Trie autocomplete
│       ├── map.js              # Delivery map visualization
│       └── dashboard.js        # Analytics charts (Chart.js)
└── chatbot/
    ├── chatbot.js              # Claude-powered chatbot widget
    ├── chatbot.css             # Chatbot UI styles
    └── prompts.js              # System prompts & context builder
```

---

## 🧠 DSA Concepts Applied

| Algorithm / Structure | Where Used | Why |
|---|---|---|
| **Min-Heap** | Order dispatch queue | O(log n) priority ordering by delivery time |
| **Trie** | Search autocomplete | O(m) prefix lookup for restaurant/dish names |
| **Dijkstra's Algorithm** | Delivery routing | Shortest path from restaurant to customer |
| **LRU Cache** | Menu caching | O(1) get/set for frequently accessed menus |
| **Graph (Adjacency List)** | City road network | Efficient edge traversal for routing |
| **Hash Map** | Cart & session | O(1) item lookup and update |
| **Sorting (QuickSort)** | Analytics ranking | Restaurant ranking by rating/orders |

---

## 📊 Data Analytics Features

- **Order Heatmap** — Peak hours visualized by day/hour
- **Revenue Trend** — 30-day rolling revenue with moving average
- **Top Dishes** — Ranked by order frequency
- **Delivery Time Distribution** — Histogram of delivery performance
- **Customer Retention** — New vs returning customer breakdown
- **City-wise Order Map** — Geographic distribution

---

## 🤖 Chatbot Capabilities

- Food recommendations based on mood/cuisine preference
- Order status checking
- Restaurant suggestions by location
- Nutritional info queries
- Complaint handling with ticket creation
- Personalized reordering based on history

---

## 🚀 Setup & Run

### Backend
```bash
cd backend
npm install
npm start          # runs on http://localhost:3000
```

### Frontend
```bash
# Serve frontend files (use any static server)
cd frontend
npx serve .        # or open index.html directly
```

### Environment Variables (backend/.env)
```
PORT=3000
JWT_SECRET=your_jwt_secret
ANTHROPIC_API_KEY=your_anthropic_key
```

---

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js, in-memory data store (easily swappable with MongoDB)
- **Frontend**: Vanilla HTML/CSS/JS, Chart.js for analytics
- **Chatbot**: Claude API (claude-sonnet-4-20250514)
- **Auth**: JWT tokens
- **DSA**: Custom implementations in pure JavaScript
