/**
 * FoodFlow — Chatbot Widget
 * Claude-powered AI food assistant embedded in all pages
 */

class FoodBotWidget {
  constructor() {
    this.isOpen = false;
    this.conversationHistory = [];
    this.isLoading = false;

    this.toggle  = document.getElementById('chatToggle');
    this.window  = document.getElementById('chatWindow');
    this.messages= document.getElementById('chatMessages');
    this.input   = document.getElementById('chatInput');
    this.sendBtn = document.getElementById('chatSend');
    this.closeBtn= document.getElementById('chatClose');
    this.chips   = document.getElementById('quickChips');

    if (!this.toggle) return;   // chatbot not on this page
    this.bindEvents();
  }

  bindEvents() {
    this.toggle.addEventListener('click', () => this.toggleWindow());
    this.closeBtn?.addEventListener('click', () => this.closeWindow());

    this.sendBtn?.addEventListener('click', () => this.sendMessage());
    this.input?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Auto-resize textarea
    this.input?.addEventListener('input', () => {
      this.input.style.height = 'auto';
      this.input.style.height = Math.min(this.input.scrollHeight, 100) + 'px';
    });

    // Quick chips
    this.chips?.addEventListener('click', e => {
      const chip = e.target.closest('.quick-chip');
      if (chip) {
        const msg = chip.dataset.msg;
        this.input.value = msg;
        this.sendMessage();
      }
    });
  }

  toggleWindow() {
    if (this.isOpen) this.closeWindow();
    else this.openWindow();
  }

  openWindow() {
    this.isOpen = true;
    this.window.classList.add('open');
    this.toggle.classList.add('open');
    this.toggle.textContent = '✕';
    this.input?.focus();
  }

  closeWindow() {
    this.isOpen = false;
    this.window.classList.remove('open');
    this.toggle.classList.remove('open');
    this.toggle.textContent = '🤖';
  }

  async sendMessage() {
    if (this.isLoading) return;
    const text = this.input.value.trim();
    if (!text) return;

    this.input.value = '';
    this.input.style.height = 'auto';

    this.appendMessage('user', text);
    this.conversationHistory.push({ role: 'user', content: text });

    this.showTyping();
    this.isLoading = true;
    this.sendBtn.disabled = true;

    try {
      const response = await this.callAPI(text);
      this.hideTyping();
      this.appendMessage('bot', response);
      this.conversationHistory.push({ role: 'assistant', content: response });
    } catch (err) {
      this.hideTyping();
      const fallback = this.getFallbackReply(text);
      this.appendMessage('bot', fallback);
    } finally {
      this.isLoading = false;
      this.sendBtn.disabled = false;
      this.input.focus();
    }
  }
async callAPI(message) {
  const res = await fetch('https://foodflow-vfqm.onrender.com/api/chatbot/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversationHistory: this.conversationHistory.slice(-8),
      userId: 'u001',
    }),
  });

  if (!res.ok) throw new Error('API error');

  const data = await res.json();
  return data.reply;
}
  appendMessage(role, text) {
    const isBot = role === 'bot';
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Parse basic markdown-like formatting
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');

    const el = document.createElement('div');
    el.className = `message ${role}`;
    el.innerHTML = `
      ${isBot ? '<div class="msg-avatar">🍔</div>' : ''}
      <div>
        <div class="msg-bubble">${formatted}</div>
        <div class="msg-time">${now}</div>
      </div>
      ${!isBot ? '<div class="msg-avatar" style="background:rgba(255,77,46,0.15);">👤</div>' : ''}`;

    this.messages.appendChild(el);
    this.messages.scrollTop = this.messages.scrollHeight;
  }

  showTyping() {
    const el = document.createElement('div');
    el.className = 'message bot';
    el.id = 'typingIndicator';
    el.innerHTML = `
      <div class="msg-avatar">🍔</div>
      <div class="typing-dots"><span></span><span></span><span></span></div>`;
    this.messages.appendChild(el);
    this.messages.scrollTop = this.messages.scrollHeight;
  }

  hideTyping() {
    document.getElementById('typingIndicator')?.remove();
  }

  // ── Offline fallback replies ──────────────────────────────
  getFallbackReply(message) {
    const msg = message.toLowerCase();
    if (msg.includes('pizza') || msg.includes('italian'))
      return '🍕 **Pizza Piazza** is our go-to for Italian! Their BBQ Chicken Pizza (₹420, ⭐4.8) is legendary. Delivery ~35 min.';
    if (msg.includes('burger') || msg.includes('american'))
      return '🍔 **Burger Barn** has the fastest delivery (20 min) and great prices! Classic Cheeseburger at ₹199 is a crowd-pleaser.';
    if (msg.includes('biryani') || msg.includes('indian'))
      return '🍛 **Spice Garden** serves the best Chicken Biryani (₹280, ⭐4.7)! Also check out their Dal Makhani and Paneer dishes.';
    if (msg.includes('sushi') || msg.includes('japanese'))
      return '🍣 **Sushi Zen** has incredible sushi (⭐4.7) but is currently closed. Check back later — their Dragon Roll is worth the wait!';
    if (msg.includes('cheap') || msg.includes('budget'))
      return '💰 Budget picks:\n1. **Burger Barn** — from ₹89\n2. **Spice Garden** — from ₹50\n3. **Taco Fiesta** — from ₹90';
    if (msg.includes('fast') || msg.includes('quick'))
      return '⚡ Fastest deliveries right now:\n1. **Burger Barn** — 20 min\n2. **Dragon Palace** — 25 min\n3. **Taco Fiesta** — 28 min';
    if (msg.includes('veg') || msg.includes('vegetarian'))
      return '🥗 Great veg options across all restaurants! **Spice Garden** has Paneer Masala & Dal Makhani. **Pizza Piazza** has Margherita. **Dragon Palace** has Hakka Noodles.';
    if (msg.includes('best') || msg.includes('recommend') || msg.includes('top'))
      return '⭐ Our highest rated restaurants:\n1. **Sushi Zen** — ⭐4.7 (currently closed)\n2. **Pizza Piazza** — ⭐4.6\n3. **Spice Garden** — ⭐4.5';
    if (msg.includes('dsa') || msg.includes('algorithm'))
      return '🧠 FoodFlow uses real DSA!\n• **Trie** for search autocomplete (O(m))\n• **Min-Heap** for order dispatch (O(log n))\n• **Dijkstra** for delivery routing (O((V+E)log V))\n• **LRU Cache** for menu caching (O(1))\nCheck the Analytics dashboard for a live demo!';
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey'))
      return '👋 Hey! Welcome to **FoodFlow**! I\'m here to help you find the perfect meal. Ask me about restaurants, dishes, or how our DSA-powered delivery works! 🍽️';
    return '😊 I\'d love to help! Try asking:\n• "Best Indian food"\n• "Fastest delivery"\n• "Cheap options"\n• "Vegetarian dishes"\n• "How does the app work?"';
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.foodBot = new FoodBotWidget();
});
