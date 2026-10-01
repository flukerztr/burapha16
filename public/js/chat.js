// Private 1-on-1 Real-time Chat Module
const Chat = {
  activeSwapId: null,
  partnerName: '',
  postTitle: '',
  swapStatus: '',
  pollTimer: null,

  openChat(swapId, postTitle, partnerName, status) {
    this.activeSwapId = swapId;
    this.postTitle = postTitle;
    this.partnerName = partnerName;
    this.swapStatus = status;

    const drawer = document.getElementById('chat-drawer');
    const headerTitle = document.getElementById('chat-partner-name');
    const itemBanner = document.getElementById('chat-item-title');
    const statusTag = document.getElementById('chat-status-tag');

    if (headerTitle) headerTitle.textContent = partnerName;
    if (itemBanner) itemBanner.textContent = postTitle;
    if (statusTag) {
      statusTag.textContent = status === 'completed' ? 'แลกเปลี่ยนสำเร็จ' : 'กำลังแลกเปลี่ยน';
      statusTag.className = `role-tag ${status === 'completed' ? 'user' : 'admin'}`;
    }

    drawer.classList.add('active');
    this.loadMessages();

    // Start auto polling for live messages
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      this.loadMessages(true);
    }, 3000);
  },

  closeChat() {
    const drawer = document.getElementById('chat-drawer');
    if (drawer) drawer.classList.remove('active');
    this.activeSwapId = null;
    this.stopPolling();
  },

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  },

  async loadMessages(isPolling = false) {
    if (!this.activeSwapId) return;

    try {
      const data = await API.getChatMessages(this.activeSwapId);
      if (data.success && data.messages) {
        this.renderMessages(data.messages, isPolling);
      }
    } catch (err) {
      console.warn('Chat load error:', err);
    }
  },

  renderMessages(messages, isPolling = false) {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    const currentUser = Auth.currentUser;
    const isScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 50;

    container.innerHTML = messages.map(msg => {
      if (msg.is_system) {
        return `
          <div class="chat-bubble system">
            <i class="fa-solid fa-bell"></i> ${msg.message}
          </div>
        `;
      }

      const isMine = currentUser && msg.sender_id === currentUser.id;
      return `
        <div class="chat-bubble ${isMine ? 'mine' : 'theirs'}">
          <div style="font-size: 0.72rem; opacity: 0.8; margin-bottom: 2px;">
            ${isMine ? 'ฉัน' : msg.sender_name}
          </div>
          <div>${msg.message}</div>
          <div style="font-size: 0.65rem; opacity: 0.7; text-align: right; margin-top: 3px;">
            ${new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      `;
    }).join('');

    if (!isPolling || isScrolledToBottom) {
      container.scrollTop = container.scrollHeight;
    }
  },

  async sendMessage(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input-text');
    const text = input.value.trim();
    if (!text || !this.activeSwapId) return;

    const currentUser = Auth.currentUser;
    if (!currentUser) return;

    input.value = '';

    try {
      const res = await API.sendChatMessage(this.activeSwapId, {
        sender_id: currentUser.id,
        sender_name: currentUser.name,
        message: text
      });

      if (res.success) {
        this.loadMessages();
      }
    } catch (err) {
      alert('ไม่สามารถส่งข้อความได้: ' + err.message);
    }
  }
};
