# ♻️ Burapha 16 Dev - SecondHand Swap
> **แพลตฟอร์มเว็บและแอปพลิเคชันแลกเปลี่ยนสิ่งของเหลือใช้**  
> มหาวิทยาลัยบูรพา (Burapha University) และพื้นที่ใกล้เคียง

---

## 🌟 ฟีเจอร์หลักของระบบ (Features)

1. **เว็บพร้อมแอปพลิเคชัน (Responsive & PWA)**
   - ออกแบบ UI/UX โมเดิร์น รองรับทั้งบนคอมพิวเตอร์ แท็บเล็ต และสมาร์ทโฟน
   - รองรับ **PWA (Progressive Web App)** สามารถกด *"เพิ่มไปยังหน้าจอโฮม (Install / Add to Home Screen)"* เพื่อใช้งานเสมือนแอปพลิเคชันมือถือได้ทันที

2. **ระบบแลกเปลี่ยนสิ่งของ ไร้เงินสด 100% (Barter & No Payment)**
   - ไม่มีระบบชำระเงิน เน้นการส่งต่อและแลกเปลี่ยนสิ่งของเหลือใช้ (Item-for-Item) เพื่อความยั่งยืนและลดปริมาณขยะ
   - ผู้ใช้งานสามารถระบุ *"สิ่งที่ต้องการนำมาแลกด้วย"* เช่น หนังสือ, เครื่องคิดเลข, พัดลม, อุปกรณ์ไอที ฯลฯ

3. **ระบบตรวจสอบการยืนยันว่าได้รับของแล้ว (Dual-Confirmation Verification)**
   - เมื่อทั้งสองฝ่ายตกลงแลกเปลี่ยนและนัดรับของกันแล้ว
   - มีระบบตรวจสอบความโปร่งใสแบบ **สองฝ่ายยืนยัน (Dual-Confirmation)**
   - ฝั่งเจ้าของและฝั่งผู้ขอแลกต้องกดยืนยันว่า *"✅ ได้รับสิ่งของเรียบร้อยแล้ว"*
   - เมื่อยืนยันครบทั้ง 2 คน ระบบจึงจะปรับสถานะเป็น **"แลกเปลี่ยนสำเร็จ (Completed 100%)"** และเปลี่ยนสถานะโพสต์เป็น **"แลกเปลี่ยนแล้ว"** อัตโนมัติ

4. **ระบบแชทส่วนตัว (1-on-1 Private Chat)**
   - เมื่อเจ้าของโพสต์กด **"ตกลงแลกเปลี่ยน (Accept Offer)"** ห้องแชทส่วนตัวระหว่างสองคนจะเปิดใช้งานทันที
   - สนทนาตกลงเวลานัดหมายและสถานที่รับของได้แบบเรียลไทม์
   - มีการแจ้งเตือนสถานะในห้องแชทอัตโนมัติเมื่ออีกฝ่ายกดยืนยันรับของ

5. **ระบบแชท AI อัจฉริยะ (Google Gemini API)**
   - รองรับ Google Gemini API (`gemini-2.5-flash` / `gemini-1.5-flash`)
   - ออกแบบมาเฉพาะเพื่อตอบคำถาม แนะนำการใช้งานเว็บ/แอปพลิเคชันนี้ เช่น วิธีสร้างโพสต์, วิธีปักหมุด GPS, ขั้นตอนการยืนยันรับของ, สิทธิ์แอดมิน, และข้อควรระวังในการนัดแลกของให้ปลอดภัย
   - มีระบบ Knowledge Core อัตโนมัติ แม้ยังไม่ได้ใส่ API Key ก็ตอบคำถามเกี่ยวกับระบบนี้ได้อย่างแม่นยำ

6. **ระบบการปัก GPS และแผนที่สำรวจสิ่งของ (Leaflet & OpenStreetMap)**
   - หน้าสร้าง/แก้ไขโพสต์: มีปุ่ม **"📍 ใช้ตำแหน่งปัจจุบันของฉัน"** (HTML5 Geolocation) และสามารถคลิก/ลากหมุดบนแผนที่เพื่อระบุจุดนัดรับของ
   - หน้าสำรวจแผนที่ (GPS Map Explorer): แสดงหมุดสิ่งของรอบ ม.บูรพา บางแสน คลิกที่หมุดเพื่อดูรูป รายละเอียด และกดยื่นข้อเสนอได้ทันที
   - หน้ารายละเอียดโพสต์: มีปุ่ม **"นำทางใน Google Maps"** เพื่อเปิดแผนที่นำทางไปยังจุดนัดรับจริง

7. **ระบบสิทธิ์ของผู้ใช้ และ แอดมิน (Role-Based Access Control)**
   - **สมาชิกทั่วไป (User):** สามารถสร้างโพสต์ และมีสิทธิ์แก้ไข/ลบได้ **เฉพาะโพสต์ของตัวเอง**
   - **ผู้ดูแลระบบ (Admin):** มีป้ายสัญลักษณ์ `👑 Admin` สามารถ **แก้ไขและลบได้ทุกโพสต์ในระบบ** ทั้งของตัวเองและของสมาชิกคนอื่น
   - **ระบบ Demo Role Switcher:** แถบสลับผู้ใช้มุมขวาบน ให้คุณสามารถทดสอบสลับเป็น **สมชาย (User 1)**, **สมหญิง (User 2)** หรือ **แอดมิน (Admin)** ได้ด้วยคลิกเดียวทันที

8. **ฐานข้อมูล Supabase PostgreSQL & Cloud Ready**
   - เชื่อมต่อกับ **Supabase** (PostgreSQL) ผ่าน `@supabase/supabase-js`
   - มีระบบ Fallback Store ภายในตัว ป้องกันระบบสะดุดในกรณีที่ออฟไลน์
   - มีไฟล์ Schema SQL (`supabase/schema.sql`) และ Seed Data (`supabase/seed.sql`) ครบถ้วน
   - พร้อมนำไป Deploy บน **Render** และ **Vercel**

