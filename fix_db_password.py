with open("src/lib/supabaseClient.ts", "r") as f:
    content = f.read()

old_signin = """  signIn: async (email: string, name?: string) => {
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
  },"""

new_signin = """  signInWithPassword: async (email: string, password?: string) => {
    if (isConfigured && supabase) {
      return await supabase.auth.signInWithPassword({ email, password: password || "fallback" });
    }
    localStorage.setItem("pool_n_pay_logged_in", "true");
    window.dispatchEvent(new Event("pool_n_pay_auth_change"));
    return { error: null };
  },

  signUp: async (email: string, password?: string, name?: string) => {
    if (isConfigured && supabase) {
      const res = await supabase.auth.signUp({ email, password: password || "fallback" });
      if (!res.error && name) {
        // Automatically create their profile
        await supabase.from('profiles').upsert({
          id: res.data.user?.id,
          name: name.trim(),
          avatar: name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2),
          upi_id: `${name.trim().toLowerCase().replace(/\s+/g, "")}@okaxis`
        });
      }
      return res;
    }
    
    // Sandbox mode
    localStorage.setItem("pool_n_pay_logged_in", "true");
    if (name && name.trim()) {
      const db = getLocalDb();
      const initials = name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
      db.profile.name = name.trim();
      db.profile.avatar = initials;
      db.profile.upi_id = db.profile.upi_id || `${name.trim().toLowerCase().replace(/\s+/g, "")}@okaxis`;
      saveLocalDb(db);
    }
    window.dispatchEvent(new Event("pool_n_pay_auth_change"));
    return { error: null };
  },"""

content = content.replace(old_signin, new_signin)

with open("src/lib/supabaseClient.ts", "w") as f:
    f.write(content)
