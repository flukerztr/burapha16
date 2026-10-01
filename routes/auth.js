const express = require('express');
const router = express.Router();
const { supabase, isSupabaseConfigured, memoryStore } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

// Get all users (useful for user switcher / demo)
router.get('/users', async (req, res) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('b16_users').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        return res.json({ success: true, users: data });
      }
    }
    return res.json({ success: true, users: memoryStore.users });
  } catch (err) {
    return res.json({ success: true, users: memoryStore.users });
  }
});

// Login / Switch active user
router.post('/login', async (req, res) => {
  const { email, id } = req.body;

  try {
    let user = null;
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('b16_users').select('*');
      if (id) {
        query = query.eq('id', id);
      } else if (email) {
        query = query.eq('email', email.trim().toLowerCase());
      }
      const { data, error } = await query.single();
      if (!error && data) {
        user = data;
      }
    }

    if (!user) {
      user = memoryStore.users.find(u => (id && u.id === id) || (email && u.email.toLowerCase() === email.trim().toLowerCase()));
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งานนี้ในระบบ' });
    }

    return res.json({
      success: true,
      user,
      message: `ยินดีต้อนรับคุณ ${user.name} (${user.role === 'admin' ? 'แอดมิน' : 'สมาชิกทั่วไป'})`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Register new user
router.post('/register', async (req, res) => {
  const { name, email, role = 'user', phone = '', location_hint = '' } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อและอีเมล' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const newId = `user-${Date.now().toString().slice(-6)}`;
  const newUser = {
    id: newId,
    email: cleanEmail,
    name: name.trim(),
    role: role === 'admin' ? 'admin' : 'user',
    avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
    phone: phone.trim(),
    location_hint: location_hint.trim() || 'มหาวิทยาลัยบูรพา ชลบุรี',
    created_at: new Date().toISOString()
  };

  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('b16_users').insert([newUser]).select().single();
      if (error) {
        // If conflict or error, try memory store
        console.warn('Supabase insert user error:', error.message);
      } else if (data) {
        return res.json({ success: true, user: data, message: 'ลงทะเบียนสำเร็จ!' });
      }
    }

    // Fallback store
    const existing = memoryStore.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.json({ success: true, user: existing, message: 'เข้าสู่ระบบด้วยบัญชีเดิมเรียบร้อย' });
    }

    memoryStore.users.push(newUser);
    return res.json({ success: true, user: newUser, message: 'ลงทะเบียนสำเร็จ!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
