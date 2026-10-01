-- ====================================================================
-- Burapha 16 Dev: Seed Initial Mock Data (ม.บูรพา บางแสน ชลบุรี)
-- ====================================================================

-- 1. Insert Seed Users (มีทั้ง User ปกติ และ Admin)
INSERT INTO b16_users (id, email, name, role, avatar_url, phone, location_hint) VALUES
(
    'user-1',
    'somchai@burapha.ac.th',
    'สมชาย ชลบุรี (ม.บูรพา)',
    'user',
    'https://api.dicebear.com/7.x/bottts/svg?seed=somchai',
    '081-234-5678',
    'หอพัก 14 ใน ม.บูรพา'
),
(
    'user-2',
    'somying@burapha.ac.th',
    'สมหญิง วิทยาการคอมพ์',
    'user',
    'https://api.dicebear.com/7.x/bottts/svg?seed=somying',
    '089-876-5432',
    'ซอยสดใส บางแสน'
),
(
    'admin-1',
    'admin@burapha16.dev',
    'ผู้ดูแลระบบ Burapha 16 (Admin)',
    'admin',
    'https://api.dicebear.com/7.x/bottts/svg?seed=admin16',
    '090-000-1616',
    'อาคารวิทยาการสารสนเทศ (ตึก IT ม.บูรพา)'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    avatar_url = EXCLUDED.avatar_url,
    location_hint = EXCLUDED.location_hint;

-- 2. Insert Sample Posts (พิกัด GPS บริเวณ ม.บูรพา บางแสน)
INSERT INTO b16_posts (id, user_id, user_name, title, description, category, condition, desired_exchange, images, latitude, longitude, location_name, status) VALUES
(
    'post-1',
    'user-1',
    'สมชาย ชลบุรี (ม.บูรพา)',
    'เครื่องคิดเลขวิทยาศาสตร์ Casio fx-991EX สภาพ 95%',
    'ใช้ตอนเรียนแคลคูลัสปี 1 สอบผ่านแล้วไม่ได้ใช้ต่อ แบตเตอรี่เต็ม ปุ่มกดได้ปกติทุกปุ่ม พร้อมฝาครอบสไลด์',
    'หนังสือและการเรียน',
    'มือสองสภาพดีมาก',
    'อยากแลกกับ: ชีทสรุปวิชาสถิติ หรือเมาส์ไร้สาย USB',
    '["https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80"]'::jsonb,
    13.2835,
    100.9240,
    'หน้าสำนักหอสมุด มหาวิทยาลัยบูรพา',
    'available'
),
(
    'post-2',
    'user-2',
    'สมหญิง วิทยาการคอมพ์',
    'พัดลมตั้งโต๊ะ Hatari 12 นิ้ว ลมแรง สภาพพร้อมใช้งาน',
    'ซื้อมาตอนเปิดเทอม ปัจจุบันย้ายหอพักมีแอร์แล้วเลยอยากส่งต่อ ประหยัดไฟเบอร์ 5 เสียงเงียบ',
    'เครื่องใช้ไฟฟ้า',
    'สภาพปานกลาง',
    'อยากแลกกับ: ชั้นวางหนังสือขนาดเล็ก หรือหม้อต้มมาม่าไฟฟ้า',
    '["https://images.unsplash.com/photo-1618941716939-553df3c6c278?w=600&auto=format&fit=crop&q=80"]'::jsonb,
    13.2862,
    100.9285,
    'ซอยสดใส ใกล้ 7-Eleven ม.บูรพา',
    'available'
),
(
    'post-3',
    'user-1',
    'สมชาย ชลบุรี (ม.บูรพา)',
    'หนังสือเรียน Data Structures & Algorithms (ภาษาไทย)',
    'เล่มหนา อธิบายเข้าใจง่าย มีรอยไฮไลท์บางบท ไม่หลุดขาด หน้าครบ เหมาะกับคนเริ่มเรียนโค้ดดิ้ง',
    'หนังสือและการเรียน',
    'สภาพปานกลาง',
    'อยากแลกกับ: หูฟังบลูทูธ หรือแฟลชไดรฟ์ 64GB',
    '["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"]'::jsonb,
    13.2818,
    100.9225,
    'อาคารวิทยาการสารสนเทศ (ตึก IT)',
    'available'
),
(
    'post-4',
    'user-2',
    'สมหญิง วิทยาการคอมพ์',
    'กระเป๋าเป้สะพายหลังกันน้ำใส่ Laptop 15.6 นิ้ว',
    'สีเทาดำ ช่องใส่เยอะ มีช่อง USB ต่อพาวเวอร์แบงค์ ซิปลื่น ไม่มีรอยขาด ใช้งานน้อยมาก',
    'เสื้อผ้าแฟชั่น',
    'มือสองสภาพดีมาก',
    'อยากแลกกับ: คีย์บอร์ดไร้สาย หรือไฟ LED แต่งโต๊ะคอม',
    '["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80"]'::jsonb,
    13.2850,
    100.9190,
    'วงเวียนบางแสน ชลบุรี',
    'available'
),
(
    'post-5',
    'admin-1',
    'ผู้ดูแลระบบ Burapha 16 (Admin)',
    'บอร์ดเกม Catan สภาพสะสม เล่นไป 2 ครั้ง อุปกรณ์ครบ',
    'ตัวหมาก เม็ดทรัพยากร การ์ดใส่ซองใสไว้แล้ว กล่องไม่มีตำหนิ ส่งต่อให้เพื่อนๆ นัดเล่นได้',
    'อื่นๆ',
    'ของสะสม',
    'อยากแลกกับ: บอร์ดเกม Splendor หรือ Dixit',
    '["https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&auto=format&fit=crop&q=80"]'::jsonb,
    13.2829,
    100.9255,
    'ลานกิจกรรม หอศิลปวัฒนธรรม ม.บูรพา',
    'available'
)
ON CONFLICT (id) DO NOTHING;
