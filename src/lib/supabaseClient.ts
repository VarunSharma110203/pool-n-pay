import { createClient } from "@supabase/supabase-js";

// Retrieve keys from localStorage if available, or check import.meta.env
const getSupabaseCredentials = () => {
  const localUrl = localStorage.getItem("POOL_N_PAY_SUPABASE_URL");
  const localKey = localStorage.getItem("POOL_N_PAY_SUPABASE_KEY");
  const url = localUrl || import.meta.env.VITE_SUPABASE_URL || "";
  const key = localKey || import.meta.env.VITE_SUPABASE_ANON_KEY || "";
  return { url, key, isConfigured: !!(url && key) };
};

const { url, key, isConfigured } = getSupabaseCredentials();
export const supabase = isConfigured ? createClient(url, key) : null;

// ==========================================
// HELPERS
// ==========================================

/** Compute a human-readable relative timestamp from an ISO string */
export const timeAgo = (isoString: string): string => {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diff = Math.floor((now - then) / 1000); // seconds ago

  if (diff < 30) return "Just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return new Date(isoString).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

/** Get or create a persistent invite code for this user */
export const getInviteCode = (): string => {
  const stored = localStorage.getItem("pnp_invite_code");
  if (stored) return stored;
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  localStorage.setItem("pnp_invite_code", code);
  return code;
};

/** Check if this is the user's first time (for splash animation) */
export const isFirstVisit = (): boolean => {
  return localStorage.getItem("pnp_onboarded") !== "true";
};

export const markOnboarded = (): void => {
  localStorage.setItem("pnp_onboarded", "true");
};

// ==========================================
// REACTIVE LOCALSTORAGE MOCK DATABASE
// ==========================================

const MOCK_STORAGE_KEY = "pool_n_pay_db_v3";

interface DbState {
  profile: {
    name: string;
    upi_id: string;
    avatar: string;
  };
  friends: Array<{
    id: string;
    name: string;
    avatar: string;
    upi_id: string;
    status: "friend" | "pending_sent" | "pending_received";
  }>;
  groups: Array<{
    id: string;
    name: string;
    mode: "split" | "pool";
    members: string[];
    target_amount?: number;
    emoji: string;
    created_at: string;
  }>;
  expenses: Array<{
    id: string;
    group_id: string;
    description: string;
    amount: number;
    payer: string;
    payer_avatar: string;
    participants: string[];
    created_at: string;
  }>;
  contributions: Array<{
    id: string;
    group_id: string;
    member: string;
    amount: number;
    created_at: string;
  }>;
  activities: Array<{
    id: string;
    group_id?: string;
    avatar: string;
    name: string;
    action: string;
    amount: string;
    type: "expense" | "payment" | "pool";
    created_at: string;
  }>;
}

const DEFAULT_STATE: DbState = {
  profile: {
    name: "Aarav Sharma",
    upi_id: "aarav@paytm",
    avatar: "AS",
  },
  friends: [
    { id: "f1", name: "Arjun", avatar: "🧑‍🦱", upi_id: "arjun@okhdfcbank", status: "friend" },
    { id: "f2", name: "Priya", avatar: "👩", upi_id: "priya@okaxis", status: "friend" },
    { id: "f3", name: "Rahul", avatar: "🧔", upi_id: "rahul@okicici", status: "friend" },
    { id: "f4", name: "Meera", avatar: "👩‍🦰", upi_id: "meera@paytm", status: "pending_received" },
  ],
  groups: [
    { id: "g1", name: "Goa Trip", mode: "split", members: ["Aarav Sharma", "Arjun", "Priya", "Rahul"], emoji: "🏖️", created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() },
    { id: "g2", name: "Flat Expenses", mode: "pool", members: ["Aarav Sharma", "Arjun", "Priya"], target_amount: 15000, emoji: "🏠", created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() },
    { id: "g3", name: "Birthday Bash", mode: "pool", members: ["Aarav Sharma", "Arjun", "Priya", "Rahul"], target_amount: 5000, emoji: "🎂", created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString() },
  ],
  expenses: [
    { id: "e1", group_id: "g1", description: "Beach Shack Dinner", amount: 4800, payer: "Arjun", payer_avatar: "🧑‍🦱", participants: ["Aarav Sharma", "Arjun", "Priya", "Rahul"], created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
    { id: "e2", group_id: "g1", description: "Scuba Diving", amount: 8000, payer: "Aarav Sharma", payer_avatar: "AS", participants: ["Aarav Sharma", "Arjun", "Priya", "Rahul"], created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
    { id: "e3", group_id: "g1", description: "Taxi to Baga Beach", amount: 1200, payer: "Priya", payer_avatar: "👩", participants: ["Aarav Sharma", "Arjun", "Priya"], created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
    { id: "e4", group_id: "g1", description: "Villa Booking Deposit", amount: 16000, payer: "Arjun", payer_avatar: "🧑‍🦱", participants: ["Aarav Sharma", "Arjun", "Priya", "Rahul"], created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString() },
  ],
  contributions: [
    { id: "c1", group_id: "g2", member: "Aarav Sharma", amount: 3000, created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() },
    { id: "c2", group_id: "g2", member: "Arjun", amount: 3000, created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
    { id: "c3", group_id: "g2", member: "Priya", amount: 2500, created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString() },
    { id: "c4", group_id: "g3", member: "Aarav Sharma", amount: 1500, created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString() },
    { id: "c5", group_id: "g3", member: "Rahul", amount: 1000, created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString() },
  ],
  activities: [
    { id: "a1", group_id: "g1", avatar: "🧑‍🦱", name: "Arjun", action: "paid for Beach Shack Dinner in Goa Trip", amount: "₹4,800", type: "expense", created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
    { id: "a2", group_id: "g1", avatar: "👩", name: "Priya", action: "settled up with you", amount: "₹650", type: "payment", created_at: new Date(Date.now() - 3600 * 1000).toISOString() },
    { id: "a3", group_id: "g2", avatar: "🧔", name: "Rahul", action: "contributed to Birthday Bash pool", amount: "₹1,000", type: "pool", created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString() },
    { id: "a4", group_id: "g1", avatar: "AS", name: "Aarav Sharma", action: "paid for Scuba Diving in Goa Trip", amount: "₹8,000", type: "expense", created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
    { id: "a5", group_id: "g1", avatar: "🧑‍🦱", name: "Arjun", action: "paid for Villa Booking Deposit in Goa Trip", amount: "₹16,000", type: "expense", created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString() },
  ]
};

// Initialize DB in LocalStorage
export const getLocalDb = (): DbState => {
  const data = localStorage.getItem(MOCK_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(DEFAULT_STATE));
    return DEFAULT_STATE;
  }
  try {
    return JSON.parse(data);
  } catch {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(DEFAULT_STATE));
    return DEFAULT_STATE;
  }
};

export const saveLocalDb = (state: DbState): void => {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("pool_n_pay_db_change"));
};

// ==========================================
// DUAL-MODE API METHODS
// ==========================================

export const dbService = {
  isConfigured: () => isConfigured,

  // ----- Auth -----
  getSession: async () => {
    if (isConfigured && supabase) {
      const { data } = await supabase.auth.getSession();
      return data.session;
    }
    const hasSession = localStorage.getItem("pool_n_pay_logged_in") === "true";
    if (hasSession) return { user: { email: "demo@poolnpay.app", id: "mock-user-123" } };
    return null;
  },

  signIn: async (email: string, name?: string) => {
    if (isConfigured && supabase) {
      return await supabase.auth.signInWithOtp({ email });
    }
    // Sandbox mode: set session + update profile name if provided
    localStorage.setItem("pool_n_pay_logged_in", "true");
    if (name && name.trim()) {
      const db = getLocalDb();
      const initials = name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
      db.profile.name = name.trim();
      db.profile.avatar = initials;
      db.profile.upi_id = db.profile.upi_id || `${name.trim().toLowerCase().replace(/\s+/g, "")}@okaxis`;
      // Update "Aarav Sharma" references in groups/activities to new name
      saveLocalDb(db);
    }
    window.dispatchEvent(new Event("pool_n_pay_auth_change"));
    return { error: null };
  },

  signOut: async () => {
    if (isConfigured && supabase) {
      await supabase.auth.signOut();
      return;
    }
    localStorage.removeItem("pool_n_pay_logged_in");
    window.dispatchEvent(new Event("pool_n_pay_auth_change"));
  },

  // ----- Profile -----
  getProfile: async () => {
    const db = getLocalDb();
    return db.profile;
  },

  updateProfile: async (name: string, upiId: string) => {
    const db = getLocalDb();
    db.profile.name = name;
    db.profile.upi_id = upiId;
    db.profile.avatar = name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    saveLocalDb(db);
    return db.profile;
  },

  // ----- Friends -----
  getFriends: async () => {
    const db = getLocalDb();
    return db.friends;
  },

  addFriendRequest: async (name: string, upiId?: string) => {
    const db = getLocalDb();
    const newFriend = {
      id: "f_" + Math.random().toString(36).substr(2, 9),
      name,
      avatar: name.slice(0, 2).toUpperCase(),
      upi_id: upiId || `${name.toLowerCase().replace(/\s+/g, "")}@okaxis`,
      status: "pending_sent" as const,
    };
    db.friends.push(newFriend);
    saveLocalDb(db);
    return newFriend;
  },

  acceptFriend: async (friendId: string) => {
    const db = getLocalDb();
    const friend = db.friends.find(f => f.id === friendId);
    if (friend) {
      friend.status = "friend";
      db.activities.unshift({
        id: "a_" + Math.random().toString(36).substr(2, 9),
        avatar: friend.avatar,
        name: friend.name,
        action: "joined your tribe 🌴",
        amount: "",
        type: "payment",
        created_at: new Date().toISOString(),
      });
      saveLocalDb(db);
    }
    return db.friends;
  },

  removeFriend: async (friendId: string) => {
    const db = getLocalDb();
    db.friends = db.friends.filter(f => f.id !== friendId);
    saveLocalDb(db);
  },

  // ----- Groups -----
  getGroups: async () => {
    const db = getLocalDb();
    return db.groups;
  },



  updateGroupTarget: async (groupId: string, newTarget: number) => {
    const db = getLocalDb();
    const group = db.groups.find(g => g.id === groupId);
    if (group) {
      group.target_amount = newTarget;
      saveLocalDb(db);
    }
  },

  createGroup: async (name: string, mode: "split" | "pool", members: string[], targetAmount?: number, emoji: string = "🌴") => {
    const db = getLocalDb();
    const newGroup = {
      id: "g_" + Math.random().toString(36).substr(2, 9),
      name,
      mode,
      members: [db.profile.name, ...members.filter(m => m !== db.profile.name)],
      target_amount: targetAmount,
      emoji,
      created_at: new Date().toISOString(),
    };
    db.groups.push(newGroup);
    db.activities.unshift({
      id: "a_" + Math.random().toString(36).substr(2, 9),
      group_id: newGroup.id,
      avatar: db.profile.avatar,
      name: db.profile.name,
      action: `created the group "${name}"`,
      amount: mode === "pool" ? `Goal: ₹${targetAmount?.toLocaleString()}` : "",
      type: "pool",
      created_at: new Date().toISOString(),
    });
    saveLocalDb(db);
    return newGroup;
  },

  getOrCreateDirectGroup: async (friendName: string) => {
    const db = getLocalDb();
    const myName = db.profile.name;
    const existing = db.groups.find(g => 
      g.mode === "split" && 
      g.members.length === 2 && 
      g.members.includes(myName) && 
      g.members.includes(friendName)
    );
    if (existing) return existing;

    const newGroup = {
      id: "g_" + Math.random().toString(36).substr(2, 9),
      name: friendName,
      mode: "split" as const,
      members: [myName, friendName],
      target_amount: undefined,
      emoji: "💬",
      created_at: new Date().toISOString(),
    };
    db.groups.push(newGroup);
    db.activities.unshift({
      id: "a_" + Math.random().toString(36).substr(2, 9),
      group_id: newGroup.id,
      avatar: "💬",
      name: myName,
      action: `started a direct split with ${friendName}`,
      amount: "",
      type: "expense" as const,
      created_at: new Date().toISOString(),
    });
    saveLocalDb(db);
    return newGroup;
  },
  addGroupMember: async (groupId: string, memberName: string) => {
    const db = getLocalDb();
    const group = db.groups.find(g => g.id === groupId);
    if (group && !group.members.includes(memberName)) {
      group.members.push(memberName);
      db.activities.unshift({
        id: "a_" + Math.random().toString(36).substr(2, 9),
        group_id: groupId,
        avatar: "➕",
        name: db.profile.name,
        action: `added ${memberName} to ${group.name}`,
        amount: "",
        type: "pool" as const,
        created_at: new Date().toISOString(),
      });
      saveLocalDb(db);
    }
    return group;
  },
  // ----- Expenses (Split Mode) -----
  getExpenses: async (groupId: string) => {
    const db = getLocalDb();
    return db.expenses.filter(e => e.group_id === groupId);
  },

  addExpense: async (groupId: string, description: string, amount: number, payerName: string, payerAvatar: string, participants: string[]) => {
    const db = getLocalDb();
    const newExpense = {
      id: "e_" + Math.random().toString(36).substr(2, 9),
      group_id: groupId,
      description,
      amount,
      payer: payerName,
      payer_avatar: payerAvatar,
      participants,
      created_at: new Date().toISOString(),
    };
    db.expenses.push(newExpense);
    const group = db.groups.find(g => g.id === groupId);
    db.activities.unshift({
      id: "a_" + Math.random().toString(36).substr(2, 9),
      group_id: groupId,
      avatar: payerAvatar,
      name: payerName,
      action: `paid for ${description}${group ? " in " + group.name : ""}`,
      amount: `₹${amount.toLocaleString()}`,
      type: "expense",
      created_at: new Date().toISOString(),
    });
    saveLocalDb(db);
    return newExpense;
  },

  // ----- Pool contributions -----
  getContributions: async (groupId: string) => {
    const db = getLocalDb();
    return db.contributions.filter(c => c.group_id === groupId);
  },

  addContribution: async (groupId: string, memberName: string, amount: number) => {
    const db = getLocalDb();
    const newContrib = {
      id: "c_" + Math.random().toString(36).substr(2, 9),
      group_id: groupId,
      member: memberName,
      amount,
      created_at: new Date().toISOString(),
    };
    db.contributions.push(newContrib);
    const group = db.groups.find(g => g.id === groupId);
    db.activities.unshift({
      id: "a_" + Math.random().toString(36).substr(2, 9),
      group_id: groupId,
      avatar: memberName === db.profile.name ? db.profile.avatar : "🧑",
      name: memberName,
      action: `contributed to ${group ? group.name : "Pool"}`,
      amount: `₹${amount.toLocaleString()}`,
      type: "pool",
      created_at: new Date().toISOString(),
    });
    saveLocalDb(db);
    return newContrib;
  },

  // ----- Activities -----
  getActivities: async () => {
    const db = getLocalDb();
    return db.activities;
  },

  // ----- Balances -----
  getBalances: async () => {
    const db = getLocalDb();
    const myName = db.profile.name;
    let youOwe = 0;
    let owedToYou = 0;

    db.groups.forEach(group => {
      if (group.mode === "split") {
        const groupExpenses = db.expenses.filter(e => e.group_id === group.id);
        groupExpenses.forEach(exp => {
          const share = exp.amount / exp.participants.length;
          if (exp.payer === myName) {
            exp.participants.forEach(p => {
              if (p !== myName) owedToYou += share;
            });
          } else {
            if (exp.participants.includes(myName)) youOwe += share;
          }
        });
      }
    });

    const net = owedToYou - youOwe;
    return {
      youOwe: Math.round(youOwe),
      owedToYou: Math.round(owedToYou),
      net: Math.round(net),
    };
  },

  getFriendBalances: async () => {
    const db = getLocalDb();
    const myName = db.profile.name;
    const balances: { [name: string]: number } = {};

    db.friends.forEach(f => {
      balances[f.name] = 0;
    });

    db.groups.forEach(group => {
      if (group.mode === "split" && group.members.includes(myName)) {
        const groupExpenses = db.expenses.filter(e => e.group_id === group.id);
        groupExpenses.forEach(exp => {
          const share = exp.amount / exp.participants.length;
          if (exp.payer === myName) {
            exp.participants.forEach(p => {
              if (p !== myName && balances[p] !== undefined) {
                balances[p] += share;
              }
            });
          } else {
            if (exp.participants.includes(myName) && balances[exp.payer] !== undefined) {
              balances[exp.payer] -= share;
            }
          }
        });
      }
    });

    const result: { [name: string]: { label: string; positive: boolean | null; amount: number } } = {};
    db.friends.forEach(f => {
      const bal = balances[f.name] || 0;
      if (bal > 0.1) {
        result[f.name] = { label: `owes you ₹${Math.round(bal).toLocaleString()}`, positive: true, amount: Math.round(bal) };
      } else if (bal < -0.1) {
        result[f.name] = { label: `you owe ₹${Math.round(Math.abs(bal)).toLocaleString()}`, positive: false, amount: Math.round(Math.abs(bal)) };
      } else {
        result[f.name] = { label: "all settled ✨", positive: null, amount: 0 };
      }
    });

    return result;
  },

  // ----- Reset -----
  resetDb: () => {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(DEFAULT_STATE));
    window.dispatchEvent(new Event("pool_n_pay_db_change"));
  },
};
