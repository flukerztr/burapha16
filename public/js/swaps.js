// Swap Offers & Verification Management Module
const Swaps = {
  mySwaps: [],

  async init() {
    await this.loadSwaps();
  },

  async loadSwaps() {
    const currentUser = Auth.currentUser;
    if (!currentUser) return;

    try {
      const data = await API.getSwaps({ user_id: currentUser.id });
      if (data.success) {
        this.mySwaps = data.swaps || [];
        this.renderSwapsTab();
        
        // Update badge in navigation
        const pendingCount = this.mySwaps.filter(s => s.owner_id === currentUser.id && s.status === 'pending').length;
        const swapNavBadge = document.getElementById('swap-badge');
        if (swapNavBadge) {
          swapNavBadge.textContent = pendingCount > 0 ? pendingCount : '';
          swapNavBadge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
        }
      }
    } catch (err) {
      console.warn('Error loading swaps:', err);
    }
  },

  showProposeModal(postId) {
    const currentUser = Auth.currentUser;
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบก่อนยื่นข้อเสนอแลกเปลี่ยน');
      return;
    }

    const modal = document.getElementById('propose-swap-modal');
    document.getElementById('propose-post-id').value = postId;
    document.getElementById('propose-desc').value = '';

    // Populate user's own items so they can select an item to swap
    const userItemsSelect = document.getElementById('propose-item-select');
    userItemsSelect.innerHTML = `<option value="">-- อธิบายสิ่งของด้านล่าง หรือเลือกโพสต์ของคุณ --</option>`;
    
    const myPosts = Posts.postsList.filter(p => p.user_id === currentUser.id && p.status === 'available');
    myPosts.forEach(p => {
      userItemsSelect.innerHTML += `<option value="${p.id}">📦 [โพสต์ของคุณ] ${p.title}</option>`;
    });

    document.getElementById('post-detail-modal')?.classList.remove('active');
    modal.classList.add('active');
  },

  async submitProposal(e) {
    e.preventDefault();
    const currentUser = Auth.currentUser;
    if (!currentUser) return;

    const postId = document.getElementById('propose-post-id').value;
    const desc = document.getElementById('propose-desc').value;
    const selectedItemId = document.getElementById('propose-item-select').value;

    if (!desc.trim()) {
      alert('กรุณากรอกรายละเอียดสิ่งของที่คุณต้องการนำมาแลกเปลี่ยน');
      return;
    }

    try {
      const res = await API.proposeSwap({
        post_id: postId,
        requester_id: currentUser.id,
        requester_offer_desc: desc.trim(),
        requester_item_id: selectedItemId || null
      });

      if (res.success) {
        alert('🎉 ส่งข้อเสนอแลกเปลี่ยนเรียบร้อยแล้ว! โปรดรอเจ้าของโพสต์พิจารณาตอบรับ');
        document.getElementById('propose-swap-modal').classList.remove('active');
        this.loadSwaps();
        App.switchTab('swaps');
      } else {
        alert('❌ ' + (res.message || 'ไม่สามารถส่งข้อเสนอได้'));
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  },

  renderSwapsTab() {
    const container = document.getElementById('swaps-list-container');
    if (!container) return;

    const currentUser = Auth.currentUser;
    if (!currentUser) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
          <p style="color: var(--text-muted); margin-bottom: 1rem;">กรุณาเข้าสู่ระบบเพื่อดูรายการแลกเปลี่ยนของคุณ</p>
          <button class="btn btn-primary" onclick="Auth.showLoginModal()">เข้าสู่ระบบ</button>
        </div>
      `;
      return;
    }

    if (this.mySwaps.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border);">
          <i class="fa-solid fa-handshake-slash fa-3x" style="color: var(--text-muted); margin-bottom: 1rem;"></i>
          <h3 style="font-weight: 600; margin-bottom: 0.5rem;">ยังไม่มีรายการแลกเปลี่ยน</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.25rem;">ลองค้นหาสิ่งของที่คุณสนใจแล้วกดยื่นข้อเสนอขอแลกเปลี่ยนดูสิ</p>
          <button class="btn btn-primary" onclick="App.switchTab('browse')">
            <i class="fa-solid fa-magnifying-glass"></i> สำรวจสิ่งของ
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = this.mySwaps.map(swap => {
      const isOwner = currentUser.id === swap.owner_id;
      const partnerName = isOwner ? (swap.requester?.name || 'ผู้ขอแลก') : (swap.owner?.name || 'เจ้าของโพสต์');
      const postTitle = swap.post?.title || 'โพสต์สิ่งของ';
      const postImg = (swap.post?.images && swap.post.images.length > 0) ? swap.post.images[0] : '';

      // Status pill
      let statusBadge = '';
      if (swap.status === 'pending') {
        statusBadge = `<span class="role-tag" style="background: #fef3c7; color: #92400e;">⏳ รอการตอบรับ</span>`;
      } else if (swap.status === 'in_progress') {
        statusBadge = `<span class="role-tag" style="background: #e0e7ff; color: #4338ca;">🔄 กำลังแลกเปลี่ยน</span>`;
      } else if (swap.status === 'completed') {
        statusBadge = `<span class="role-tag" style="background: #d1fae5; color: #065f46;">✨ แลกเปลี่ยนสำเร็จ 100%</span>`;
      } else if (swap.status === 'rejected') {
        statusBadge = `<span class="role-tag" style="background: #fee2e2; color: #991b1b;">❌ ปฏิเสธแล้ว</span>`;
      }

      // Verification check status
      const myConfirmed = isOwner ? swap.owner_confirmed : swap.requester_confirmed;
      const partnerConfirmed = isOwner ? swap.requester_confirmed : swap.owner_confirmed;

      return `
        <div class="filter-card" style="margin-bottom: 1rem; border-left: 4px solid ${swap.status === 'completed' ? 'var(--success)' : (swap.status === 'in_progress' ? 'var(--secondary)' : 'var(--accent)')};">
          <div style="display: flex; gap: 1rem; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; flex-wrap: wrap;">
              <div>
                <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">
                  ${isOwner ? '📥 มีคนขอแลกสิ่งของของคุณ' : '📤 คุณยื่นขอแลกสิ่งของนี้'}
                </span>
                <h3 style="font-size: 1.1rem; font-weight: 700; margin-top: 2px;">${postTitle}</h3>
              </div>
              <div>${statusBadge}</div>
            </div>

            <div style="background: var(--bg-main); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.85rem; font-size: 0.9rem;">
              <div style="font-weight: 600; color: var(--text-main); margin-bottom: 4px;">
                🔄 สิ่งที่นำมาแลก:
              </div>
              <div style="color: var(--text-muted);">${swap.requester_offer_desc}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 6px;">
                คู่สัญญาแลกเปลี่ยน: <strong>${partnerName}</strong> • เมื่อ ${new Date(swap.created_at).toLocaleString('th-TH')}
              </div>
            </div>

            <!-- Dual-Confirmation Verification Box (Only shown if in_progress or completed) -->
            ${(swap.status === 'in_progress' || swap.status === 'completed') ? `
              <div class="verification-card" style="margin: 0.5rem 0; padding: 0.9rem;">
                <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
                  <i class="fa-solid fa-shield-halved" style="color: var(--primary);"></i>
                  <span>ระบบตรวจสอบการยืนยันว่าได้รับของ (Dual-Verification)</span>
                </div>

                <div class="verification-status-grid" style="margin: 0.6rem 0;">
                  <div class="verify-side ${swap.owner_confirmed ? 'confirmed' : ''}">
                    <span style="font-size: 0.8rem; font-weight: 600;">เจ้าของโพสต์ (${swap.owner?.name || 'เจ้าของ'})</span>
                    <span class="verify-badge ${swap.owner_confirmed ? 'done' : 'waiting'}">
                      ${swap.owner_confirmed ? '✅ ยืนยันรับของแล้ว' : '⏳ ยังไม่ได้ยืนยัน'}
                    </span>
                  </div>

                  <div class="verify-side ${swap.requester_confirmed ? 'confirmed' : ''}">
                    <span style="font-size: 0.8rem; font-weight: 600;">ผู้ขอแลก (${swap.requester?.name || 'ผู้ขอแลก'})</span>
                    <span class="verify-badge ${swap.requester_confirmed ? 'done' : 'waiting'}">
                      ${swap.requester_confirmed ? '✅ ยืนยันรับของแล้ว' : '⏳ ยังไม่ได้ยืนยัน'}
                    </span>
                  </div>
                </div>

                ${swap.status === 'in_progress' ? `
                  ${!myConfirmed ? `
                    <button class="btn btn-primary btn-sm" style="margin-top: 0.4rem;" onclick="Swaps.confirmItemReceived('${swap.id}')">
                      <i class="fa-solid fa-check-double"></i> ฉันได้รับสิ่งของจาก ${partnerName} เรียบร้อยแล้ว (กดยืนยัน)
                    </button>
                  ` : `
                    <div style="font-size: 0.85rem; color: #166534; font-weight: 600; margin-top: 0.4rem;">
                      <i class="fa-solid fa-check"></i> คุณกดยืนยันรับของแล้ว (กำลังรอคู่แลกเปลี่ยนกดยืนยัน)
                    </div>
                  `}
                ` : `
                  <div style="font-size: 0.9rem; color: #166534; font-weight: 700; margin-top: 0.3rem;">
                    🎉 ทั้งสองฝ่ายยืนยันการรับสิ่งของเสร็จสมบูรณ์เรียบร้อย 100%!
                  </div>
                `}
              </div>
            ` : ''}

            <!-- Action Controls -->
            <div style="display: flex; gap: 0.5rem; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
              ${(swap.status === 'pending' && isOwner) ? `
                <button class="btn btn-primary btn-sm" onclick="Swaps.respondSwap('${swap.id}', 'in_progress')">
                  <i class="fa-solid fa-check"></i> ตกลงแลกเปลี่ยน (Accept)
                </button>
                <button class="btn btn-danger btn-sm" onclick="Swaps.respondSwap('${swap.id}', 'rejected')">
                  <i class="fa-solid fa-xmark"></i> ปฏิเสธ (Decline)
                </button>
              ` : ''}

              ${(swap.status === 'in_progress' || swap.status === 'completed') ? `
                <button class="btn btn-secondary btn-sm" onclick="Chat.openChat('${swap.id}', '${postTitle}', '${partnerName}', '${swap.status}')">
                  <i class="fa-solid fa-comments"></i> เปิดห้องแชทส่วนตัว (1-on-1 Chat)
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  async respondSwap(swapId, status) {
    const currentUser = Auth.currentUser;
    if (!currentUser) return;

    try {
      const res = await API.updateSwapStatus(swapId, status, currentUser.id);
      if (res.success) {
        alert(res.message);
        await this.loadSwaps();
        if (typeof Posts !== 'undefined') Posts.loadPosts();
      } else {
        alert('❌ ' + (res.message || 'เกิดข้อผิดพลาด'));
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  },

  async confirmItemReceived(swapId) {
    const currentUser = Auth.currentUser;
    if (!currentUser) return;

    if (!confirm('ยืนยันว่าคุณได้รับสิ่งของจากอีกฝ่ายเรียบร้อยแล้วใช่หรือไม่?')) return;

    try {
      const res = await API.confirmReceived(swapId, {
        current_user_id: currentUser.id,
        current_user_name: currentUser.name
      });

      if (res.success) {
        alert('✅ ' + res.message);
        await this.loadSwaps();
        if (typeof Posts !== 'undefined') Posts.loadPosts();
        // If chat is open, reload messages
        if (Chat.activeSwapId === swapId) {
          Chat.loadMessages();
        }
      } else {
        alert('❌ ' + (res.message || 'เกิดข้อผิดพลาด'));
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  }
};
