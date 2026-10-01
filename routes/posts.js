const express = require('express');
const router = express.Router();
const { supabase, isSupabaseConfigured, memoryStore } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

// Helper to check user permission
function canModifyPost(user, post) {
  if (!user) return false;
  if (user.role === 'admin') return true; // Admin can modify any post
  return post.user_id === user.id; // User can modify only their own post
}

// 1. Get all posts with filtering and search
router.get('/', async (req, res) => {
  const { category, status, type, q, user_id } = req.query;

  try {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('b16_posts').select('*').order('created_at', { ascending: false });

      if (category && category !== 'ทั้งหมด') {
        query = query.eq('category', category);
      }
      if (status && status !== 'ทั้งหมด') {
        query = query.eq('status', status);
      }
      if (type && type !== 'ทั้งหมด') {
        query = query.eq('post_type', type);
      }
      if (user_id) {
        query = query.eq('user_id', user_id);
      }
      if (q) {
        query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,desired_exchange.ilike.%${q}%,location_name.ilike.%${q}%`);
      }

      const { data, error } = await query;
      if (!error && data) {
        return res.json({ success: true, posts: data });
      }
    }

    // Fallback store filter
    let results = [...memoryStore.posts];
    if (category && category !== 'ทั้งหมด') {
      results = results.filter(p => p.category === category);
    }
    if (status && status !== 'ทั้งหมด') {
      results = results.filter(p => p.status === status);
    }
    if (type && type !== 'ทั้งหมด') {
      results = results.filter(p => (p.post_type || 'swap') === type);
    }
    if (user_id) {
      results = results.filter(p => p.user_id === user_id);
    }
    if (q) {
      const lower = q.toLowerCase();
      results = results.filter(p =>
        (p.title && p.title.toLowerCase().includes(lower)) ||
        (p.description && p.description.toLowerCase().includes(lower)) ||
        (p.desired_exchange && p.desired_exchange.toLowerCase().includes(lower)) ||
        (p.location_name && p.location_name.toLowerCase().includes(lower))
      );
    }

    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return res.json({ success: true, posts: results });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Get single post by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('b16_posts').select('*').eq('id', id).single();
      if (!error && data) {
        return res.json({ success: true, post: data });
      }
    }

    const post = memoryStore.posts.find(p => p.id === id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'ไม่พบโพสต์ที่ค้นหา' });
    }
    return res.json({ success: true, post });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Create a new post
router.post('/', async (req, res) => {
  const {
    user_id,
    user_name,
    title,
    description,
    category,
    condition,
    desired_exchange,
    post_type = 'swap', // 'swap', 'donation', 'request'
    images = [],
    latitude,
    longitude,
    location_name
  } = req.body;

  let effectiveDesired = desired_exchange ? desired_exchange.trim() : '';
  if (!effectiveDesired) {
    if (post_type === 'donation') {
      effectiveDesired = 'แจกฟรี / ส่งต่อให้ผู้ที่ต้องการใช้งาน (ไม่มีค่าใช้จ่าย)';
    } else if (post_type === 'request') {
      effectiveDesired = 'ขอรับบริจาค / ตามหาสิ่งของนี้เพื่อนำไปใช้งาน';
    }
  }

  if (!user_id || !title || !category) {
    return res.status(400).json({
      success: false,
      message: 'กรุณากรอกข้อมูลที่จำเป็น: หัวข้อโพสต์ และหมวดหมู่'
    });
  }

  if (post_type === 'swap' && !effectiveDesired) {
    return res.status(400).json({
      success: false,
      message: 'สำหรับการแลกเปลี่ยน กรุณาระบุสิ่งที่ต้องการนำมาแลก'
    });
  }

  const newPost = {
    id: `post-${Date.now().toString().slice(-7)}`,
    user_id,
    user_name: user_name || 'ผู้ใช้งาน ม.บูรพา',
    title: title.trim(),
    description: description ? description.trim() : '',
    category: category.trim(),
    condition: condition || 'มือสองสภาพดี',
    desired_exchange: effectiveDesired,
    post_type: ['swap', 'donation', 'request'].includes(post_type) ? post_type : 'swap',
    images: Array.isArray(images) && images.length > 0 ? images : [
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80'
    ],
    latitude: latitude ? parseFloat(latitude) : 13.2835,
    longitude: longitude ? parseFloat(longitude) : 100.9240,
    location_name: location_name ? location_name.trim() : 'มหาวิทยาลัยบูรพา ชลบุรี',
    status: 'available',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('b16_posts').insert([newPost]).select().single();
      if (!error && data) {
        return res.json({ success: true, post: data, message: 'สร้างโพสต์แลกเปลี่ยนสำเร็จ!' });
      }
      console.warn('Supabase post insert fallback:', error?.message);
    }

    memoryStore.posts.unshift(newPost);
    return res.json({ success: true, post: newPost, message: 'สร้างโพสต์แลกเปลี่ยนสำเร็จ!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Update post (Owner OR Admin)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    current_user_id,
    current_user_role,
    title,
    description,
    category,
    condition,
    desired_exchange,
    images,
    latitude,
    longitude,
    location_name,
    status
  } = req.body;

  try {
    // 1. Fetch current post
    let post = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('b16_posts').select('*').eq('id', id).single();
      if (data) post = data;
    }
    if (!post) {
      post = memoryStore.posts.find(p => p.id === id);
    }

    if (!post) {
      return res.status(404).json({ success: false, message: 'ไม่พบโพสต์ที่ต้องการแก้ไข' });
    }

    // 2. Permission check: Admin can edit any, User only own post
    const isAdmin = current_user_role === 'admin';
    const isOwner = post.user_id === current_user_id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์แก้ไขโพสต์นี้ (เฉพาะเจ้าของโพสต์หรือแอดมินเท่านั้น)'
      });
    }

    // 3. Prepare updates
    const updates = {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(category !== undefined && { category: category.trim() }),
      ...(condition !== undefined && { condition: condition.trim() }),
      ...(desired_exchange !== undefined && { desired_exchange: desired_exchange.trim() }),
      ...(req.body.post_type !== undefined && { post_type: req.body.post_type }),
      ...(images !== undefined && { images }),
      ...(latitude !== undefined && { latitude: parseFloat(latitude) }),
      ...(longitude !== undefined && { longitude: parseFloat(longitude) }),
      ...(location_name !== undefined && { location_name: location_name.trim() }),
      ...(status !== undefined && { status }),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('b16_posts').update(updates).eq('id', id).select().single();
      if (!error && data) {
        return res.json({
          success: true,
          post: data,
          message: isAdmin && !isOwner ? 'แอดมินทำการแก้ไขโพสต์เรียบร้อยแล้ว' : 'บันทึกการแก้ไขเรียบร้อยแล้ว'
        });
      }
    }

    // Fallback store
    const idx = memoryStore.posts.findIndex(p => p.id === id);
    if (idx !== -1) {
      memoryStore.posts[idx] = { ...memoryStore.posts[idx], ...updates };
      return res.json({
        success: true,
        post: memoryStore.posts[idx],
        message: isAdmin && !isOwner ? 'แอดมินทำการแก้ไขโพสต์เรียบร้อยแล้ว' : 'บันทึกการแก้ไขเรียบร้อยแล้ว'
      });
    }

    return res.status(404).json({ success: false, message: 'ไม่สามารถอัปเดตโพสต์ได้' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Delete post (Owner OR Admin)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { current_user_id, current_user_role } = req.body;

  try {
    let post = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('b16_posts').select('*').eq('id', id).single();
      if (data) post = data;
    }
    if (!post) {
      post = memoryStore.posts.find(p => p.id === id);
    }

    if (!post) {
      return res.status(404).json({ success: false, message: 'ไม่พบโพสต์ที่ต้องการลบ' });
    }

    const isAdmin = current_user_role === 'admin';
    const isOwner = post.user_id === current_user_id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ลบโพสต์นี้ (เฉพาะเจ้าของโพสต์หรือแอดมินเท่านั้น)'
      });
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('b16_posts').delete().eq('id', id);
      if (!error) {
        return res.json({
          success: true,
          message: isAdmin && !isOwner ? 'แอดมินลบโพสต์เรียบร้อยแล้ว' : 'ลบโพสต์ของคุณเรียบร้อยแล้ว'
        });
      }
    }

    memoryStore.posts = memoryStore.posts.filter(p => p.id !== id);
    return res.json({
      success: true,
      message: isAdmin && !isOwner ? 'แอดมินลบโพสต์เรียบร้อยแล้ว' : 'ลบโพสต์ของคุณเรียบร้อยแล้ว'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
