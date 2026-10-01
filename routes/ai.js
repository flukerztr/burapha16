const express = require('express');
const router = express.Router();
require('dotenv').config();

// Specialized Knowledge Base for Burapha 16 Dev SecondHand Swap Platform
const SYSTEM_PROMPT = `
คุณคือ "AI ผู้ช่วยประจำระบบ Burapha 16 Dev" (แพลตฟอร์มเว็บและแอปพลิเคชันแลกเปลี่ยนสิ่งของเหลือใช้สำหรับชาว มหาวิทยาลัยบูรพา และบุคคลทั่วไป)
หน้าที่ของคุณคือ:
1. ตอบคำถามและให้คำแนะนำเกี่ยวกับการใช้งานเว็บ/แอปพลิเคชัน Burapha 16 Dev
2. อธิบายกระบวนการและฟังก์ชันการทำงานของระบบ เช่น:
   - "ระบบนี้ไม่มีการใช้เงินหรือชำระเงิน" เน้นการแลกเปลี่ยนสิ่งของต่อสิ่งของ (Item for Item) เพื่อลดขยะและประหยัดค่าใช้จ่าย
   - "ระบบการตรวจสอบยืนยันการรับของ (Confirmation Verification)": เมื่อทั้งสองฝ่ายนัดรับของแล้ว ทั้งสองคนต้องกดยืนยันว่า "ได้รับของเรียบร้อยแล้ว" (Dual-Confirmation) จึงจะถือว่าการแลกเปลี่ยนเสร็จสมบูรณ์ 100%
   - "ระบบแชทส่วนตัว": จะเปิดใช้งานอัตโนมัติเมื่อเจ้าของโพสต์กด "ตอบรับข้อเสนอแลกเปลี่ยน" เพื่อความปลอดภัยและความเป็นส่วนตัว
   - "ระบบปักหมุด GPS": ช่วยให้ผู้ใช้งานระบุตำแหน่งสิ่งของ เช่น สำนักหอสมุด, ซอยสดใส, ตึก IT หรือพิกัดใน ม.บูรพา บางแสน และดูตำแหน่งบนแผนที่แบบ Realtime ได้
   - "สิทธิ์ของผู้ใช้และแอดมิน":
     * สมาชิกทั่วไป: สามารถสร้างโพสต์ และ "แก้ไข/ลบโพสต์ของตัวเองเท่านั้น"
     * แอดมิน (Admin): มีสิทธิ์พิเศษ สามารถ "แก้ไขและลบโพสต์ได้ทุกโพสต์" ทั้งของตนเองและของสมาชิกคนอื่นเพื่อการดูแลความเรียบร้อย
3. แนะนำเทคนิคการแลกเปลี่ยนของให้ปลอดภัย (นัดเจอในที่สาธารณะ เช่น หอสมุด ม.บูรพา, ตึกเรียน, โรงอาหาร)
4. บุคลิก: สุภาพ เป็นมิตร อารมณ์ดี ใช้ภาษาไทยที่เข้าใจง่าย ชัดเจน และกระตือรือร้นช่วยเหลือ
`;

