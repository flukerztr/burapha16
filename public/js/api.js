// API Helper for Burapha 16 Dev
const API = {
  // Posts
  async getPosts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`/api/posts?${query}`);
    return res.json();
  },

  async getPostById(id) {
    const res = await fetch(`/api/posts/${id}`);
    return res.json();
  },

  async createPost(postData) {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });
    return res.json();
  },

  async updatePost(id, updateData) {
    const res = await fetch(`/api/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    return res.json();
  },

  async deletePost(id, authData) {
    const res = await fetch(`/api/posts/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authData)
    });
    return res.json();
  },

  // Swaps & Verification
  async getSwaps(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`/api/swaps?${query}`);
    return res.json();
  },

  async proposeSwap(swapData) {
    const res = await fetch('/api/swaps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(swapData)
    });
    return res.json();
  },

  async updateSwapStatus(swapId, status, current_user_id) {
    const res = await fetch(`/api/swaps/${swapId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, current_user_id })
    });
    return res.json();
  },

  // Dual-confirmation receipt verification
  async confirmReceived(swapId, userData) {
    const res = await fetch(`/api/swaps/${swapId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return res.json();
  },

  // 1-on-1 Chat
  async getChatMessages(swapId) {
    const res = await fetch(`/api/chat/${swapId}`);
    return res.json();
  },

  async sendChatMessage(swapId, messageData) {
    const res = await fetch(`/api/chat/${swapId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    });
    return res.json();
  },

  // AI Assistant (Gemini API)
  async askAI(message, history = []) {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history })
    });
    return res.json();
  },

  // Users & Auth
  async getUsers() {
    const res = await fetch('/api/auth/users');
    return res.json();
  },

  async login(payload) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async register(payload) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  }
};
