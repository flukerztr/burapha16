const express = require('express');
const router = express.Router();
require('dotenv').config();

// Specialized Knowledge Base for Burapha 16 Dev: Swap, Donate & Request Platform
const SYSTEM_PROMPT = `
คุณคือ "AI ผู้ช่วยประจำระบบ Burapha 16 Dev" (แพลตฟอร์มเว็บและแอปพลิเคชัน บริจาค / ขอรับบริจาค / แลกเปลี่ยนสิ่งของเหลือใช้ สำหรับชาว มหาวิทยาลัยบูรพา และบุคคลทั่วไป)
หน้าที่ของคุณคือ:
1. ตอบคำถามและให้คำแนะนำเกี่ยวกับการใช้งานเว็บ/แอปพลิเคชัน Burapha 16 Dev
2. อธิบายรูปแบบของระบบที่มี 3 ประเภทหลัก:
   - 🔄 "แลกเปลี่ยน (Swap)": การนำสิ่งของที่มีมาแลกเปลี่ยนกับสิ่งของที่ต้องการ โดยระบุสิ่งที่อยากแลกด้วย
   - 🎁 "บริจาค / แจกฟรี (Donation / Give Away)": การส่งต่อสิ่งของเหลือใช้ให้ผู้อื่นฟรี 100% โดยไม่คิดค่าใช้จ่ายและไม่ต้องการสิ่งของตอบแทน
   - 🙋 "ขอรับบริจาค / ตามหา (Request / Wishlist)": ผู้ที่ต้องการสิ่งของหรือมีความจำเป็น เช่น อุปกรณ์การเรียน ชีทสรุป หรือของใช้ สามารถโพสต์ตามหาหรือขอรับบริจาคได้
3. อธิบายกระบวนการและฟังก์ชันการทำงานของระบบ:
   - "ระบบนี้ไม่มีการใช้เงินหรือชำระเงิน": มุ่งเน้นการแบ่งปันและหมุนเวียนทรัพยากรเพื่อความยั่งยืน
   - "ระบบการตรวจสอบยืนยันการรับของ (Confirmation Verification)": ไม่ว่าจะเป็นการแลกหรือการบริจาค เมื่อทั้งสองฝ่ายนัดส่งมอบของแล้ว ทั้งสองคนต้องกดยืนยันว่า "ได้รับ/ส่งมอบของเรียบร้อยแล้ว" (Dual-Confirmation) จึงจะถือว่าเสร็จสมบูรณ์
   - "ระบบแชทส่วนตัว": เปิดใช้งานอัตโนมัติเมื่อเจ้าของโพสต์กดตอบรับ เพื่อความเป็นส่วนตัวและความปลอดภัย
   - "ระบบปักหมุด GPS": ระบุตำแหน่งนัดรับสิ่งของ เช่น สำนักหอสมุด ม.บูรพา, ตึก IT, ซอยสดใส
   - "สิทธิ์ของผู้ใช้และแอดมิน": ผู้ใช้ทั่วไปแก้ไข/ลบได้เฉพาะโพสต์ตัวเอง ส่วนแอดมินแก้ไข/ลบได้ทุกโพสต์
4. บุคลิก: สุภาพ เป็นมิตร อารมณ์ดี ใช้ภาษาไทยเข้าใจง่าย กระตือรือร้นช่วยเหลือ
`;

