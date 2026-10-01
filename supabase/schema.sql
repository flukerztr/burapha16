-- ====================================================================
-- Burapha 16 Dev: Database Schema for Secondhand Item Swap Platform
-- ====================================================================

-- 1. Create Profiles / Users table
CREATE TABLE IF NOT EXISTS b16_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user', -- 'user' or 'admin'
    avatar_url TEXT,
    phone TEXT,
    location_hint TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Posts table (โพสต์สิ่งของเหลือใช้)
CREATE TABLE IF NOT EXISTS b16_posts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES b16_users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    condition TEXT NOT NULL,
    desired_exchange TEXT NOT NULL,
    images JSONB DEFAULT '[]'::jsonb,
    latitude NUMERIC,
    longitude NUMERIC,
    location_name TEXT,
    post_type TEXT NOT NULL DEFAULT 'swap', -- 'swap' (แลกเปลี่ยน), 'donation' (บริจาค/แจกฟรี), 'request' (ขอรับบริจาค/ตามหา)
    status TEXT NOT NULL DEFAULT 'available', -- 'available', 'negotiating', 'swapped', 'hidden'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Swaps / Exchange Transactions table (ระบบการแลกเปลี่ยนและยืนยันการรับของ)
CREATE TABLE IF NOT EXISTS b16_swaps (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    post_id TEXT NOT NULL REFERENCES b16_posts(id) ON DELETE CASCADE,
    owner_id TEXT NOT NULL REFERENCES b16_users(id) ON DELETE CASCADE,
    requester_id TEXT NOT NULL REFERENCES b16_users(id) ON DELETE CASCADE,
    requester_offer_desc TEXT NOT NULL,
    requester_item_id TEXT REFERENCES b16_posts(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'
    owner_confirmed BOOLEAN DEFAULT FALSE,       -- ยืนยันว่าได้รับของแล้ว (ฝั่งเจ้าของโพสต์)
    requester_confirmed BOOLEAN DEFAULT FALSE,   -- ยืนยันว่าได้รับของแล้ว (ฝั่งผู้ขอแลก)
    owner_confirmed_at TIMESTAMPTZ,
    requester_confirmed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Messages table (ระบบแชทส่วนตัวสำหรับการเจรจาแลกเปลี่ยน)
CREATE TABLE IF NOT EXISTS b16_messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    swap_id TEXT NOT NULL REFERENCES b16_swaps(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_b16_posts_user_id ON b16_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_b16_posts_status ON b16_posts(status);
CREATE INDEX IF NOT EXISTS idx_b16_posts_category ON b16_posts(category);
CREATE INDEX IF NOT EXISTS idx_b16_swaps_post_id ON b16_swaps(post_id);
CREATE INDEX IF NOT EXISTS idx_b16_swaps_participants ON b16_swaps(owner_id, requester_id);
CREATE INDEX IF NOT EXISTS idx_b16_messages_swap_id ON b16_messages(swap_id);
