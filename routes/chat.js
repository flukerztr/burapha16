const express = require('express');
const router = express.Router();
const { supabase, isSupabaseConfigured, memoryStore } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

// 1. Get message history for a swap
router.get('/:swapId', async (req, res) => {
  const { swapId } = req.params;

  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('b16_messages')
        .select('*')
        .eq('swap_id', swapId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        return res.json({ success: true, messages: data });
      }
    }

    const messages = memoryStore.messages
      .filter(m => m.swap_id === swapId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return res.json({ success: true, messages });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Send message in a swap
router.post('/:swapId', async (req, res) => {
  const { swapId } = req.params;
  const { sender_id, sender_name, message } = req.body;

  if (!sender_id || !message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อความ' });
  }

  const newMsg = {
    id: `msg-${Date.now().toString().slice(-7)}`,
    swap_id: swapId,
    sender_id,
    sender_name: sender_name || 'ผู้ใช้งาน',
    message: message.trim(),
    is_system: false,
    created_at: new Date().toISOString()
  };

  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('b16_messages').insert([newMsg]).select().single();
      if (!error && data) {
        return res.json({ success: true, message: data });
      }
    }

    memoryStore.messages.push(newMsg);
    return res.json({ success: true, message: newMsg });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
