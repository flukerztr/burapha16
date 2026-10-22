// Authentication and User Session Management (Production-Ready Flow)
const Auth = {
  currentUser: null,
  allUsers: [],

  async init() {
    // 1. Load users list for reference / admin stats
    try {
      const data = await API.getUsers();
      if (data.success && data.users) {
        this.allUsers = data.users;
      }
    } catch (e) {
      console.warn('Could not load users list:', e);
    }

    // 2. Restore active session from localStorage if previously logged in
    const stored = localStorage.getItem('b16_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Only restore if it has a valid id
        if (parsed && parsed.id) {
          const fresh = this.allUsers.find(u => u.id === parsed.id);
          this.currentUser = fresh || parsed;
        }
      } catch (e) {
        this.currentUser = null;
      }
    }

    this.renderUserBadge();
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
    window.dispatchEvent(new CustomEvent('user-changed', { detail: user }));
  },

  renderUserBadge() {
    const badgeEl = document.getElementById('user-badge-container');
    if (!badgeEl) return;

    const isAdmin = this.currentUser && this.currentUser.role === 'admin';

    // Toggle Admin tab visibility
    const adminTabs = document.querySelectorAll('.admin-only');
    adminTabs.forEach(el => {
      el.style.display = isAdmin ? 'flex' : 'none';
    });

    if (!this.currentUser) {
      badgeEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <button class="btn btn-secondary btn-sm" onclick="Auth.showLoginModal()">
            <i class="fa-solid fa-right-to-bracket"></i> เข้าสู่ระบบ
          </button>
          <button class="btn btn-primary btn-sm" onclick="Auth.showRegisterModal()">
            <i class="fa-solid fa-user-plus"></i> สมัครสมาชิก
          </button>
        </div>
      `;
      return;
    }

    badgeEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <div class="user-select-badge" style="cursor: default;" title="${this.currentUser.email || ''}">
          <img class="user-avatar-mini" src="${this.currentUser.avatar_url}" alt="${this.currentUser.name}">
          <span style="font-weight: 600; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${this.currentUser.name}
          </span>
          <span class="role-tag ${isAdmin ? 'admin' : 'user'}">
            ${isAdmin ? '👑 Admin' : 'สมาชิก'}
          </span>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="Auth.logout()" title="ออกจากระบบ" style="padding: 0.4rem 0.7rem; color: var(--danger); border-color: #fecaca; background: #fff5f5;">
          <i class="fa-solid fa-right-from-bracket"></i> <span class="hide-mobile">ออกจากระบบ</span>
        </button>
      </div>
    `;
  },

  showLoginModal() {
    document.getElementById('register-modal')?.classList.remove('active');
    const errorBox = document.getElementById('login-error-box');
    if (errorBox) errorBox.style.display = 'none';

    const modal = document.getElementById('login-modal');
    if (modal) {
      modal.classList.add('active');
      setTimeout(() => document.getElementById('login-identifier')?.focus(), 100);
    }
  },

  showRegisterModal() {
    document.getElementById('login-modal')?.classList.remove('active');
    const errorBox = document.getElementById('register-error-box');
    if (errorBox) errorBox.style.display = 'none';

    const modal = document.getElementById('register-modal');
    if (modal) {
      modal.classList.add('active');
      setTimeout(() => document.getElementById('reg-username')?.focus(), 100);
    }
  },

  switchToRegister() {
    this.showRegisterModal();
  },

  switchToLogin() {
    this.showLoginModal();
  },

  async handleLogin(e) {
    e.preventDefault();
    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value;
    const errorBox = document.getElementById('login-error-box');
    const submitBtn = document.getElementById('login-submit-btn');

    if (errorBox) errorBox.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังตรวจสอบ...';
    }

    try {
      const res = await API.login({ identifier, password });
      if (res.success && res.user) {
        this.setUser(res.user);
        document.getElementById('login-modal')?.classList.remove('active');
        document.getElementById('login-password').value = '';
        if (typeof Posts !== 'undefined') Posts.loadPosts();
        if (typeof Swaps !== 'undefined') Swaps.loadSwaps();
      } else {
        if (errorBox) {
          errorBox.textContent = res.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
          errorBox.style.display = 'block';
        } else {
          alert(res.message || 'เข้าสู่ระบบไม่สำเร็จ');
        }
      }
    } catch (err) {
      if (errorBox) {
        errorBox.textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message;
        errorBox.style.display = 'block';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> เข้าสู่ระบบ';
      }
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const location = document.getElementById('reg-location').value.trim();

    const errorBox = document.getElementById('register-error-box');
    const submitBtn = document.getElementById('register-submit-btn');

    if (errorBox) errorBox.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังสมัครสมาชิก...';
    }

    try {
      const res = await API.register({
        username,
        password,
        name,
        email,
        location_hint: location
      });

      if (res.success && res.user) {
        this.allUsers.push(res.user);
        this.setUser(res.user);
        document.getElementById('register-modal')?.classList.remove('active');
        // Reset form fields
        document.getElementById('reg-username').value = '';
        document.getElementById('reg-password').value = '';
        document.getElementById('reg-name').value = '';
        document.getElementById('reg-email').value = '';
        document.getElementById('reg-location').value = '';

        if (typeof Posts !== 'undefined') Posts.loadPosts();
        if (typeof Swaps !== 'undefined') Swaps.loadSwaps();
      } else {
        if (errorBox) {
          errorBox.textContent = res.message || 'ไม่สามารถสมัครสมาชิกได้';
          errorBox.style.display = 'block';
        } else {
          alert(res.message || 'ไม่สามารถสมัครสมาชิกได้');
        }
      }
    } catch (err) {
      if (errorBox) {
        errorBox.textContent = 'เกิดข้อผิดพลาด: ' + err.message;
        errorBox.style.display = 'block';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-user-check"></i> สมัครสมาชิก';
      }
    }
  },

  logout() {
    this.setUser(null);
    if (typeof Chat !== 'undefined') Chat.closeChat();
    if (typeof App !== 'undefined' && App.currentTab === 'admin') {
      App.switchTab('browse');
    }
    if (typeof Posts !== 'undefined') Posts.loadPosts();
    if (typeof Swaps !== 'undefined') Swaps.loadSwaps();
  }
};