// Smart Local Fallback Responses when GEMINI_API_KEY is not configured
function getLocalSmartAnswer(query) {
  const q = (query || '').toLowerCase();

  if (q.includes('บริจาค') || q.includes('แจกฟรี') || q.includes('ขอรับ') || q.includes('ตามหา') || q.includes('ประเภท')) {
    return `🎁 **ระบบรองรับ 3 รูปแบบหลัก ดังนี้ครับ:**
1. 🔄 **แลกเปลี่ยน (Swap):** นำของเหลือใช้มาแลกกับสิ่งของที่คุณต้องการ (ระบุสิ่งที่อยากแลก)
2. 🎁 **บริจาค / แจกฟรี (Donation):** ส่งต่อสิ่งของให้เพื่อนๆ ฟรี 100% ไม่มีค่าใช้จ่ายและไม่ต้องมีของมาแลก
3. 🙋 **ขอรับบริจาค / ตามหา (Request):** โพสต์บอกสิ่งที่ต้องการ เช่น หนังสือเรียน ชีทสรุป หรือเครื่องใช้ไฟฟ้า เพื่อขอรับความช่วยเหลือจากเพื่อนๆ ที่ไม่ได้ใช้งานแล้วครับ!`;
  }

  if (q.includes('ยืนยัน') || q.includes('รับของ') || q.includes('ได้ของ') || q.includes('เสร็จสมบูรณ์')) {
    return `📦 **ระบบการตรวจสอบยืนยันการรับของ (Verification Flow):**
เนื่องจาก Burapha 16 Dev เป็นระบบส่งต่อสิ่งของโดยไม่มีการชำระเงิน เราจึงมีระบบตรวจสอบแบบ **สองฝ่ายยืนยัน (Dual Confirmation)** ดังนี้ครับ:
1. เมื่อทั้งสองฝ่ายนัดพบและส่งมอบสิ่งของกันเรียบร้อยแล้ว
2. ทั้งสองฝ่ายเข้าไปที่เมนู **"รายการแลกเปลี่ยน/รับบริจาค"** หรือใน **"ห้องแชทส่วนตัว"**
3. แต่ละฝ่ายกดปุ่ม **"✅ ยืนยันว่าได้รับของแล้ว"**
4. เมื่อ **ทั้งสองคนกดยืนยันครบทั้งคู่** ระบบจะเปลี่ยนสถานะเป็น **"สำเร็จสมบูรณ์ (Completed)"** และปิดรายการทันทีครับ!`;
  }

  if (q.includes('แอดมิน') || q.includes('admin') || q.includes('สิทธิ์') || q.includes('ลบโพสต์')) {
    return `🛡️ **สิทธิ์การใช้งานระหว่างผู้ใช้ทั่วไป และ แอดมิน (Admin):**
- **สมาชิกทั่วไป (User):** สามารถสร้างโพสต์ และมีสิทธิ์ **แก้ไขหรือลบได้เฉพาะโพสต์ของตัวเองเท่านั้น**
- **แอดมิน (Admin):** มีสิทธิ์สูงสุดในการดูแลแพลตฟอร์ม สามารถ **แก้ไขหรือลบโพสต์ของตนเองและโพสต์ของสมาชิกคนอื่นๆ ได้ทั้งหมด** เพื่อป้องกันการโพสต์สิ่งของผิดกฎหมายหรือไม่เหมาะสมครับ`;
  }

  if (q.includes('gps') || q.includes('แผนที่') || q.includes('ปักหมุด') || q.includes('พิกัด') || q.includes('ตำแหน่ง')) {
    return `📍 **ระบบการปักหมุด GPS บนแผนที่:**
- ในหน้า **"สร้างโพสต์ใหม่"** คุณสามารถเลือกประเภทโพสต์ แล้วกดปุ่ม **"📍 ใช้ตำแหน่งปัจจุบันของฉัน"** หรือคลิกบนแผนที่เพื่อปักหมุดจุดนัดรับของ เช่น ซอยสดใส, หน้าหอสมุด ม.บูรพา หรือตึก IT
- ในหน้าแรก สามารถเปิดแท็บ **"🗺️ แผนที่สำรวจสิ่งของ"** เพื่อดูหมุดสิ่งของรอบตัวและกดดูรายละเอียดได้ทันทีครับ!`;
  }

  if (q.includes('แชท') || q.includes('คุย') || q.includes('ติดต่อ') || q.includes('ข้อความ')) {
    return `💬 **ระบบแชทส่วนตัว (1-on-1 Chat):**
- เพื่อความเป็นส่วนตัว ระบบแชทจะเปิดขึ้นระหว่าง 2 คน **เมื่อเจ้าของโพสต์กด "ตอบรับข้อเสนอ"** เรียบร้อยแล้ว
- ทั้งสองคนสามารถพิมพ์ข้อความพูดคุย ตกลงเวลา และจุดนัดหมายส่งมอบของได้แบบเรียลไทม์
- ในห้องแชทจะมีปุ่มลัดสำหรับ **"ยืนยันว่าได้รับของแล้ว"** ได้ทันทีโดยไม่ต้องสลับหน้าจอครับ!`;
  }

  if (q.includes('เงิน') || q.includes('จ่ายเงิน') || q.includes('โอนเงิน') || q.includes('ราคา') || q.includes('ขาย')) {
    return `💡 **ระบบ Burapha 16 Dev มีการใช้เงินหรือไม่?**
ระบบนี้ **"ไม่มีระบบชำระเงินหรือการซื้อขายด้วยเงิน"** ครับ! 
คอนเซ็ปต์ของเราคือการแลกเปลี่ยนและบริจาคส่งต่อสิ่งของเหลือใช้ (Swap & Donation) เพื่อความยั่งยืน เป็นมิตรต่อสิ่งแวดล้อม และแบ่งปันทรัพยากรในรั้วมหาวิทยาลัยบูรพาครับ`;
  }

  return `สวัสดีครับ! ยินดีต้อนรับสู่ **Burapha 16 Dev** แพลตฟอร์มบริจาค รับบริจาค และแลกเปลี่ยนสิ่งของเหลือใช้ ♻️

คุณสามารถสอบถามผมเกี่ยวกับระบบได้เลย เช่น:
- 🎁 *ระบบบริจาค แจกฟรี และขอรับบริจาค ทำงานอย่างไร?*
- 📦 *ระบบตรวจสอบการยืนยันว่าได้ของทำงานอย่างไร?*
- 💬 *ระบบแชทส่วนตัวใช้งานตอนไหน?*
- 📍 *การปักหมุด GPS มีประโยชน์อย่างไร?*
- 🛡️ *สิทธิ์ของแอดมินกับผู้ใช้ทั่วไปต่างกันอย่างไร?*

ยินดีให้คำแนะนำตลอด 24 ชั่วโมงครับ!`;
}

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  const apiKey = process.env.GEMINI_API_KEY || req.headers['x-gemini-key'];

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อความคำถาม' });
  }

  // 1. If GEMINI_API_KEY is configured, call official Gemini 3.5 Flash-Lite API
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const contents = [];

      // Add conversation history
      if (Array.isArray(history) && history.length > 0) {
        history.slice(-6).forEach(h => {
          contents.push({
            role: h.sender === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          });
        });
      }

      // Add current message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      // Call Google Gemini 3.5 Flash-Lite endpoint
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey.trim()}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (replyText) {
          return res.json({
            success: true,
            reply: replyText,
            engine: 'gemini-3.5-flash-lite'
          });
        }
      } else {
        const errData = await response.text();
        console.warn('Gemini API call failed, falling back:', errData);
      }
    } catch (err) {
      console.warn('Gemini error, fallback activated:', err.message);
    }
  }

  // 2. Fallback response with smart knowledge engine
  const fallbackReply = getLocalSmartAnswer(message);
  return res.json({
    success: true,
    reply: fallbackReply,
    engine: 'burapha16-assistant-core',
    isFallback: !apiKey || apiKey.trim().length < 10,
    note: (!apiKey || apiKey.trim().length < 10)
      ? '💡 เคล็ดลับ: คุณสามารถใส่ GEMINI_API_KEY ในไฟล์ .env เพื่อเปิดใช้งานพลังเต็มของ Google Gemini 2.5 Flash'
      : undefined
  });
});

module.exports = router;
