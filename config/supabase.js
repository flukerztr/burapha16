const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

let supabase = null;
let isSupabaseConfigured = false;

if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project')) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    isSupabaseConfigured = true;
    console.log('✅ Connected to Supabase at:', supabaseUrl);
  } catch (err) {
    console.warn('⚠️ Could not initialize Supabase client:', err.message);
  }
} else {
  console.log('ℹ️ Running with local in-memory/fallback database (Supabase credentials not set or incomplete)');
}

// In-memory fallback dataset in case Supabase is offline or not configured
const memoryStore = {
  users: [
    {
      id: 'user-1',
      email: 'somchai@burapha.ac.th',
      name: 'สมชาย ชลบุรี (ม.บูรพา)',
      role: 'user',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=somchai',
      phone: '081-234-5678',
      location_hint: 'หอพัก 14 ใน ม.บูรพา',
      created_at: new Date().toISOString()
    },
    {
      id: 'user-2',
      email: 'somying@burapha.ac.th',
      name: 'สมหญิง วิทยาการคอมพ์',
      role: 'user',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=somying',
      phone: '089-876-5432',
      location_hint: 'ซอยสดใส บางแสน',
      created_at: new Date().toISOString()
    },
    {
      id: 'admin-1',
      email: 'admin@burapha16.dev',
      name: 'ผู้ดูแลระบบ Burapha 16 (Admin)',
      role: 'admin',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin16',
      phone: '090-000-1616',
      location_hint: 'อาคารวิทยาการสารสนเทศ (ตึก IT ม.บูรพา)',
      created_at: new Date().toISOString()
    }
  ],
  posts: [
    {
      id: 'post-1',
      user_id: 'user-1',
      user_name: 'สมชาย ชลบุรี (ม.บูรพา)',
      title: 'เครื่องคิดเลขวิทยาศาสตร์ Casio fx-991EX สภาพ 95%',
      description: 'ใช้ตอนเรียนแคลคูลัสปี 1 สอบผ่านแล้วไม่ได้ใช้ต่อ แบตเตอรี่เต็ม ปุ่มกดได้ปกติทุกปุ่ม พร้อมฝาครอบสไลด์',
      category: 'หนังสือและการเรียน',
      condition: 'มือสองสภาพดีมาก',
      desired_exchange: 'อยากแลกกับ: ชีทสรุปวิชาสถิติ หรือเมาส์ไร้สาย USB',
      images: ['https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80'],
      latitude: 13.2835,
      longitude: 100.9240,
      location_name: 'หน้าสำนักหอสมุด มหาวิทยาลัยบูรพา',
      status: 'available',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: 'post-2',
      user_id: 'user-2',
      user_name: 'สมหญิง วิทยาการคอมพ์',
      title: 'พัดลมตั้งโต๊ะ Hatari 12 นิ้ว ลมแรง สภาพพร้อมใช้งาน',
      description: 'ซื้อมาตอนเปิดเทอม ปัจจุบันย้ายหอพักมีแอร์แล้วเลยอยากส่งต่อ ประหยัดไฟเบอร์ 5 เสียงเงียบ',
      category: 'เครื่องใช้ไฟฟ้า',
      condition: 'สภาพปานกลาง',
      desired_exchange: 'อยากแลกกับ: ชั้นวางหนังสือขนาดเล็ก หรือหม้อต้มมาม่าไฟฟ้า',
      images: ['https://images.unsplash.com/photo-1618941716939-553df3c6c278?w=600&auto=format&fit=crop&q=80'],
      latitude: 13.2862,
      longitude: 100.9285,
      location_name: 'ซอยสดใส ใกล้ 7-Eleven ม.บูรพา',
      status: 'available',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    {
      id: 'post-3',
      user_id: 'user-1',
      user_name: 'สมชาย ชลบุรี (ม.บูรพา)',
      title: 'หนังสือเรียน Data Structures & Algorithms (ภาษาไทย)',
      description: 'เล่มหนา อธิบายเข้าใจง่าย มีรอยไฮไลท์บางบท ไม่หลุดขาด หน้าครบ เหมาะกับคนเริ่มเรียนโค้ดดิ้ง',
      category: 'หนังสือและการเรียน',
      condition: 'สภาพปานกลาง',
      desired_exchange: 'อยากแลกกับ: หูฟังบลูทูธ หรือแฟลชไดรฟ์ 64GB',
      images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'],
      latitude: 13.2818,
      longitude: 100.9225,
      location_name: 'อาคารวิทยาการสารสนเทศ (ตึก IT)',
      status: 'available',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: 'post-4',
      user_id: 'user-2',
      user_name: 'สมหญิง วิทยาการคอมพ์',
      title: 'กระเป๋าเป้สะพายหลังกันน้ำใส่ Laptop 15.6 นิ้ว',
      description: 'สีเทาดำ ช่องใส่เยอะ มีช่อง USB ต่อพาวเวอร์แบงค์ ซิปลื่น ไม่มีรอยขาด ใช้งานน้อยมาก',
      category: 'เสื้อผ้าแฟชั่น',
      condition: 'มือสองสภาพดีมาก',
      desired_exchange: 'อยากแลกกับ: คีย์บอร์ดไร้สาย หรือไฟ LED แต่งโต๊ะคอม',
      images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80'],
      latitude: 13.2850,
      longitude: 100.9190,
      location_name: 'วงเวียนบางแสน ชลบุรี',
      status: 'available',
      created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 36).toISOString()
    },
    {
      id: 'post-5',
      user_id: 'admin-1',
      user_name: 'ผู้ดูแลระบบ Burapha 16 (Admin)',
      title: 'บอร์ดเกม Catan สภาพสะสม เล่นไป 2 ครั้ง อุปกรณ์ครบ',
      description: 'ตัวหมาก เม็ดทรัพยากร การ์ดใส่ซองใสไว้แล้ว กล่องไม่มีตำหนิ ส่งต่อให้เพื่อนๆ นัดเล่นได้',
      category: 'อื่นๆ',
      condition: 'ของสะสม',
      desired_exchange: 'อยากแลกกับ: บอร์ดเกม Splendor หรือ Dixit',
      images: ['https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&auto=format&fit=crop&q=80'],
      latitude: 13.2829,
      longitude: 100.9255,
      location_name: 'ลานกิจกรรม หอศิลปวัฒนธรรม ม.บูรพา',
      status: 'available',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 48).toISOString()
    }
  ],
  swaps: [],
  messages: []
};

module.exports = {
  supabase,
  isSupabaseConfigured,
  memoryStore
};
