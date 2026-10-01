// Authentication and User State Management
const Auth = {
  currentUser: null,
  allUsers: [],

  async init() {
    // 1. Fetch available users
    try {
      const data = await API.getUsers();
      if (data.success && data.users) {
        this.allUsers = data.users;
      }
    } catch (e) {
      console.warn('Could not load users list:', e);
    }

    // 2. Load stored session or default to user-1 (Somchai)
    const stored = localStorage.getItem('b16_user');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
      } catch (e) {
        this.currentUser = null;
      }
    }

    if (!this.currentUser && this.allUsers.length > 0) {
      this.currentUser = this.allUsers[0]; // Default: Somchai
      this.saveSession();
    }

    this.renderUserBadge();
    this.renderUserSwitcherDropdown();
  },

  saveSession() {
    if (this.currentUser) {
      localStorage.setItem('b16_user', JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem('b16_user');
    }
    this.renderUserBadge();
  },

  setUser(user) {
    this.currentUser = user;
    this.saveSession();
    // Dispatch custom event to notify other modules
    window.dispatchEvent(new CustomEvent('user-changed', { detail: user }));
  },

  renderUserBadge() {
    const badgeEl = document.getElementById('user-badge-container');
    if (!badgeEl) return;

    if (!this.currentUser) {
      badgeEl.innerHTML = `
        <button class="btn btn-primary btn-sm" onclick="Auth.showLoginModal()">
          <i class="fa-solid fa-right-to-bracket"></i> เข้าสู่ระบบ
        </button>
      `;
      return;
    }

    const isAdmin = this.currentUser.role === 'admin';
    badgeEl.innerHTML = `
      <div class="user-select-badge" onclick="Auth.toggleSwitcherDropdown(event)">
        <img class="user-avatar-mini" src="${this.currentUser.avatar_url}" alt="${this.currentUser.name}">
        <span style="font-weight: 600; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${this.currentUser.name}
        </span>
        <span class="role-tag ${isAdmin ? 'admin' : 'user'}">
          ${isAdmin ? '👑 Admin' : '👤 User'}
        </span>
        <i class="fa-solid fa-chevron-down" style="font-size: 0.75rem; color: var(--text-muted);"></i>
      </div>
    `;

    // Update admin menu visibility
    const adminTabs = document.querySelectorAll('.admin-only');
    adminTabs.forEach(el => {
      el.style.display = isAdmin ? 'flex' : 'none';
    });
  },

  renderUserSwitcherDropdown() {
    let dropdown = document.getElementById('user-switcher-menu');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.id = 'user-switcher-menu';
      dropdown.style.cssText = `
        position: absolute;
        top: 60px;
        right: 1.5rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        width: 280px;
        padding: 0.75rem;
        z-index: 2100;
        display: none;
      `;
      document.body.appendChild(dropdown);

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('#user-badge-container') && !e.target.closest('#user-switcher-menu')) {
          dropdown.style.display = 'none';
        }
      });
    }

    let itemsHtml = `<div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; margin-bottom: 0.5rem; text-transform: uppercase;">สลับผู้ใช้งาน (Demo Switcher)</div>`;

    this.allUsers.forEach(u => {
      const isSelected = this.currentUser && this.currentUser.id === u.id;
      const isAdmin = u.role === 'admin';
      itemsHtml += `
        <div onclick="Auth.switchUser('${u.id}')" style="
          display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem;
          border-radius: var(--radius-sm); cursor: pointer; margin-bottom: 4px;
          background: ${isSelected ? 'var(--primary-light)' : 'transparent'};
        ">
          <img src="${u.avatar_url}" style="width: 28px; height: 28px; border-radius: 50%;">
          <div style="flex: 1; overflow: hidden;">
            <div style="font-size: 0.85rem; font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${u.name}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${u.email}</div>
          </div>
          <span class="role-tag ${isAdmin ? 'admin' : 'user'}">${isAdmin ? 'Admin' : 'User'}</span>
        </div>
      `;
    });

    itemsHtml += `
      <hr style="border: none; border-top: 1px solid var(--border); margin: 0.5rem 0;">
      <button class="btn btn-secondary btn-sm" style="width: 100%;" onclick="Auth.showRegisterModal()">
        <i class="fa-solid fa-user-plus"></i> สมัครสมาชิกใหม่
      </button>
    `;

    dropdown.innerHTML = itemsHtml;
  },

  toggleSwitcherDropdown(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('user-switcher-menu');
    if (!dropdown) return;
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  },

  switchUser(userId) {
    const target = this.allUsers.find(u => u.id === userId);
    if (target) {
      this.setUser(target);
      const dropdown = document.getElementById('user-switcher-menu');
      if (dropdown) dropdown.style.display = 'none';
      if (typeof Posts !== 'undefined') Posts.loadPosts();
      if (typeof Swaps !== 'undefined') Swaps.loadSwaps();
    }
  },

  showRegisterModal() {
    const dropdown = document.getElementById('user-switcher-menu');
    if (dropdown) dropdown.style.display = 'none';
    const modal = document.getElementById('register-modal');
    if (modal) modal.classList.add('active');
  },

  async handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const role = document.getElementById('reg-role').value;
    const location = document.getElementById('reg-location').value;

    try {
      const res = await API.register({ name, email, role, location_hint: location });
      if (res.success && res.user) {
        alert('🎉 ลงทะเบียนสำเร็จ ยินดีต้อนรับ ' + res.user.name);
        this.allUsers.push(res.user);
        this.setUser(res.user);
        this.renderUserSwitcherDropdown();
        document.getElementById('register-modal').classList.remove('active');
        if (typeof Posts !== 'undefined') Posts.loadPosts();
      } else {
        alert(res.message || 'ไม่สามารถลงทะเบียนได้');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  }
};
