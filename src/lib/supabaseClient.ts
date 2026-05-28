import { createClient } from "@supabase/supabase-js";

// Retrieve keys from environment
const url = import.meta.env.VITE_SUPABASE_URL || "";
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const isConfigured = !!(url && key);

export const supabase = isConfigured ? createClient(url, key) : null as any;

// ==========================================
// HELPERS
// ==========================================

export const timeAgo = (isoString: string): string => {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diff = Math.floor((now - then) / 1000); 

  if (diff < 30) return "Just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return new Date(isoString).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export const isFirstVisit = (): boolean => {
  return localStorage.getItem("pnp_onboarded") !== "true";
};

export const markOnboarded = (): void => {
  localStorage.setItem("pnp_onboarded", "true");
};

// ==========================================
// REAL SUPABASE DATABASE SERVICE
// ==========================================

export const dbService = {
  isConfigured: () => isConfigured,

  // ----- Auth -----
  getSession: async () => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  signIn: async (email: string, name?: string) => {
    if (!supabase) return { error: new Error("Supabase not configured") };
    return await supabase.auth.signInWithOtp({ email });
  },

  signOut: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  },

  // ----- Profile -----
  getProfile: async () => {
    if (!supabase) return null;
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return null;
    
    const { data } = await supabase.from('profiles').select('*').eq('id', session.session.user.id).single();
    if (data) return data;
    
    // Create default profile if missing
    const defaultProfile = {
      id: session.session.user.id,
      name: session.session.user.email?.split('@')[0] || "User",
      avatar: "U",
      upi_id: "user@upi"
    };
    await supabase.from('profiles').insert(defaultProfile);
    return defaultProfile;
  },

  updateProfile: async (name: string, upiId: string) => {
    if (!supabase) return null;
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return null;

    const avatar = name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    
    const { data } = await supabase.from('profiles').upsert({
      id: session.session.user.id,
      name,
      upi_id: upiId,
      avatar
    }).select().single();
    
    return data;
  },

  // ----- Friends -----
  getFriends: async () => {
    if (!supabase) return [];
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return [];

    const { data, error } = await supabase
      .from('friends')
      .select('id, status, profiles!friend_id(name, avatar, upi_id)')
      .eq('user_id', session.session.user.id);
      
    if (error || !data) return [];
    
    return data.map((f: any) => ({
      id: f.id,
      name: f.profiles.name,
      avatar: f.profiles.avatar,
      upi_id: f.profiles.upi_id,
      status: f.status
    }));
  },

  addFriendRequest: async (name: string, upiId?: string) => {
    // In a real app, you'd search for the user by UPI or Email.
    // For now, we mock the friend if they don't exist in DB to prevent breakage.
    alert("Friend requests require searching by exact Email in production.");
    return null;
  },

  acceptFriend: async (friendId: string) => {
    if (!supabase) return;
    await supabase.from('friends').update({ status: 'friend' }).eq('id', friendId);
  },

  // ----- Groups -----
  getGroups: async () => {
    if (!supabase) return [];
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return [];

    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        group_members!inner(profiles(name))
      `);

    if (error || !data) return [];

    return data.map((g: any) => ({
      id: g.id,
      name: g.name,
      mode: g.mode,
      emoji: g.emoji,
      target_amount: g.target_amount,
      members: g.group_members.map((gm: any) => gm.profiles.name)
    }));
  },

  getOrCreateDirectGroup: async (friendName: string) => {
    if (!supabase) return null;
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return null;
    
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', session.session.user.id).single();
    if (!profile) return null;

    const directGroupName = `Direct: ${friendName}`;
    const { data: existing } = await supabase.from('groups').select('id').eq('name', directGroupName).single();
    
    if (existing) return existing.id;
    
    // Fallback: create group 
    // Note: requires actual UUID mapping for friendName in production
    return null; 
  },

  createGroup: async (name: string, mode: "split" | "pool", memberNames: string[], targetAmount?: number, emoji?: string) => {
    if (!supabase) return null;
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return null;

    const { data: group } = await supabase.from('groups').insert({
      name,
      mode,
      target_amount: targetAmount,
      emoji,
      created_by: session.session.user.id
    }).select().single();

    if (group) {
      // Need to find UUIDs for memberNames. This is tricky in a purely name-based architecture.
      // We will skip inserting group_members in this simplified migration unless we lookup UUIDs.
    }
    return group;
  },

  updateGroupTarget: async (groupId: string, newTarget: number) => {
    if (!supabase) return;
    await supabase.from('groups').update({ target_amount: newTarget }).eq('id', groupId);
  },

  // ----- Expenses -----
  getExpenses: async (groupId: string) => {
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        profiles!payer_id(name, avatar),
        expense_participants(profiles(name))
      `)
      .eq('group_id', groupId);
      
    if (error || !data) return [];
    
    return data.map((e: any) => ({
      id: e.id,
      group_id: e.group_id,
      description: e.description,
      amount: e.amount,
      payer: e.profiles.name,
      payer_avatar: e.profiles.avatar,
      participants: e.expense_participants.map((ep: any) => ep.profiles.name),
      created_at: e.created_at
    }));
  },

  addExpense: async (groupId: string, description: string, amount: number, payerName: string, participantNames: string[]) => {
    if (!supabase) return null;
    return null; // Production implementation requires UUID lookup
  },

  // ----- Pools -----
  getContributions: async (groupId: string) => {
    if (!supabase) return [];
    const { data } = await supabase
      .from('contributions')
      .select('*, profiles(name)')
      .eq('group_id', groupId);
    
    if (!data) return [];
    return data.map((c: any) => ({
      id: c.id,
      group_id: c.group_id,
      member: c.profiles.name,
      amount: c.amount,
      created_at: c.created_at
    }));
  },

  addContribution: async (groupId: string, memberName: string, amount: number) => {
    if (!supabase) return null;
    return null; // Production implementation requires UUID lookup
  },

  // ----- Activities -----
  getActivities: async (groupId?: string) => {
    if (!supabase) return [];
    const query = supabase.from('activities').select('*, profiles(avatar)').order('created_at', { ascending: false });
    if (groupId) query.eq('group_id', groupId);
    
    const { data } = await query;
    if (!data) return [];
    
    return data.map((a: any) => ({
      id: a.id,
      avatar: a.profiles?.avatar || "✨",
      name: a.action,
      action: a.action,
      amount: a.amount,
      type: a.type,
      timeAgo: timeAgo(a.created_at)
    }));
  },
};
