/**
 * Chatbot Route — Gemini integration
 * POST /api/chatbot/message
 */

const fetch = require('node-fetch');
const express = require('express');
const router = express.Router();

const { restaurants, getOrders } = require('../models/dataStore');
const { buildSystemPrompt } = require('../../chatbot/prompts');

router.post('/message', async (req, res) => {
  const { message, conversationHistory = [], userId } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Build context
  const context = {
    restaurants: restaurants.map(r => ({
      id: r.id,
      name: r.name,
      cuisine: r.cuisine,
      rating: r.rating,
      deliveryTime: r.deliveryTime,
      isOpen: r.isOpen,
      priceRange: r.priceRange,
      tags: r.tags,
    })),
    userOrders: userId ? getOrders({ userId }).slice(-5) : [],
  };

  const systemPrompt = buildSystemPrompt(context);

  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    const prompt = `
${systemPrompt}

User: ${message}
Assistant:
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Gemini API error');
    }

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I couldn't process that.";

    res.json({ reply });

  } catch (error) {
    console.error('Chatbot error:', error.message);

    // fallback response
    res.json({
      reply: getMockReply(message, context),
      isMock: true,
      error: error.message,
    });
  }
});

/**
 * Mock responses (fallback)
 */
function getMockReply(message, context) {
  const msg = message.toLowerCase();
  const openRestaurants = context.restaurants.filter(r => r.isOpen);

  if (msg.includes('pizza') || msg.includes('italian')) {
    return `🍕 Great choice! **Pizza Piazza** is our top Italian restaurant with a 4.6 rating.`;
  }
  if (msg.includes('burger') || msg.includes('american')) {
    return `🍔 **Burger Barn** is perfect for you! Quick 20-min delivery.`;
  }
  if (msg.includes('biryani') || msg.includes('indian')) {
    return `🍛 **Spice Garden** serves the best Chicken Biryani in town!`;
  }
  if (msg.includes('cheap') || msg.includes('budget')) {
    return `💰 Try **Burger Barn** or **Taco Fiesta** for budget meals!`;
  }
  if (msg.includes('fast')) {
    return `⚡ Fastest: Burger Barn (20 min), Dragon Palace (25 min)`;
  }
  if (msg.includes('best') || msg.includes('recommend')) {
    const top = openRestaurants.sort((a, b) => b.rating - a.rating)[0];
    return `⭐ Best: ${top?.name} (${top?.rating}⭐)`;
  }
  if (msg.includes('veg')) {
    return `🥗 Spice Garden & Pizza Piazza have great veg options!`;
  }
  if (msg.includes('hello') || msg.includes('hi')) {
    return `👋 Hey! I'm FoodBot. What are you craving?`;
  }

  return `😊 Ask me about food, restaurants, or delivery!`;
}

module.exports = router;