---

## 🚀 วิธีการรันบนเครื่อง Local (Local Development)

### 1. ติดตั้ง Dependencies
เปิด Terminal หรือ PowerShell ที่โฟลเดอร์โครงการ:
```bash
npm install
```

### 2. ตั้งค่าไฟล์ `.env`
ไฟล์ `.env` ถูกสร้างและเชื่อมต่อกับฐานข้อมูล Supabase ของคุณเรียบร้อยแล้ว:
```env
PORT=3000
SUPABASE_URL=https://qwzockczsnynwdgenidq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=ใส่_API_Key_ของคุณ_ถ้ามี
```
> *(หากต้องการใช้พลังเต็มรูปแบบของ Google Gemini สามารถขอ API Key ฟรีได้ที่ [Google AI Studio](https://aistudio.google.com/) แล้วนำมาวางใน `GEMINI_API_KEY`)*

### 3. รันโปรเจกต์
```bash
npm start
# หรือ
npm run dev
```
เปิดเบราว์เซอร์ไปที่: **`http://localhost:3000`**

---

## ☁️ วิธีการ Deploy บน Render (แนะนำสำหรับ Fullstack Web Service)

1. นำโค้ดขึ้น GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/burapha16.git
   git branch -M main
   git push -u origin main
   ```
2. ไปที่ [Render Dashboard](https://dashboard.render.com/) -> คลิก **New +** -> เลือก **Web Service**
3. เลือก Repository `burapha16` ของคุณ
4. ตั้งค่าดังนี้:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. ในส่วน **Environment Variables** ให้เพิ่ม:
   - `SUPABASE_URL` = ค่าจากไฟล์ `.env`
   - `SUPABASE_ANON_KEY` = ค่าจากไฟล์ `.env`
   - `GEMINI_API_KEY` = (ถ้ามี)
6. คลิก **Deploy Web Service**

---

## ⚡ วิธีการ Deploy บน Vercel

โปรเจกต์นี้มีไฟล์ `vercel.json` และ Serverless Function `api/index.js` เตรียมไว้เรียบร้อยแล้ว:

1. ติดตั้ง Vercel CLI (ถ้าต้องการ deploy ผ่าน command line):
   ```bash
   npm i -g vercel
   vercel
   ```
2. หรือไปที่ [Vercel Dashboard](https://vercel.com/) -> **Add New Project** -> Import GitHub Repo
3. ใส่ **Environment Variables** ในหน้าตั้งค่าของ Vercel:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
4. คลิก **Deploy**

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
burapha16/
├── server.js              # Express Backend Entry Point
├── package.json           # รายการแพ็กเกจและคำสั่งรัน
├── render.yaml            # คอนฟิกสำหรับ Render Blueprint
├── vercel.json            # คอนฟิกสำหรับ Vercel Serverless
├── .env                   # ตัวแปรระบบ (Supabase & Gemini Key)
├── .env.example           # ตัวอย่างการตั้งค่า Environment Variables
├── .gitignore             # รายการไฟล์ที่ไม่นำเข้า Git
│
├── api/
│   └── index.js           # Serverless Handler สำหรับ Vercel
│
├── config/
│   └── supabase.js        # เชื่อมต่อ Supabase Client และระบบ Fallback
│
├── routes/
│   ├── auth.js            # ระบบจัดการผู้ใช้และสิทธิ์ Admin/User
│   ├── posts.js           # CRUD โพสต์ (แก้ไข/ลบ ตามสิทธิ์ผู้ใช้และแอดมิน)
│   ├── swaps.js           # ยื่นข้อเสนอแลกของ และระบบยืนยันรับของ (Verification)
│   ├── chat.js            # ระบบแชทส่วนตัว 1-on-1
│   └── ai.js              # ระบบ AI ผู้ช่วย (Google Gemini API)
│
├── public/                # ฝั่ง Frontend (HTML / CSS / JS)
│   ├── index.html         # หน้าเว็บหลัก Single Page Application
│   ├── manifest.json      # PWA App Manifest สำหรับติดตั้งบนมือถือ
│   ├── sw.js              # Service Worker สำหรับ PWA
│   ├── css/
│   │   └── style.css      # สไตล์ Responsive และดีไซน์ทันสมัย
│   └── js/
│       ├── api.js         # API Client Wrapper
│       ├── auth.js        # จัดการสถานะผู้ใช้และ Switcher
│       ├── map.js         # แผนที่ Leaflet, ปักหมุด GPS, หาพิกัดปัจจุบัน
│       ├── posts.js       # จัดการแสดงผลโพสต์ และสิทธิ์แก้ไข/ลบ
│       ├── swaps.js       # กระบวนการแลกเปลี่ยนและกดยืนยันรับของ
│       ├── chat.js        # ห้องแชทส่วนตัว
│       ├── ai.js          # หน้าต่างแชท AI Gemini
│       └── app.js         # ควบคุมหน้าจอแท็บและ Dashboard แอดมิน
│
└── supabase/
    ├── schema.sql         # สคริปต์ตารางฐานข้อมูล PostgreSQL (Supabase)
    └── seed.sql           # ข้อมูลตัวอย่างสิ่งของ ม.บูรพา บางแสน
```

---

## 👨‍💻 พัฒนาโดย
**burapha 16 Dev**  
มุ่งเน้นการใช้เทคโนโลยีเพื่อสร้างแพลตฟอร์มการแบ่งปันสิ่งของที่เป็นมิตรต่อสิ่งแวดล้อม
