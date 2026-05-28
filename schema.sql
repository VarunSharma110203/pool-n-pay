-- schema.sql
-- Run this in your Supabase SQL Editor to set up the Production database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  upi_id TEXT NOT NULL,
  has_onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Friends Table
CREATE TABLE friends (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  friend_id UUID REFERENCES profiles(id) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('friend', 'pending_sent', 'pending_received')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, friend_id)
);

-- 3. Groups Table
CREATE TABLE groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('split', 'pool')),
  target_amount DECIMAL(10,2),
  emoji TEXT DEFAULT '🌴',
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Group Members Table
CREATE TABLE group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, user_id)
);

-- 5. Expenses Table
CREATE TABLE expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payer_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Expense Participants Table
CREATE TABLE expense_participants (
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (expense_id, user_id)
);

-- 7. Contributions Table (for Pools)
CREATE TABLE contributions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  member_id UUID REFERENCES profiles(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. Activities Table
CREATE TABLE activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  amount TEXT,
  type TEXT NOT NULL CHECK (type IN ('expense', 'payment', 'pool')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
