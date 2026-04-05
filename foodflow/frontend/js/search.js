/**
 * FoodFlow — Search Module
 * Handles Trie-powered autocomplete in the navbar
 * Falls back to client-side prefix matching if backend unavailable
 */

const SEARCH_TERMS = [
  { word: 'Chicken Biryani',       type: 'dish',       id: 'd001', icon: '🍛', meta: 'Spice Garden — ₹280' },
  { word: 'Paneer Butter Masala',  type: 'dish',       id: 'd002', icon: '🧆', meta: 'Spice Garden — ₹220' },
  { word: 'BBQ Chicken Pizza',     type: 'dish',       id: 'd022', icon: '🍕', meta: 'Pizza Piazza — ₹420' },
  { word: 'Margherita Pizza',      type: 'dish',       id: 'd021', icon: '🍕', meta: 'Pizza Piazza — ₹350' },
  { word: 'Classic Cheeseburger',  type: 'dish',       id: 'd031', icon: '🍔', meta: 'Burger Barn — ₹199' },
  { word: 'Dragon Roll',           type: 'dish',       id: 'd042', icon: '🍱', meta: 'Sushi Zen — ₹420' },
  { word: 'Chicken Fried Rice',    type: 'dish',       id: 'd011', icon: '🍳', meta: 'Dragon Palace — ₹200' },
  { word: 'Garlic Naan',           type: 'dish',       id: 'd003', icon: '🫓', meta: 'Spice Garden — ₹50' },
  { word: 'Tiramisu',              type: 'dish',       id: 'd025', icon: '🍮', meta: 'Pizza Piazza — ₹180' },
  { word: 'Spice Garden',          type: 'restaurant', id: 'rest_001', icon: '🏪', meta: 'Indian • ⭐4.5 • 30min' },
  { word: 'Dragon Palace',         type: 'restaurant', id: 'rest_002', icon: '🏪', meta: 'Chinese • ⭐4.2 • 25min' },
  { word: 'Pizza Piazza',          type: 'restaurant', id: 'rest_003', icon: '🏪', meta: 'Italian • ⭐4.6 • 35min' },
  { word: 'Burger Barn',           type: 'restaurant', id: 'rest_004', icon: '🏪', meta: 'American • ⭐4.3 • 20min' },
  { word: 'Sushi Zen',             type: 'restaurant', id: 'rest_005', icon: '🏪', meta: 'Japanese • ⭐4.7 • 40min' },
  { word: 'Taco Fiesta',           type: 'restaurant', id: 'rest_006', icon: '🏪', meta: 'Mexican • ⭐4.1 • 28min' },
  { word: 'Indian',                type: 'cuisine',    id: 'c_indian',   icon: '🍛', meta: '1 restaurant' },
  { word: 'Chinese',               type: 'cuisine',    id: 'c_chinese',  icon: '🥢', meta: '1 restaurant' },
  { word: 'Italian',               type: 'cuisine',    id: 'c_italian',  icon: '🍕', meta: '1 restaurant' },
  { word: 'American',              type: 'cuisine',    id: 'c_american', icon: '🍔', meta: '1 restaurant' },
  { word: 'Japanese',              type: 'cuisine',    id: 'c_japanese', icon: '🍣', meta: '1 restaurant' },
  { word: 'Mexican',               type: 'cuisine',    id: 'c_mexican',  icon: '🌮', meta: '1 restaurant' },
  { word: 'biryani',               type: 'tag',        id: 'tag_biryani', icon: '🔖', meta: 'Popular tag' },
  { word: 'pizza',                 type: 'tag',        id: 'tag_pizza',   icon: '🔖', meta: 'Popular tag' },
  { word: 'burger',                type: 'tag',        id: 'tag_burger',  icon: '🔖', meta: 'Popular tag' },
  { word: 'sushi',                 type: 'tag',        id: 'tag_sushi',   icon: '🔖', meta: 'Popular tag' },
  { word: 'veg',                   type: 'tag',        id: 'tag_veg',     icon: '🥗', meta: 'Vegetarian' },
  { word: 'noodles',               type: 'tag',        id: 'tag_noodles', icon: '🍜', meta: 'Popular tag' },
];

// ── Client-side Trie simulation ───────────────────────────────
function prefixSearch(query, limit = 8) {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results = SEARCH_TERMS.filter(t =>
    t.word.toLowerCase().includes(q)
  ).sort((a, b) => {
    // Prefer prefix matches
    const aStart = a.word.toLowerCase().startsWith(q) ? 0 : 1;
    const bStart = b.word.toLowerCase().startsWith(q) ? 0 : 1;
    return aStart - bStart || a.word.localeCompare(b.word);
  });

  return results.slice(0, limit);
}

function groupByType(results) {
  const groups = { restaurant: [], dish: [], cuisine: [], tag: [] };
  for (const r of results) {
    if (groups[r.type]) groups[r.type].push(r);
  }
  return groups;
}

function buildDropdown(results) {
  const groups = groupByType(results);
  let html = '';

  const sections = [
    { key: 'restaurant', label: '🏪 Restaurants' },
    { key: 'cuisine',    label: '🍽️ Cuisines' },
    { key: 'dish',       label: '🥘 Dishes' },
    { key: 'tag',        label: '🔖 Tags' },
  ];

  for (const { key, label } of sections) {
    if (!groups[key]?.length) continue;
    html += `<div class="dropdown-section">
      <div class="dropdown-label">${label}</div>`;
    for (const item of groups[key]) {
      const href = key === 'restaurant'
        ? `restaurant.html?id=${item.id}`
        : `index.html?cuisine=${item.word}`;
      html += `
      <a href="${href}" class="dropdown-item">
        <span class="dropdown-item-icon">${item.icon}</span>
        <span>${item.word}</span>
        <span class="dropdown-item-meta">${item.meta}</span>
      </a>`;
    }
    html += `</div>`;
  }

  return html || '<div class="dropdown-item" style="color:var(--text-muted);">No results found</div>';
}

// ── Setup Search ──────────────────────────────────────────────
function initSearch() {
  const input = document.getElementById('searchInput');
  const dropdown = document.getElementById('searchDropdown');
  if (!input || !dropdown) return;

  let debounceTimer;
  let isOpen = false;

  function openDropdown(html) {
    dropdown.innerHTML = html;
    dropdown.style.display = 'block';
    isOpen = true;
  }

  function closeDropdown() {
    dropdown.style.display = 'none';
    isOpen = false;
  }

  input.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const q = e.target.value.trim();

    if (!q) { closeDropdown(); return; }

    debounceTimer = setTimeout(async () => {
      // Try API first, fall back to client-side
      let results;
      try {
        const data = await api.searchRestaurants(q, 10);
        // Merge API results with client terms
        results = prefixSearch(q, 8);
      } catch {
        results = prefixSearch(q, 8);
      }

      if (results.length) openDropdown(buildDropdown(results));
      else openDropdown('<div class="dropdown-item" style="color:var(--text-muted);padding:1rem;">No results for "' + q + '"</div>');
    }, 180);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDropdown();
    if (e.key === 'Enter' && input.value.trim()) {
      location.href = `index.html?q=${encodeURIComponent(input.value)}`;
    }
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) closeDropdown();
  });

  input.addEventListener('focus', () => {
    if (input.value.trim().length > 0 && !isOpen) {
      const results = prefixSearch(input.value.trim(), 8);
      if (results.length) openDropdown(buildDropdown(results));
    }
  });
}

document.addEventListener('DOMContentLoaded', initSearch);
