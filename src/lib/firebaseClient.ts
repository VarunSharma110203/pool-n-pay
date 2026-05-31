import { initializeApp } from "firebase/app";
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, 
  addDoc, updateDoc, deleteDoc, arrayUnion
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBTCLMQiu9asDbsMdRTMuD_F-zrMp6d4U8",
  authDomain: "poolandpay.firebaseapp.com",
  projectId: "poolandpay",
  storageBucket: "poolandpay.firebasestorage.app",
  messagingSenderId: "949364816883",
  appId: "1:949364816883:web:6861618eed4521aa3ef086",
  measurementId: "G-RRPFF65YN0"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

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

export const getInviteCode = (): string => {
  const stored = localStorage.getItem("pnp_invite_code");
  if (stored) return stored;
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  localStorage.setItem("pnp_invite_code", code);
  return code;
};

export const isFirstVisit = (): boolean => {
  return localStorage.getItem("pnp_onboarded") !== "true";
};

export const markOnboarded = (): void => {
  localStorage.setItem("pnp_onboarded", "true");
};

let cachedProfile: any = null;

export const dbService = {
  isConfigured: () => true,

  getSession: async (): Promise<any> => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user ? { user } : null);
      });
    });
  },

  signInWithPassword: async (email: string, password?: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password || "default123");
      window.dispatchEvent(new Event("pool_n_pay_auth_change"));
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  },

  signUp: async (email: string, password?: string, name?: string, upiId?: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password || "default123");
      if (name && upiId) {
        const initials = name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
        await setDoc(doc(db, "profiles", res.user.uid), {
          name: name.trim(),
          upi_id: upiId,
          avatar: initials
        });
      }
      window.dispatchEvent(new Event("pool_n_pay_auth_change"));
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  },

  signOut: async () => {
    cachedProfile = null;
    await firebaseSignOut(auth);
    window.dispatchEvent(new Event("pool_n_pay_auth_change"));
  },

  getProfile: async () => {
    if (cachedProfile) return cachedProfile;
    const user = auth.currentUser;
    if (!user) return null;
    const snap = await getDoc(doc(db, "profiles", user.uid));
    if (snap.exists()) {
      cachedProfile = { id: user.uid, ...snap.data() };
      return cachedProfile;
    }
    return null;
  },

  updateProfile: async (name: string, upiId: string) => {
    const user = auth.currentUser;
    if (!user) return null;
    const avatar = name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    await setDoc(doc(db, "profiles", user.uid), { name, upi_id: upiId, avatar }, { merge: true });
    cachedProfile = { id: user.uid, name, upi_id: upiId, avatar };
    return cachedProfile;
  },

  getFriends: async () => {
    const profile = await dbService.getProfile();
    if (!profile) return [];
    
    const q1 = query(collection(db, "friends"), where("sender_name", "==", profile.name));
    const q2 = query(collection(db, "friends"), where("receiver_name", "==", profile.name));
    
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const friends: any[] = [];
    
    snap1.forEach(d => {
      const data = d.data();
      friends.push({
        id: d.id,
        name: data.receiver_name,
        avatar: data.receiver_avatar || data.receiver_name.slice(0,2).toUpperCase(),
        upi_id: data.receiver_upi || `${data.receiver_name.replace(/\s+/g,"").toLowerCase()}@upi`,
        status: data.status === "pending" ? "pending_sent" : "friend"
      });
    });
    
    snap2.forEach(d => {
      const data = d.data();
      friends.push({
        id: d.id,
        name: data.sender_name,
        avatar: data.sender_avatar || data.sender_name.slice(0,2).toUpperCase(),
        upi_id: data.sender_upi || `${data.sender_name.replace(/\s+/g,"").toLowerCase()}@upi`,
        status: data.status === "pending" ? "pending_received" : "friend"
      });
    });
    
    return friends;
  },

  addFriendRequest: async (name: string, upiId?: string) => {
    const profile = await dbService.getProfile();
    if (!profile) return null;
    
    const ref = await addDoc(collection(db, "friends"), {
      sender_name: profile.name,
      sender_avatar: profile.avatar,
      sender_upi: profile.upi_id,
      receiver_name: name,
      receiver_avatar: name.slice(0,2).toUpperCase(),
      receiver_upi: upiId || `${name.replace(/\s+/g,"").toLowerCase()}@upi`,
      status: "pending"
    });
    
    return {
      id: ref.id,
      name,
      avatar: name.slice(0,2).toUpperCase(),
      upi_id: upiId || `${name.replace(/\s+/g,"").toLowerCase()}@upi`,
      status: "pending_sent"
    };
  },

  acceptFriend: async (friendId: string) => {
    const profile = await dbService.getProfile();
    if (!profile) return [];
    
    await updateDoc(doc(db, "friends", friendId), { status: "friend" });
    
    await addDoc(collection(db, "activities"), {
      avatar: profile.avatar,
      name: profile.name,
      action: "accepted a friend request",
      amount: "",
      type: "payment",
      created_at: new Date().toISOString()
    });
    window.dispatchEvent(new Event("pool_n_pay_db_change"));
    return await dbService.getFriends();
  },

  removeFriend: async (friendId: string) => {
    await deleteDoc(doc(db, "friends", friendId));
    window.dispatchEvent(new Event("pool_n_pay_db_change"));
  },

  getGroups: async (): Promise<any[]> => {
    const profile = await dbService.getProfile();
    if (!profile) return [];
    
    const q = query(collection(db, "groups"), where("members", "array-contains", profile.name));
    const snap = await getDocs(q);
    
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  updateGroupTarget: async (groupId: string, newTarget: number) => {
    await updateDoc(doc(db, "groups", groupId), { target_amount: newTarget });
    window.dispatchEvent(new Event("pool_n_pay_db_change"));
  },

  createGroup: async (name: string, mode: "split" | "pool", members: string[], targetAmount?: number, emoji: string = "🌴") => {
    const profile = await dbService.getProfile();
    if (!profile) return null;
    
    const allMembers = Array.from(new Set([profile.name, ...members]));
    
    const ref = await addDoc(collection(db, "groups"), {
      name,
      mode,
      members: allMembers,
      target_amount: targetAmount || null,
      emoji,
      created_at: new Date().toISOString()
    });
    
    await addDoc(collection(db, "activities"), {
      group_id: ref.id,
      avatar: profile.avatar,
      name: profile.name,
      action: `created the group "${name}"`,
      amount: mode === "pool" ? `Goal: ₹${targetAmount?.toLocaleString()}` : "",
      type: "pool",
      created_at: new Date().toISOString()
    });
    
    window.dispatchEvent(new Event("pool_n_pay_db_change"));
    return { id: ref.id, name, mode, members: allMembers, target_amount: targetAmount, emoji, created_at: new Date().toISOString() };
  },

  getOrCreateDirectGroup: async (friendName: string) => {
    const profile = await dbService.getProfile();
    if (!profile) return null;
    
    const q = query(collection(db, "groups"), 
      where("mode", "==", "split"),
      where("members", "array-contains", profile.name)
    );
    const snap = await getDocs(q);
    
    const existing = snap.docs.find(d => {
      const data = d.data();
      return data.members.length === 2 && data.members.includes(friendName);
    });
    
    if (existing) return { id: existing.id, ...existing.data() };
    
    const ref = await addDoc(collection(db, "groups"), {
      name: friendName,
      mode: "split",
      members: [profile.name, friendName],
      target_amount: null,
      emoji: "💬",
      created_at: new Date().toISOString()
    });
    window.dispatchEvent(new Event("pool_n_pay_db_change"));
    return { id: ref.id, name: friendName, mode: "split", members: [profile.name, friendName], emoji: "💬", created_at: new Date().toISOString() };
  },

  addGroupMember: async (groupId: string, memberName: string) => {
    const profile = await dbService.getProfile();
    await updateDoc(doc(db, "groups", groupId), {
      members: arrayUnion(memberName)
    });
    
    if (profile) {
      await addDoc(collection(db, "activities"), {
        group_id: groupId,
        avatar: "➕",
        name: profile.name,
        action: `added ${memberName} to the group`,
        amount: "",
        type: "pool",
        created_at: new Date().toISOString()
      });
    }
    window.dispatchEvent(new Event("pool_n_pay_db_change"));
  },

  getExpenses: async (groupId: string): Promise<any[]> => {
    const q = query(collection(db, "expenses"), where("group_id", "==", groupId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  addExpense: async (groupId: string, description: string, amount: number, payerName: string, payerAvatar: string, participants: string[]) => {
    const ref = await addDoc(collection(db, "expenses"), {
      group_id: groupId,
      description,
      amount,
      payer: payerName,
      payer_avatar: payerAvatar,
      participants,
      created_at: new Date().toISOString()
    });
    
    const gSnap = await getDoc(doc(db, "groups", groupId));
    const gName = gSnap.exists() ? gSnap.data().name : "";
    
    await addDoc(collection(db, "activities"), {
      group_id: groupId,
      avatar: payerAvatar,
      name: payerName,
      action: `paid for ${description}${gName ? " in " + gName : ""}`,
      amount: `₹${amount.toLocaleString()}`,
      type: "expense",
      created_at: new Date().toISOString()
    });
    window.dispatchEvent(new Event("pool_n_pay_db_change"));
    return { id: ref.id, group_id: groupId, description, amount, payer: payerName, payer_avatar: payerAvatar, participants, created_at: new Date().toISOString() };
  },

  getContributions: async (groupId: string): Promise<any[]> => {
    const q = query(collection(db, "contributions"), where("group_id", "==", groupId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  addContribution: async (groupId: string, memberName: string, amount: number) => {
    const profile = await dbService.getProfile();
    const avatar = profile && profile.name === memberName ? profile.avatar : "🧑";
    
    const ref = await addDoc(collection(db, "contributions"), {
      group_id: groupId,
      member: memberName,
      amount,
      created_at: new Date().toISOString()
    });
    
    await addDoc(collection(db, "activities"), {
      group_id: groupId,
      avatar,
      name: memberName,
      action: `contributed to the pool`,
      amount: `₹${amount.toLocaleString()}`,
      type: "pool",
      created_at: new Date().toISOString()
    });
    window.dispatchEvent(new Event("pool_n_pay_db_change"));
    return { id: ref.id, group_id: groupId, member: memberName, amount, created_at: new Date().toISOString() };
  },

  getActivities: async (): Promise<any[]> => {
    const profile = await dbService.getProfile();
    if (!profile) return [];
    
    const groups = await dbService.getGroups();
    const groupIds = groups.map((g: any) => g.id);
    if (groupIds.length === 0) return [];
    
    const allActivities: any[] = [];
    for (let i = 0; i < groupIds.length; i += 10) {
      const chunk = groupIds.slice(i, i + 10);
      const q = query(collection(db, "activities"), where("group_id", "in", chunk));
      const snap = await getDocs(q);
      allActivities.push(...snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    
    return allActivities.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, 30);
  },

  getBalances: async () => {
    const profile = await dbService.getProfile();
    if (!profile) return { youOwe: 0, owedToYou: 0, net: 0 };
    const myName = profile.name;
    
    const groups = await dbService.getGroups();
    const splitGroupIds = groups.filter((g: any) => g.mode === "split").map((g: any) => g.id);
    if (splitGroupIds.length === 0) return { youOwe: 0, owedToYou: 0, net: 0 };
    
    let youOwe = 0;
    let owedToYou = 0;
    
    for (let i = 0; i < splitGroupIds.length; i += 10) {
      const chunk = splitGroupIds.slice(i, i + 10);
      const q = query(collection(db, "expenses"), where("group_id", "in", chunk));
      const snap = await getDocs(q);
      
      snap.forEach(d => {
        const exp = d.data();
        const share = exp.amount / exp.participants.length;
        if (exp.payer === myName) {
          exp.participants.forEach((p: string) => {
            if (p !== myName) owedToYou += share;
          });
        } else {
          if (exp.participants.includes(myName)) youOwe += share;
        }
      });
    }
    
    return {
      youOwe: Math.round(youOwe),
      owedToYou: Math.round(owedToYou),
      net: Math.round(owedToYou - youOwe)
    };
  },

  resetDb: async () => {},
  getFriendBalances: async () => {
    const profile = await dbService.getProfile();
    if (!profile) return {};
    const myName = profile.name;
    
    const friends = await dbService.getFriends();
    const balances: { [name: string]: number } = {};
    friends.forEach((f: any) => { balances[f.name] = 0; });
    
    const groups = await dbService.getGroups();
    const splitGroupIds = groups.filter((g: any) => g.mode === "split").map((g: any) => g.id);
    
    if (splitGroupIds.length > 0) {
      for (let i = 0; i < splitGroupIds.length; i += 10) {
        const chunk = splitGroupIds.slice(i, i + 10);
        const q = query(collection(db, "expenses"), where("group_id", "in", chunk));
        const snap = await getDocs(q);
        
        snap.forEach(d => {
          const exp = d.data();
          const share = exp.amount / exp.participants.length;
          if (exp.payer === myName) {
            exp.participants.forEach((p: string) => {
              if (p !== myName && balances[p] !== undefined) balances[p] += share;
            });
          } else {
            if (exp.participants.includes(myName) && balances[exp.payer] !== undefined) {
              balances[exp.payer] -= share;
            }
          }
        });
      }
    }
    
    const result: any = {};
    friends.forEach((f: any) => {
      const bal = balances[f.name] || 0;
      if (bal > 0.01) {
        result[f.name] = { label: `Owes you ₹${Math.round(bal)}`, positive: true, amount: Math.round(bal) };
      } else if (bal < -0.01) {
        result[f.name] = { label: `You owe ₹${Math.round(Math.abs(bal))}`, positive: false, amount: Math.round(bal) };
      } else {
        result[f.name] = { label: "Settled up", positive: null, amount: 0 };
      }
    });
    
    return result;
  }
};
