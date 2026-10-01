const express = require('express');
const router = express.Router();
const { supabase, isSupabaseConfigured, memoryStore } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

// 1. Get all swaps for a user or post
router.get('/', async (req, res) => {
  const { user_id, post_id } = req.query;

  try {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('b16_swaps').select(`
        *,
        post:b16_posts!b16_swaps_post_id_fkey(*),
        owner:b16_users!b16_swaps_owner_id_fkey(*),
        requester:b16_users!b16_swaps_requester_id_fkey(*)
      `).order('created_at', { ascending: false });

      if (post_id) {
        query = query.eq('post_id', post_id);
      } else if (user_id) {
        query = query.or(`owner_id.eq.${user_id},requester_id.eq.${user_id}`);
      }

      const { data, error } = await query;
      if (!error && data) {
        return res.json({ success: true, swaps: data });
      }
    }

    // Fallback store
    let results = memoryStore.swaps.filter(s => {
      if (post_id) return s.post_id === post_id;
      if (user_id) return s.owner_id === user_id || s.requester_id === user_id;
      return true;
    });

    // Populate post and users
    const populated = results.map(s => {
      const post = memoryStore.posts.find(p => p.id === s.post_id);
      const owner = memoryStore.users.find(u => u.id === s.owner_id);
      const requester = memoryStore.users.find(u => u.id === s.requester_id);
      return { ...s, post, owner, requester };
    });

    populated.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return res.json({ success: true, swaps: populated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Propose a new swap offer
router.post('/', async (req, res) => {
  const { post_id, requester_id, requester_offer_desc, requester_item_id } = req.body;

  if (!post_id || !requester_id || !requester_offer_desc) {
    return res.status(400).json({
      success: false,
      message: 'กรุณากรอกข้อมูลข้อเสนอและสิ่งที่ต้องการนำมาแลก'
    });
  }

  try {
    // Fetch post to verify and get owner
    let post = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('b16_posts').select('*').eq('id', post_id).single();
      if (data) post = data;
    }
    if (!post) {
      post = memoryStore.posts.find(p => p.id === post_id);
    }

    if (!post) {
      return res.status(404).json({ success: false, message: 'ไม่พบโพสต์ที่ต้องการแลกเปลี่ยน' });
    }

    if (post.user_id === requester_id) {
      return res.status(400).json({ success: false, message: 'คุณไม่สามารถขอแลกเปลี่ยนสิ่งของของตนเองได้' });
    }

    const newSwap = {
      id: `swap-${Date.now().toString().slice(-7)}`,
      post_id,
      owner_id: post.user_id,
      requester_id,
      requester_offer_desc: requester_offer_desc.trim(),
      requester_item_id: requester_item_id || null,
      status: 'pending',
      owner_confirmed: false,
      requester_confirmed: false,
      owner_confirmed_at: null,
      requester_confirmed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('b16_swaps').insert([newSwap]).select().single();
      if (!error && data) {
        return res.json({ success: true, swap: data, message: 'ส่งคำขอแลกเปลี่ยนเรียบร้อยแล้ว!' });
      }
    }

    memoryStore.swaps.unshift(newSwap);
    return res.json({ success: true, swap: newSwap, message: 'ส่งคำขอแลกเปลี่ยนเรียบร้อยแล้ว!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Update swap status (Accept / Reject)
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { current_user_id, status } = req.body; // status: 'in_progress', 'rejected', 'cancelled'

  if (!['in_progress', 'rejected', 'cancelled'].includes(status)) {
    return res.status(400).json({ success: false, message: 'สถานะไม่ถูกต้อง' });
  }

  try {
    let swap = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('b16_swaps').select('*').eq('id', id).single();
      if (data) swap = data;
    }
    if (!swap) {
      swap = memoryStore.swaps.find(s => s.id === id);
    }

    if (!swap) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการแลกเปลี่ยน' });
    }

    // Only owner can accept/reject, or requester can cancel
    if (status === 'in_progress' || status === 'rejected') {
      if (swap.owner_id !== current_user_id) {
        return res.status(403).json({ success: false, message: 'เฉพาะเจ้าของโพสต์เท่านั้นที่สามารถตอบรับหรือปฏิเสธได้' });
      }
    } else if (status === 'cancelled') {
      if (swap.requester_id !== current_user_id && swap.owner_id !== current_user_id) {
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ยกเลิกข้อเสนอนี้' });
      }
    }

    const updates = {
      status,
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      await supabase.from('b16_swaps').update(updates).eq('id', id);
      if (status === 'in_progress') {
        // Update post status to negotiating
        await supabase.from('b16_posts').update({ status: 'negotiating' }).eq('id', swap.post_id);
        // Create initial system message
        await supabase.from('b16_messages').insert([{
          id: `msg-${Date.now().toString().slice(-7)}`,
          swap_id: id,
          sender_id: 'system',
          sender_name: 'ระบบ Burapha 16 Dev',
          message: '🎉 ยินดีด้วยครับ! ทั้งสองฝ่ายตกลงแลกเปลี่ยนกันแล้ว สามารถใช้ช่องแชทนี้เพื่อนัดหมายสถานที่และเวลารับของได้เลย',
          is_system: true,
          created_at: new Date().toISOString()
        }]);
      }
    }

    // Fallback store
    const idx = memoryStore.swaps.findIndex(s => s.id === id);
    if (idx !== -1) {
      memoryStore.swaps[idx] = { ...memoryStore.swaps[idx], ...updates };
      if (status === 'in_progress') {
        const postIdx = memoryStore.posts.findIndex(p => p.id === swap.post_id);
        if (postIdx !== -1) memoryStore.posts[postIdx].status = 'negotiating';

        memoryStore.messages.push({
          id: `msg-${Date.now().toString().slice(-7)}`,
          swap_id: id,
          sender_id: 'system',
          sender_name: 'ระบบ Burapha 16 Dev',
          message: '🎉 ยินดีด้วยครับ! ทั้งสองฝ่ายตกลงแลกเปลี่ยนกันแล้ว สามารถใช้ช่องแชทนี้เพื่อนัดหมายสถานที่และเวลารับของได้เลย',
          is_system: true,
          created_at: new Date().toISOString()
        });
      }
    }

    return res.json({
      success: true,
      message: status === 'in_progress' ? 'ตอบรับข้อเสนอแลกเปลี่ยนแล้ว! ห้องแชทเปิดใช้งานแล้ว' : 'อัปเดตสถานะเรียบร้อยแล้ว'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Verification Flow: Confirm Item Received (ตรวจสอบและยืนยันว่าได้ของเรียบร้อยแล้ว)
router.post('/:id/confirm', async (req, res) => {
  const { id } = req.params;
  const { current_user_id, current_user_name } = req.body;

  try {
    let swap = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('b16_swaps').select('*').eq('id', id).single();
      if (data) swap = data;
    }
    if (!swap) {
      swap = memoryStore.swaps.find(s => s.id === id);
    }

    if (!swap) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการแลกเปลี่ยน' });
    }

    const isOwner = swap.owner_id === current_user_id;
    const isRequester = swap.requester_id === current_user_id;

    if (!isOwner && !isRequester) {
      return res.status(403).json({ success: false, message: 'คุณไม่ใช่คู่สัญญาในการแลกเปลี่ยนนี้' });
    }

    let ownerConfirmed = swap.owner_confirmed;
    let requesterConfirmed = swap.requester_confirmed;
    let ownerConfirmedAt = swap.owner_confirmed_at;
    let requesterConfirmedAt = swap.requester_confirmed_at;

    if (isOwner) {
      ownerConfirmed = true;
      ownerConfirmedAt = new Date().toISOString();
    }
    if (isRequester) {
      requesterConfirmed = true;
      requesterConfirmedAt = new Date().toISOString();
    }

    // Check if both sides have confirmed
    const isFullyCompleted = ownerConfirmed && requesterConfirmed;
    const newStatus = isFullyCompleted ? 'completed' : swap.status;

    const updates = {
      owner_confirmed: ownerConfirmed,
      requester_confirmed: requesterConfirmed,
      owner_confirmed_at: ownerConfirmedAt,
      requester_confirmed_at: requesterConfirmedAt,
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    const userName = current_user_name || (isOwner ? 'เจ้าของโพสต์' : 'ผู้ขอแลก');
    const systemNotice = isFullyCompleted
      ? '✨ การแลกเปลี่ยนเสร็จสมบูรณ์ 100%! ทั้งสองฝ่ายได้กดยืนยันการรับสิ่งของเรียบร้อยแล้ว ขอบคุณที่ร่วมแบ่งปันสิ่งของเหลือใช้กับ Burapha 16 Dev'
      : `✅ ${userName} ได้กดยืนยันว่า "ได้รับสิ่งของเรียบร้อยแล้ว" (รออีกฝ่ายกดยืนยันเพื่อจบขั้นตอน)`;

    if (isSupabaseConfigured && supabase) {
      await supabase.from('b16_swaps').update(updates).eq('id', id);

      if (isFullyCompleted) {
        // Mark post as swapped
        await supabase.from('b16_posts').update({ status: 'swapped' }).eq('id', swap.post_id);
      }

      // Add system message to chat
      await supabase.from('b16_messages').insert([{
        id: `msg-${Date.now().toString().slice(-7)}`,
        swap_id: id,
        sender_id: 'system',
        sender_name: 'ระบบ Burapha 16 Dev',
        message: systemNotice,
        is_system: true,
        created_at: new Date().toISOString()
      }]);
    }

    // Fallback store
    const idx = memoryStore.swaps.findIndex(s => s.id === id);
    if (idx !== -1) {
      memoryStore.swaps[idx] = { ...memoryStore.swaps[idx], ...updates };
      if (isFullyCompleted) {
        const postIdx = memoryStore.posts.findIndex(p => p.id === swap.post_id);
        if (postIdx !== -1) memoryStore.posts[postIdx].status = 'swapped';
      }

      memoryStore.messages.push({
        id: `msg-${Date.now().toString().slice(-7)}`,
        swap_id: id,
        sender_id: 'system',
        sender_name: 'ระบบ Burapha 16 Dev',
        message: systemNotice,
        is_system: true,
        created_at: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      swap: { ...swap, ...updates },
      isFullyCompleted,
      message: isFullyCompleted
        ? 'ยินดีด้วยครับ! ทั้งสองฝ่ายยืนยันการรับของเรียบร้อยแล้ว การแลกเปลี่ยนสำเร็จสมบูรณ์'
        : 'บันทึกการยืนยันของคุณแล้ว กำลังรออีกฝ่ายกดยืนยันรับของ'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
