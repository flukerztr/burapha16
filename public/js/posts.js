// Posts Management Module: Create, Read, Update, Delete with Role Access
const Posts = {
  currentCategory: 'ทั้งหมด',
  currentStatus: 'ทั้งหมด',
  currentType: 'ทั้งหมด', // 'ทั้งหมด', 'swap', 'donation', 'request'
  searchQuery: '',
  postsList: [],
  activePost: null,

  async init() {
    await this.loadPosts();
  },

  async loadPosts() {
    const grid = document.getElementById('posts-grid');
    if (grid) grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><br><br>กำลังโหลดรายการสิ่งของ...</div>`;

    try {
      const params = {};
      if (this.currentCategory !== 'ทั้งหมด') params.category = this.currentCategory;
      if (this.currentStatus !== 'ทั้งหมด') params.status = this.currentStatus;
      if (this.currentType !== 'ทั้งหมด') params.type = this.currentType;
      if (this.searchQuery) params.q = this.searchQuery;

      const data = await API.getPosts(params);
      if (data.success) {
        this.postsList = data.posts || [];
        this.renderPosts(this.postsList);

        // Update counts in UI
        const countBadge = document.getElementById('total-posts-count');
        if (countBadge) countBadge.textContent = this.postsList.length;

        // If explorer map is open, update map pins
        if (MapManager.explorerMap) {
          MapManager.initExplorerMap(this.postsList);
        }
      }
    } catch (err) {
      if (grid) grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--danger); padding: 2rem;">เกิดข้อผิดพลาดในการโหลดข้อมูล: ${err.message}</div>`;
    }
  },

  renderPosts(posts) {
    const grid = document.getElementById('posts-grid');
    if (!grid) return;

    if (posts.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border);">
          <i class="fa-solid fa-box-open fa-3x" style="color: var(--text-muted); margin-bottom: 1rem;"></i>
          <h3 style="font-weight: 600; margin-bottom: 0.5rem;">ยังไม่พบสิ่งของในหมวดหมู่นี้</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.25rem;">มาร่วมเป็นคนแรกที่ส่งต่อหรือแลกเปลี่ยนสิ่งของกันเถอะ</p>
          <button class="btn btn-primary" onclick="Posts.showCreateModal()">
            <i class="fa-solid fa-plus"></i> โพสต์สิ่งของของคุณ
          </button>
        </div>
      `;
      return;
    }

    const currentUser = Auth.currentUser;
    const isAdmin = currentUser && currentUser.role === 'admin';

    grid.innerHTML = posts.map(post => {
      const isOwner = currentUser && currentUser.id === post.user_id;
      const canEdit = isOwner || isAdmin;
      const canDelete = isOwner || isAdmin;
      const postType = post.post_type || 'swap';

      // Type Badge
      let typeBadge = '';
      let actionBtnText = 'ดู / ขอแลก';
      let exchangeBoxTitle = 'อยากแลก:';
      let exchangeBoxIcon = 'fa-rotate';

      if (postType === 'donation') {
        typeBadge = `<span class="post-type-badge type-donation"><i class="fa-solid fa-gift"></i> บริจาคฟรี</span>`;
        actionBtnText = 'ดู / ขอรับของฟรี';
        exchangeBoxTitle = '🎁 บริจาคฟรี:';
        exchangeBoxIcon = 'fa-gift';
      } else if (postType === 'request') {
        typeBadge = `<span class="post-type-badge type-request"><i class="fa-solid fa-hand-holding-heart"></i> ขอรับบริจาค</span>`;
        actionBtnText = 'ดู / มอบให้';
        exchangeBoxTitle = '🙋 ขอรับ:';
        exchangeBoxIcon = 'fa-hand-holding-heart';
      } else {
        typeBadge = `<span class="post-type-badge type-swap"><i class="fa-solid fa-repeat"></i> แลกเปลี่ยน</span>`;
      }

      // Status badge label and class
      let statusClass = 'status-available';
      let statusLabel = postType === 'donation' ? 'เปิดรับผู้ขอ' : (postType === 'request' ? 'กำลังตามหา' : 'พร้อมแลก');
      if (post.status === 'negotiating') {
        statusClass = 'status-negotiating';
        statusLabel = 'กำลังดำเนินการ';
      } else if (post.status === 'swapped') {
        statusClass = 'status-swapped';
        statusLabel = postType === 'donation' ? 'ส่งมอบแล้ว' : (postType === 'request' ? 'ได้รับแล้ว' : 'แลกเปลี่ยนแล้ว');
      }

      const img = (post.images && post.images.length > 0)
        ? post.images[0]
        : 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80';

      return `
        <div class="post-card" id="post-card-${post.id}">
          <div class="post-img-wrap" onclick="Posts.showPostDetails('${post.id}')" style="cursor: pointer;">
            <img class="post-img" src="${img}" alt="${post.title}" loading="lazy">
            ${typeBadge}
            <span class="post-status-badge ${statusClass}">
              <i class="fa-solid fa-circle" style="font-size: 0.5rem; margin-right: 3px;"></i> ${statusLabel}
            </span>
            <span class="post-category-tag">${post.category}</span>
          </div>

          <div class="post-body">
            <h3 class="post-title" onclick="Posts.showPostDetails('${post.id}')" style="cursor: pointer;">
              ${post.title}
            </h3>
            <p class="post-desc">${post.description || 'ไม่มีคำอธิบายเพิ่มเติม'}</p>

            <div class="post-exchange-box" style="${postType === 'donation' ? 'background: #f5f3ff; border-color: #c4b5fd; color: #5b21b6;' : (postType === 'request' ? 'background: #fffbeb; border-color: #fde68a; color: #92400e;' : '')}">
              <i class="fa-solid ${exchangeBoxIcon}" style="margin-top: 2px;"></i>
              <div>
                <strong>${exchangeBoxTitle}</strong> ${post.desired_exchange || 'ไม่มีเงื่อนไขเพิ่มเติม'}
              </div>
            </div>

            <div class="post-location">
              <i class="fa-solid fa-location-dot" style="color: var(--primary);"></i>
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${post.location_name || 'มหาวิทยาลัยบูรพา ชลบุรี'}
              </span>
            </div>

            <div class="post-footer">
              <div class="post-author">
                <img class="post-author-img" src="https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(post.user_name || post.user_id)}" alt="">
                <span>${post.user_name}</span>
              </div>

              <div class="post-actions">
                ${canEdit ? `
                  <button class="btn-icon edit ${isAdmin && !isOwner ? 'admin-action' : ''}" title="${isAdmin && !isOwner ? '👑 แอดมิน: แก้ไขโพสต์นี้' : 'แก้ไขโพสต์ของคุณ'}" onclick="Posts.showEditModal('${post.id}')">
                    <i class="fa-solid fa-pen-to-square"></i>
                  </button>
                ` : ''}

                ${canDelete ? `
                  <button class="btn-icon delete ${isAdmin && !isOwner ? 'admin-action' : ''}" title="${isAdmin && !isOwner ? '👑 แอดมิน: ลบโพสต์นี้' : 'ลบโพสต์ของคุณ'}" onclick="Posts.deletePost('${post.id}')">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                ` : ''}

                <button class="btn btn-primary btn-sm" onclick="Posts.showPostDetails('${post.id}')">
                  ${actionBtnText}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // Show detailed modal for single post
  async showPostDetails(postId) {
    try {
      const data = await API.getPostById(postId);
      if (!data.success || !data.post) {
        alert('ไม่พบโพสต์นี้');
        return;
      }

      this.activePost = data.post;
      const post = data.post;
      const currentUser = Auth.currentUser;
      const isOwner = currentUser && currentUser.id === post.user_id;
      const isAdmin = currentUser && currentUser.role === 'admin';

      const modal = document.getElementById('post-detail-modal');
      const body = document.getElementById('post-detail-body');

      const img = (post.images && post.images.length > 0)
        ? post.images[0]
        : 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80';

      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${post.latitude || 13.2835},${post.longitude || 100.9240}`;

      const postType = post.post_type || 'swap';
      let typeLabel = '🔄 แลกเปลี่ยน (Swap)';
      let typeBadgeClass = 'user';
      let actionBtnLabel = 'ยื่นข้อเสนอขอแลกเปลี่ยน';
      let exchangeTitle = 'สิ่งที่ต้องการนำมาแลก:';

      if (postType === 'donation') {
        typeLabel = '🎁 บริจาค / แจกฟรี (Donation)';
        typeBadgeClass = 'admin';
        actionBtnLabel = '🙋 ขอรับสิ่งของนี้ (ฟรี)';
        exchangeTitle = 'เงื่อนไขการส่งต่อ:';
      } else if (postType === 'request') {
        typeLabel = '🙋 ขอรับบริจาค / ตามหา (Request)';
        actionBtnLabel = '🎁 ฉันมีสิ่งนี้และต้องการมอบให้';
        exchangeTitle = 'ความต้องการ / วัตถุประสงค์:';
      }

      body.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          <img src="${img}" style="width: 100%; max-height: 320px; object-fit: cover; border-radius: var(--radius-md);">

          <div>
            <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap;">
              <span class="role-tag ${typeBadgeClass}">${typeLabel}</span>
              <span class="role-tag user">${post.category}</span>
              <span class="role-tag" style="background: #f1f5f9; color: var(--text-main); font-weight: 500;">สภาพ: ${post.condition}</span>
              <span class="role-tag" style="background: ${post.status === 'available' ? '#d1fae5' : '#fef3c7'}; color: ${post.status === 'available' ? '#065f46' : '#92400e'};">
                ${post.status === 'available' ? (postType === 'donation' ? 'เปิดรับผู้ขอ' : (postType === 'request' ? 'กำลังตามหา' : 'พร้อมแลก')) : (post.status === 'negotiating' ? 'กำลังดำเนินการ' : 'เสร็จสิ้นแล้ว')}
              </span>
            </div>
            <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem;">${post.title}</h2>
            <p style="color: var(--text-muted); line-height: 1.6; font-size: 0.95rem; white-space: pre-line;">${post.description || 'ไม่มีคำอธิบายเพิ่มเติม'}</p>
          </div>

          <div class="post-exchange-box" style="padding: 0.85rem; font-size: 0.95rem; ${postType === 'donation' ? 'background: #f5f3ff; border-color: #c4b5fd; color: #5b21b6;' : (postType === 'request' ? 'background: #fffbeb; border-color: #fde68a; color: #92400e;' : '')}">
            <i class="fa-solid ${postType === 'donation' ? 'fa-gift' : (postType === 'request' ? 'fa-hand-holding-heart' : 'fa-rotate')} fa-lg" style="margin-top: 3px;"></i>
            <div>
              <strong style="font-size: 1rem;">${exchangeTitle}</strong>
              <div style="margin-top: 2px;">${post.desired_exchange || 'ไม่มีเงื่อนไขเพิ่มเติม'}</div>
            </div>
          </div>

          <!-- Location & Map -->
          <div style="background: var(--bg-main); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.85rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <div style="font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 0.4rem;">
                <i class="fa-solid fa-location-dot" style="color: var(--primary);"></i>
                <span>จุดนัดรับ: ${post.location_name || 'มหาวิทยาลัยบูรพา บางแสน'}</span>
              </div>
              <a href="${googleMapsUrl}" target="_blank" class="btn btn-secondary btn-sm" style="font-size: 0.75rem;">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> นำทางใน Google Maps
              </a>
            </div>
            <div id="detail-map-container" class="map-container" style="height: 180px;"></div>
          </div>

          <!-- Owner Profile -->
          <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: var(--bg-main); border-radius: var(--radius-sm); border: 1px solid var(--border);">
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(post.user_name || post.user_id)}" style="width: 42px; height: 42px; border-radius: 50%;">
            <div>
              <div style="font-weight: 600; font-size: 0.95rem;">${post.user_name}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">ผู้โพสต์ • ${new Date(post.created_at).toLocaleDateString('th-TH')}</div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
            ${!isOwner ? `
              <button class="btn btn-primary" style="flex: 1;" onclick="Swaps.showProposeModal('${post.id}')" ${post.status !== 'available' ? 'disabled' : ''}>
                <i class="fa-solid ${postType === 'donation' ? 'fa-hand' : (postType === 'request' ? 'fa-gift' : 'fa-handshake')}"></i> ${post.status === 'available' ? actionBtnLabel : 'รายการนี้เสร็จสิ้นหรือกำลังดำเนินการอยู่'}
              </button>
            ` : `
              <div style="flex: 1; text-align: center; padding: 0.5rem; background: #e0f2fe; border-radius: var(--radius-sm); color: #0369a1; font-weight: 600; font-size: 0.9rem;">
                <i class="fa-solid fa-user-check"></i> นี่คือโพสต์ของคุณเอง
              </div>
            `}

            ${isOwner || isAdmin ? `
              <button class="btn btn-secondary btn-sm" onclick="Posts.showEditModal('${post.id}')">
                <i class="fa-solid fa-pen"></i> แก้ไข
              </button>
              <button class="btn btn-danger btn-sm" onclick="Posts.deletePost('${post.id}')">
                <i class="fa-solid fa-trash"></i> ลบ
              </button>
            ` : ''}
          </div>
        </div>
      `;

      modal.classList.add('active');

      // Initialize mini map after DOM is visible
      setTimeout(() => {
        MapManager.initDetailMap(post.latitude, post.longitude, post.location_name);
      }, 200);

    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  },

  // Show Create Modal
  showCreateModal() {
    if (!Auth.currentUser) {
      alert('กรุณาเข้าสู่ระบบก่อนสร้างโพสต์');
      return;
    }
    const modal = document.getElementById('post-form-modal');
    document.getElementById('post-modal-title').textContent = 'สร้างโพสต์ใหม่ (บริจาค / ขอรับ / แลกเปลี่ยน)';
    document.getElementById('post-id-hidden').value = '';
    document.getElementById('post-type-input').value = 'swap';
    document.getElementById('post-title-input').value = '';
    document.getElementById('post-desc-input').value = '';
    document.getElementById('post-cat-input').value = 'เครื่องใช้ไฟฟ้า';
    document.getElementById('post-condition-input').value = 'มือสองสภาพดีมาก';
    document.getElementById('post-desired-input').value = '';
    document.getElementById('post-image-input').value = '';
    document.getElementById('post-location-input').value = 'มหาวิทยาลัยบูรพา ชลบุรี';

    this.onPostTypeChange('swap');
    modal.classList.add('active');

    setTimeout(() => {
      MapManager.initPickerMap(MapManager.DEFAULT_LAT, MapManager.DEFAULT_LNG);
    }, 200);
  },

  // Show Edit Modal (Owner or Admin)
  async showEditModal(postId) {
    try {
      const data = await API.getPostById(postId);
      if (!data.success || !data.post) return;
      const post = data.post;

      const currentUser = Auth.currentUser;
      const isOwner = currentUser && currentUser.id === post.user_id;
      const isAdmin = currentUser && currentUser.role === 'admin';

      if (!isOwner && !isAdmin) {
        alert('คุณไม่มีสิทธิ์แก้ไขโพสต์นี้');
        return;
      }

      const modal = document.getElementById('post-form-modal');
      document.getElementById('post-modal-title').textContent = isAdmin && !isOwner
        ? `👑 แอดมินแก้ไขโพสต์: ${post.title}`
        : 'แก้ไขโพสต์ของคุณ';

      document.getElementById('post-id-hidden').value = post.id;
      document.getElementById('post-type-input').value = post.post_type || 'swap';
      document.getElementById('post-title-input').value = post.title;
      document.getElementById('post-desc-input').value = post.description || '';
      document.getElementById('post-cat-input').value = post.category;
      document.getElementById('post-condition-input').value = post.condition;
      document.getElementById('post-desired-input').value = post.desired_exchange || '';
      document.getElementById('post-image-input').value = (post.images && post.images.length > 0) ? post.images[0] : '';
      document.getElementById('post-location-input').value = post.location_name || 'มหาวิทยาลัยบูรพา ชลบุรี';

      this.onPostTypeChange(post.post_type || 'swap');

      // Close details modal if open
      document.getElementById('post-detail-modal')?.classList.remove('active');
      modal.classList.add('active');

      setTimeout(() => {
        MapManager.initPickerMap(post.latitude || MapManager.DEFAULT_LAT, post.longitude || MapManager.DEFAULT_LNG);
      }, 200);
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  },

  // Handler for Post Type selection in modal
  onPostTypeChange(type) {
    const desiredGroup = document.getElementById('desired-exchange-group');
    const desiredLabel = document.getElementById('desired-exchange-label');
    const desiredInput = document.getElementById('post-desired-input');

    if (!desiredGroup || !desiredLabel || !desiredInput) return;

    if (type === 'donation') {
      desiredLabel.textContent = 'เงื่อนไขการส่งต่อ (เว้นว่างได้ ระบบจะใส่ "แจกฟรี" ให้อัตโนมัติ)';
      desiredInput.placeholder = 'เช่น นัดรับได้ที่หอสมุด, แจกให้คนแรกที่สะดวกมารับ...';
    } else if (type === 'request') {
      desiredLabel.textContent = 'ความต้องการ / เหตุผลที่ขอรับบริจาค *';
      desiredInput.placeholder = 'เช่น ขอรับเพื่อนำไปใช้ประกอบการเรียนวิชา... ไม่มีงบซื้อ...';
    } else {
      desiredLabel.textContent = 'สิ่งที่ต้องการนำมาแลกด้วย (สิ่งที่อยากได้) *';
      desiredInput.placeholder = 'เช่น ชีทสรุปวิชาสถิติ, พัดลมตัวเล็ก, ขนม หรืออื่นๆ';
    }
  },

  // Save Post (Create or Update)
  async handleSavePost(e) {
    e.preventDefault();
    const currentUser = Auth.currentUser;
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    const id = document.getElementById('post-id-hidden').value;
    const post_type = document.getElementById('post-type-input').value;
    const title = document.getElementById('post-title-input').value;
    const description = document.getElementById('post-desc-input').value;
    const category = document.getElementById('post-cat-input').value;
    const condition = document.getElementById('post-condition-input').value;
    const desired_exchange = document.getElementById('post-desired-input').value;
    const imgUrl = document.getElementById('post-image-input').value;
    const location_name = document.getElementById('post-location-input').value;
    const lat = document.getElementById('post-lat').value;
    const lng = document.getElementById('post-lng').value;

    const images = imgUrl.trim() ? [imgUrl.trim()] : [
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80'
    ];

    try {
      if (id) {
        // UPDATE
        const res = await API.updatePost(id, {
          current_user_id: currentUser.id,
          current_user_role: currentUser.role,
          post_type,
          title,
          description,
          category,
          condition,
          desired_exchange,
          images,
          location_name,
          latitude: parseFloat(lat),
          longitude: parseFloat(lng)
        });

        if (res.success) {
          alert('✅ ' + (res.message || 'บันทึกการแก้ไขเรียบร้อย'));
          document.getElementById('post-form-modal').classList.remove('active');
          this.loadPosts();
        } else {
          alert('❌ ' + (res.message || 'เกิดข้อผิดพลาด'));
        }
      } else {
        // CREATE
        const res = await API.createPost({
          user_id: currentUser.id,
          user_name: currentUser.name,
          post_type,
          title,
          description,
          category,
          condition,
          desired_exchange,
          images,
          location_name,
          latitude: parseFloat(lat),
          longitude: parseFloat(lng)
        });

        if (res.success) {
          alert('🎉 สร้างโพสต์สำเร็จแล้ว!');
          document.getElementById('post-form-modal').classList.remove('active');
          this.loadPosts();
        } else {
          alert('❌ ' + (res.message || 'ไม่สามารถสร้างโพสต์ได้'));
        }
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  },

  // Delete Post (Owner or Admin)
  async deletePost(postId) {
    const currentUser = Auth.currentUser;
    if (!currentUser) return;

    const isAdmin = currentUser.role === 'admin';
    const confirmMsg = isAdmin
      ? '👑 คุณอยู่ในสถานะ Admin: ยืนยันการลบโพสต์นี้หรือไม่?'
      : 'คุณต้องการลบโพสต์นี้ใช่หรือไม่?';

    if (!confirm(confirmMsg)) return;

    try {
      const res = await API.deletePost(postId, {
        current_user_id: currentUser.id,
        current_user_role: currentUser.role
      });

      if (res.success) {
        alert('🗑️ ' + (res.message || 'ลบโพสต์สำเร็จ'));
        document.getElementById('post-detail-modal')?.classList.remove('active');
        this.loadPosts();
      } else {
        alert('❌ ' + (res.message || 'ไม่สามารถลบโพสต์ได้'));
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  }
};