// Smart Local Fallback Responses when GEMINI_API_KEY is not configured
function getLocalSmartAnswer(query) {
  const q = (query || '').toLowerCase();

  if (q.includes('ยืนยัน') || q.includes('รับของ') || q.includes('ได้ของ') || q.includes('เสร็จสมบูรณ์')) {
    return `📦 **ระบบการตรวจสอบยืนยันการรับของ (Verification Flow):**
เนื่องจาก Burapha 16 Dev เป็นระบบแลกเปลี่ยนสิ่งของโดยไม่มีการชำระเงิน เราจึงมีระบบตรวจสอบแบบ **สองฝ่ายยืนยัน (Dual Confirmation)** ดังนี้ครับ:
1. เมื่อทั้งสองฝ่ายนัดพบและส่งมอบสิ่งของกันเรียบร้อยแล้ว
2. ผู้แลกทั้ง 2 คนเข้าไปที่เมนู **"รายการแลกเปลี่ยน"** หรือใน **"ห้องแชท"**
3. แต่ละฝ่ายกดปุ่ม **"✅ ยืนยันว่าได้รับของแล้ว"**
4. เมื่อ **ทั้งสองคนกดยืนยันครบทั้งคู่** ระบบจะเปลี่ยนสถานะเป็น **"แลกเปลี่ยนสำเร็จ (Completed)"** และบันทึกประวัติทันทีครับ!`;
  }

  if (q.includes('แอดมิน') || q.includes('admin') || q.includes('สิทธิ์') || q.includes('ลบโพสต์')) {
    return `🛡️ **สิทธิ์การใช้งานระหว่างผู้ใช้ทั่วไป และ แอดมิน (Admin):**
- **สมาชิกทั่วไป (User):** สามารถสร้างโพสต์ และมีสิทธิ์ **แก้ไขหรือลบได้เฉพาะโพสต์ของตัวเองเท่านั้น**
- **แอดมิน (Admin):** มีสิทธิ์สูงสุดในการดูแลแพลตฟอร์ม สามารถ **แก้ไขหรือลบโพสต์ของตนเองและโพสต์ของสมาชิกคนอื่นๆ ได้ทั้งหมด** เพื่อป้องกันการโพสต์สิ่งของผิดกฎหมายหรือไม่เหมาะสมครับ`;
  }

  if (q.includes('gps') || q.includes('แผนที่') || q.includes('ปักหมุด') || q.includes('พิกัด') || q.includes('ตำแหน่ง')) {
    return `📍 **ระบบการปักหมุด GPS บนแผนที่:**
- ในหน้า **"สร้างโพสต์ใหม่"** คุณสามารถกดปุ่ม **"📍 ใช้ตำแหน่งปัจจุบันของฉัน"** เพื่อดึงพิกัด GPS อัตโนมัติ หรือคลิกบนแผนที่เพื่อปักหมุดจุดนัดรับของ เช่น ซอยสดใส, หน้าหอสมุด ม.บูรพา หรือตึก IT
- ในหน้าแรก สามารถเปิดแท็บ **"🗺️ แผนที่สำรวจสิ่งของ"** เพื่อดูหมุดสิ่งของรอบตัวและกดดูรายละเอียดได้ทันทีครับ!`;
  }

  if (q.includes('แชท') || q.includes('คุย') || q.includes('ติดต่อ') || q.includes('ข้อความ')) {
    return `💬 **ระบบแชทส่วนตัว (1-on-1 Chat):**
- เพื่อความเป็นส่วนตัว ระบบแชทจะเปิดขึ้นระหว่าง 2 คน **เมื่อเจ้าของโพสต์กด "ตอบรับข้อเสนอแลกเปลี่ยน"** เรียบร้อยแล้ว
- ทั้งสองคนสามารถพิมพ์ข้อความพูดคุย ตกลงเวลา และจุดนัดหมายส่งมอบของได้แบบเรียลไทม์
- ในห้องแชทจะมีปุ่มลัดสำหรับ **"ยืนยันว่าได้รับของแล้ว"** ได้ทันทีโดยไม่ต้องสลับหน้าจอครับ!`;
  }

  if (q.includes('เงิน') || q.includes('จ่ายเงิน') || q.includes('โอนเงิน') || q.includes('ราคา') || q.includes('ขาย')) {
    return `💡 **ระบบ Burapha 16 Dev มีการใช้เงินหรือไม่?**
ระบบนี้ **"ไม่มีระบบชำระเงินหรือการซื้อขายด้วยเงิน"** ครับ! 
คอนเซ็ปต์ของเราคือการแลกเปลี่ยนสิ่งของเหลือใช้ (Barter / Item Swap) เพื่อความยั่งยืน เป็นมิตรต่อสิ่งแวดล้อม และแบ่งปันทรัพยากรที่มีประโยชน์ในรั้วมหาวิทยาลัยบูรพาครับ`;
  }

  if (q.includes('ความปลอดภัย') || q.includes('ปลอดภัย') || q.includes('โกง') || q.includes('นัด')) {
    return `🛡️ **คำแนะนำในการนัดแลกของให้ปลอดภัย:**
1. **นัดพบในที่สาธารณะและมีแสงสว่างเพียงพอ** เช่น หน้าสำนักหอสมุด ม.บูรพา, โรงอาหาร, หรือหน้าอาคารเรียน
2. **ตรวจสอบสภาพสิ่งของจริง** ต่อหน้าอีกฝ่ายก่อนกดยืนยันรับของ
3. **ใช้ระบบแชทในแอป** ในการสนทนาและบันทึกข้อตกลง`;
  }

  return `สวัสดีครับ! ยินดีต้อนรับสู่ **Burapha 16 Dev** แพลตฟอร์มแลกเปลี่ยนสิ่งของเหลือใช้ ♻️

คุณสามารถสอบถามผมเกี่ยวกับระบบได้เลย เช่น:
- 📦 *ระบบตรวจสอบการยืนยันว่าได้ของทำงานอย่างไร?*
- 💬 *ระบบแชทส่วนตัวใช้งานตอนไหน?*
- 📍 *การปักหมุด GPS มีประโยชน์อย่างไร?*
- 🛡️ *สิทธิ์ของแอดมินกับผู้ใช้ทั่วไปต่างกันอย่างไร?*
- 💡 *ทำไมระบบนี้ถึงไม่มีการชำระเงิน?*

ยินดีให้คำแนะนำตลอด 24 ชั่วโมงครับ!`;
}

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  const apiKey = process.env.GEMINI_API_KEY || req.headers['x-gemini-key'];

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อความคำถาม' });
  }

  // 1. If GEMINI_API_KEY is configured, call official Gemini API
  if (apiKey && apiKey.trim().length > 10) {
    try {
      // Build conversation contents
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

      // Call Google Gemini API endpoint (gemini-3.8-flash or gemini-2.5-flash)
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey.trim()}`;

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
            engine: 'gemini-2.5-flash'
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
