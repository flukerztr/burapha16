const express = require('express');
const router = express.Router();
const { supabase, isSupabaseConfigured, memoryStore } = require('../config/supabase');

// Helper to strip sensitive fields before returning user object
function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

// Get all users (for admin stats, stripped of passwords)
router.get('/users', async (req, res) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('b16_users')
        .select('id, username, email, name, role, avatar_url, phone, location_hint, created_at')
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        return res.json({ success: true, users: data });
      }
    }
    return res.json({ success: true, users: memoryStore.users.map(sanitizeUser) });
  } catch (err) {
    return res.json({ success: true, users: memoryStore.users.map(sanitizeUser) });
  }
});

// Login with username or email + password
router.post('/login', async (req, res) => {
  const { identifier, username, email, password } = req.body;
  const loginKey = (identifier || username || email || '').trim().toLowerCase();

  if (!loginKey || !password) {
    return res.status(400).json({
      success: false,
      message: 'กรุณากรอกชื่อผู้ใช้ (Username) หรืออีเมล และรหัสผ่าน'
    });
  }

  try {
    let user = null;

    if (isSupabaseConfigured && supabase) {
      // Search by username OR email
      const { data, error } = await supabase
        .from('b16_users')
        .select('*')
        .or(`username.ilike.${loginKey},email.ilike.${loginKey}`)
        .limit(1);

      if (!error && data && data.length > 0) {
        user = data[0];
      }
    }

    if (!user) {
      user = memoryStore.users.find(
        u =>
          (u.username && u.username.toLowerCase() === loginKey) ||
          (u.email && u.email.toLowerCase() === loginKey)
      );
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบชื่อผู้ใช้ (Username) หรืออีเมลนี้ในระบบ'
      });
    }

    // Verify password
    if (user.password && user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง'
      });
    }

    return res.json({
      success: true,
      user: sanitizeUser(user),
      message: `ยินดีต้อนรับคุณ ${user.name}`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Register new user (Strictly 'user' role only - Admin self-registration disabled)
router.post('/register', async (req, res) => {
  const { username, password, name, email, phone = '', location_hint = '' } = req.body;

  if (!username || !password || !name || !email) {
    return res.status(400).json({
      success: false,
      message: 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน (Username, รหัสผ่าน, ชื่อ-นามสกุล, อีเมล)'
    });
  }

  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();

  if (cleanUsername.length < 3) {
    return res.status(400).json({
      success: false,
      message: 'ชื่อผู้ใช้ (Username) ต้องมีความยาวอย่างน้อย 3 ตัวอักษร'
    });
  }

  if (password.length < 4) {
    return res.status(400).json({
      success: false,
      message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร'
    });
  }

  const newId = `user-${Date.now().toString().slice(-6)}`;
  const newUser = {
    id: newId,
    username: cleanUsername,
    password: password,
    email: cleanEmail,
    name: name.trim(),
    role: 'user', // Force standard user role; Admin cannot be registered via UI
    avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanUsername)}`,
    phone: phone.trim(),
    location_hint: location_hint.trim() || 'มหาวิทยาลัยบูรพา ชลบุรี',
    created_at: new Date().toISOString()
  };

  try {
    if (isSupabaseConfigured && supabase) {
      // Check if username or email is already taken
      const { data: existingData } = await supabase
        .from('b16_users')
        .select('id, username, email')
        .or(`username.ilike.${cleanUsername},email.ilike.${cleanEmail}`)
        .limit(1);

      if (existingData && existingData.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'ชื่อผู้ใช้ (Username) หรืออีเมลนี้มีในระบบแล้ว กรุณาใช้ชื่ออื่นหรือเข้าสู่ระบบ'
        });
      }

      const { data, error } = await supabase
        .from('b16_users')
        .insert([newUser])
        .select()
        .single();

      if (error) {
        console.warn('Supabase insert user error:', error.message);
        return res.status(400).json({
          success: false,
          message: 'ไม่สามารถสมัครสมาชิกได้: ' + error.message
        });
      }

      if (data) {
        return res.json({
          success: true,
          user: sanitizeUser(data),
          message: 'สมัครสมาชิกสำเร็จ!'
        });
      }
    }

    // Fallback memoryStore check
    const existing = memoryStore.users.find(
      u =>
        (u.username && u.username.toLowerCase() === cleanUsername) ||
        (u.email && u.email.toLowerCase() === cleanEmail)
    );
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'ชื่อผู้ใช้ (Username) หรืออีเมลนี้มีในระบบแล้ว'
      });
    }

    memoryStore.users.push(newUser);
    return res.json({
      success: true,
      user: sanitizeUser(newUser),
      message: 'สมัครสมาชิกสำเร็จ!'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
