// Main Application Orchestrator
const App = {
  currentTab: 'browse',

  async init() {
    // 1. Initialize Auth
    await Auth.init();

    // 2. Initialize Posts
    await Posts.init();

    // 3. Initialize Swaps
    await Swaps.init();

    // 4. Initialize AI Assistant
    AIAssistant.init();

    // 5. Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW reg error:', err));
    }

    // 6. Listen for user change events
    window.addEventListener('user-changed', () => {
      this.refreshCurrentTab();
    });

    console.log('✨ Burapha 16 Dev App Initialized!');
  },

  switchTab(tabName) {
    this.currentTab = tabName;

    // Toggle Tab Sections
    document.querySelectorAll('.tab-section').forEach(sec => sec.style.display = 'none');
    const targetSec = document.getElementById(`tab-${tabName}`);
    if (targetSec) targetSec.style.display = 'block';

    // Update Desktop Nav Links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.tab === tabName);
    });

    // Update Mobile Bottom Nav
    document.querySelectorAll('.bnav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabName);
    });

    // Specific tab triggers
    if (tabName === 'explorer') {
      setTimeout(() => {
        MapManager.initExplorerMap(Posts.postsList);
      }, 100);
    } else if (tabName === 'swaps') {
      Swaps.loadSwaps();
    } else if (tabName === 'admin') {
      this.renderAdminDashboard();
    }
  },

  refreshCurrentTab() {
    if (this.currentTab === 'browse') {
      Posts.loadPosts();
    } else if (this.currentTab === 'swaps') {
      Swaps.loadSwaps();
    } else if (this.currentTab === 'explorer') {
      MapManager.initExplorerMap(Posts.postsList);
    } else if (this.currentTab === 'admin') {
      this.renderAdminDashboard();
    }
  },

  renderAdminDashboard() {
    const container = document.getElementById('admin-content-container');
    if (!container) return;

    const currentUser = Auth.currentUser;
    if (!currentUser || currentUser.role !== 'admin') {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
          <i class="fa-solid fa-lock fa-3x" style="color: var(--danger); margin-bottom: 1rem;"></i>
          <h2 style="font-weight: 700;">เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น</h2>
          <p style="color: var(--text-muted); margin-top: 0.5rem;">กรุณาสลับไปยังผู้ใช้งานที่มีสิทธิ์แอดมินจากแถบด้านบน</p>
        </div>
      `;
      return;
    }

    const posts = Posts.postsList;
    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div class="filter-card" style="margin: 0; text-align: center;">
          <div style="font-size: 0.85rem; color: var(--text-muted);">โพสต์สิ่งของทั้งหมด</div>
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--primary); margin-top: 4px;">${posts.length}</div>
        </div>
        <div class="filter-card" style="margin: 0; text-align: center;">
          <div style="font-size: 0.85rem; color: var(--text-muted);">ผู้ใช้งานในระบบ</div>
          <div style="font-size: 1.8rem; font-weight: 800; color: var(--secondary); margin-top: 4px;">${Auth.allUsers.length}</div>
        </div>
        <div class="filter-card" style="margin: 0; text-align: center;">
          <div style="font-size: 0.85rem; color: var(--text-muted);">สิทธิ์ของคุณ</div>
          <div style="font-size: 1.1rem; font-weight: 700; color: var(--admin-badge); margin-top: 6px;">👑 แอดมินสูงสุด</div>
        </div>
      </div>

      <div class="filter-card">
        <h3 style="font-weight: 700; margin-bottom: 1rem;">จัดการโพสต์ทั้งหมด (Admin Moderation)</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
          ในฐานะแอดมิน คุณสามารถแก้ไขหรือลบโพสต์ใดก็ได้ในระบบเพื่อตรวจสอบความเหมาะสม
        </p>

        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${posts.map(p => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: var(--bg-main); border: 1px solid var(--border); border-radius: var(--radius-sm); flex-wrap: wrap; gap: 0.5rem;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <img src="${(p.images && p.images[0]) || ''}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px;">
                <div>
                  <div style="font-weight: 600; font-size: 0.95rem;">${p.title}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">
                    ผู้โพสต์: ${p.user_name} • หมวด: ${p.category} • สถานะ: ${p.status}
                  </div>
                </div>
              </div>

              <div style="display: flex; gap: 0.4rem;">
                <button class="btn btn-secondary btn-sm" onclick="Posts.showEditModal('${p.id}')">
                  <i class="fa-solid fa-pen"></i> แก้ไข
                </button>
                <button class="btn btn-danger btn-sm" onclick="Posts.deletePost('${p.id}')">
                  <i class="fa-solid fa-trash"></i> ลบ (Admin)
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
};

// Start app when DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
