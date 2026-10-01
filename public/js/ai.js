// AI Assistant Module (Powered by Google Gemini API)
const AIAssistant = {
  history: [],
  isOpen: false,

  init() {
    this.addBotMessage(
      'สวัสดีครับ! ผมคือ **AI ผู้ช่วยประจำระบบ Burapha 16 Dev** 🤖\n\nยินดีตอบทุกข้อสงสัยเกี่ยวกับการใช้งานเว็บและแอปพลิเคชันนี้ เช่น การสร้างโพสต์, การปักหมุด GPS, หรือระบบยืนยันการรับของ ถามผมได้เลยครับ!'
    );
  },

  toggle() {
    const drawer = document.getElementById('ai-drawer');
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      drawer.classList.add('active');
    } else {
      drawer.classList.remove('active');
    }
  },

  askPrompt(text) {
    document.getElementById('ai-input-text').value = text;
    this.handleSubmit(new Event('submit'));
  },

  addUserMessage(text) {
    const container = document.getElementById('ai-messages-container');
    const msgEl = document.createElement('div');
    msgEl.className = 'ai-bubble user';
    msgEl.textContent = text;
    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;
  },

  addBotMessage(text, note) {
    const container = document.getElementById('ai-messages-container');
    const msgEl = document.createElement('div');
    msgEl.className = 'ai-bubble bot';

    // Simple markdown format for bold & lists
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n- /g, '<br>• ')
      .replace(/\n\d+\. /g, (match) => `<br>${match.trim()} `);

    if (note) {
      formatted += `<div style="margin-top: 8px; font-size: 0.72rem; color: #6366f1; border-top: 1px dashed #cbd5e1; padding-top: 4px;">${note}</div>`;
    }

    msgEl.innerHTML = formatted;
    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;
  },

  async handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('ai-input-text');
    const question = input.value.trim();
    if (!question) return;

    input.value = '';
    this.addUserMessage(question);

    // Show loading indicator
    const container = document.getElementById('ai-messages-container');
    const loadingEl = document.createElement('div');
    loadingEl.className = 'ai-bubble bot';
    loadingEl.id = 'ai-loading-bubble';
    loadingEl.innerHTML = '<i class="fa-solid fa-sparkles fa-spin" style="color: #4f46e5;"></i> กำลังประมวลผลคำตอบ...';
    container.appendChild(loadingEl);
    container.scrollTop = container.scrollHeight;

    try {
      const res = await API.askAI(question, this.history);
      loadingEl.remove();

      if (res.success && res.reply) {
        this.addBotMessage(res.reply, res.note);
        this.history.push({ sender: 'user', text: question });
        this.history.push({ sender: 'bot', text: res.reply });
      } else {
        this.addBotMessage('ขออภัยครับ ไม่สามารถประมวลผลคำตอบได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err) {
      loadingEl.remove();
      this.addBotMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message);
    }
  }
};
