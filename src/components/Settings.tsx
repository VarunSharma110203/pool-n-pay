import React, { useState, useEffect } from "react";
import { Key, Database, RefreshCw, CheckCircle, User, QrCode, Sparkles } from "lucide-react";
import { dbService } from "../lib/supabaseClient";

interface SettingsProps {
  onProfileUpdated: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onProfileUpdated }) => {
  // Profile state
  const [profileName, setProfileName] = useState("");
  const [profileUpi, setProfileUpi] = useState("");

  // Key states
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [amadeusClientId, setAmadeusClientId] = useState("");
  const [amadeusClientSecret, setAmadeusClientSecret] = useState("");

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    // Load initial values
    dbService.getProfile().then(profile => {
      setProfileName(profile.name);
      setProfileUpi(profile.upi_id);
    });

    setSupabaseUrl(localStorage.getItem("POOL_N_PAY_SUPABASE_URL") || "");
    setSupabaseKey(localStorage.getItem("POOL_N_PAY_SUPABASE_KEY") || "");
    setGeminiKey(localStorage.getItem("POOL_N_PAY_GEMINI_KEY") || "");
    setAmadeusClientId(localStorage.getItem("POOL_N_PAY_AMADEUS_CLIENT_ID") || "");
    setAmadeusClientSecret(localStorage.getItem("POOL_N_PAY_AMADEUS_CLIENT_SECRET") || "");
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dbService.updateProfile(profileName, profileUpi);
      setMessage({ text: "Profile updated successfully! ✨", type: "success" });
      onProfileUpdated();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ text: "Failed to update profile", type: "error" });
    }
  };

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Save keys to localStorage
      if (supabaseUrl) localStorage.setItem("POOL_N_PAY_SUPABASE_URL", supabaseUrl);
      else localStorage.removeItem("POOL_N_PAY_SUPABASE_URL");

      if (supabaseKey) localStorage.setItem("POOL_N_PAY_SUPABASE_KEY", supabaseKey);
      else localStorage.removeItem("POOL_N_PAY_SUPABASE_KEY");

      if (geminiKey) localStorage.setItem("POOL_N_PAY_GEMINI_KEY", geminiKey);
      else localStorage.removeItem("POOL_N_PAY_GEMINI_KEY");

      if (amadeusClientId) localStorage.setItem("POOL_N_PAY_AMADEUS_CLIENT_ID", amadeusClientId);
      else localStorage.removeItem("POOL_N_PAY_AMADEUS_CLIENT_ID");

      if (amadeusClientSecret) localStorage.setItem("POOL_N_PAY_AMADEUS_CLIENT_SECRET", amadeusClientSecret);
      else localStorage.removeItem("POOL_N_PAY_AMADEUS_CLIENT_SECRET");

      setMessage({ text: "API Credentials and Settings saved! 🌴 Reloading config...", type: "success" });
      setTimeout(() => {
        setMessage(null);
        window.location.reload(); // Reload to re-initialize supabase / credentials
      }, 1500);
    } catch (err) {
      setMessage({ text: "Failed to save configurations", type: "error" });
    }
  };

  const handleResetDb = () => {
    if (confirm("Are you sure you want to reset the database to the default tropical trip data? All your custom pools/expenses will be deleted.")) {
      dbService.resetDb();
      setMessage({ text: "Database successfully reset to defaults! 🍹", type: "success" });
      onProfileUpdated();
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Settings & Configurations</h2>
        <p className="text-sm text-muted-foreground font-body">Manage your profile, active APIs, and local sandbox database.</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-sm flex items-center gap-3 border transition-all ${
            message.type === "success"
              ? "bg-teal-50 border-teal-200 text-teal-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
          <p className="font-semibold">{message.text}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-card space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-border/20">
            <div className="w-10 h-10 rounded-xl bg-palm-light flex items-center justify-center">
              <User className="w-5 h-5 text-palm" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground text-sm">Personal Profile</h3>
              <p className="text-xs text-muted-foreground font-body">Used in your expense groups & settlements</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1">
                Display Name
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-white border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-body transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1">
                UPI ID for settlements
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground/50">
                  <QrCode className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="name@upi"
                  value={profileUpi}
                  onChange={(e) => setProfileUpi(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-body transition-all text-sm"
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-body mt-1 ml-1">Used to generate payment QR codes for your friends.</p>
            </div>

            <button
              type="submit"
              className="bg-palm text-white font-semibold text-sm py-2.5 px-5 rounded-xl shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              Save Profile
            </button>
          </form>
        </div>

        {/* Database & Sandbox Control */}
        <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-card space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-border/20">
            <div className="w-10 h-10 rounded-xl bg-sunset-light flex items-center justify-center">
              <Database className="w-5 h-5 text-sunset" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground text-sm">Sandbox Database Control</h3>
              <p className="text-xs text-muted-foreground font-body">Reset or clear offline sandbox data</p>
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 text-xs text-teal-850 font-body space-y-2">
            <p className="font-bold flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-teal-600" />
              Fully Functional Offline Mode Active
            </p>
            <p>
              Pool-n-Pay uses an advanced, reactive reactive state machine stored in your browser's <code>localStorage</code>. 
              You can create expenses, invite virtual friends, settle via mock QR, and calculate split balances instantly!
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleResetDb}
              className="flex items-center gap-2 border-2 border-dashed border-rose-200 hover:bg-rose-50/50 hover:border-rose-400 text-rose-700 font-semibold text-sm py-3 px-5 rounded-xl transition-all cursor-pointer w-full justify-center"
            >
              <RefreshCw className="w-4 h-4 animate-spin-hover" />
              Reset Database to Tropical Defaults
            </button>
          </div>
        </div>
      </div>

      {/* API Integrations Card */}
      <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-card space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-border/20">
          <div className="w-10 h-10 rounded-xl bg-lagoon-light flex items-center justify-center">
            <Key className="w-5 h-5 text-lagoon" />
          </div>
          <div>
            <h3 className="font-display font-bold text-foreground text-sm">API & Third-Party Integrations</h3>
            <p className="text-xs text-muted-foreground font-body">Connect real backend and travel search engines</p>
          </div>
        </div>

        <form onSubmit={handleSaveKeys} className="space-y-6">
          {/* Supabase */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
              <span>1. Supabase Backend</span>
              <span className="px-1.5 py-0.25 text-[9px] bg-slate-100 rounded-md font-semibold text-slate-500">Optional</span>
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground font-body mb-1 ml-1">Supabase Project URL</label>
                <input
                  type="password"
                  placeholder="https://your-project-id.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-body transition-all text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground font-body mb-1 ml-1">Supabase Anon Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-body transition-all text-xs"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground font-body">Provide these to persist data in a real SQL database and support real-time sync with friends. If empty, the app defaults to sandbox mode.</p>
          </div>

          {/* Gemini API */}
          <div className="space-y-3 pt-4 border-t border-border/20">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
              <span>2. Google Gemini API Key</span>
              <span className="px-1.5 py-0.25 text-[9px] bg-emerald-100 rounded-md font-semibold text-emerald-600">Free Tier Friendly</span>
            </h4>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground font-body mb-1 ml-1">Gemini API Key</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-body transition-all text-xs"
              />
            </div>
            <p className="text-[10px] text-muted-foreground font-body">
              Used to generate customized, beautiful tropical itineraries on-the-fly. 
              Get your free key from the <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-teal-600 underline font-semibold">Google AI Studio</a>.
            </p>
          </div>

          {/* Amadeus API */}
          <div className="space-y-3 pt-4 border-t border-border/20">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
              <span>3. Amadeus Travel API</span>
              <span className="px-1.5 py-0.25 text-[9px] bg-slate-100 rounded-md font-semibold text-slate-500">Optional</span>
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground font-body mb-1 ml-1">Amadeus API Client ID</label>
                <input
                  type="password"
                  placeholder="Client ID"
                  value={amadeusClientId}
                  onChange={(e) => setAmadeusClientId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-body transition-all text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground font-body mb-1 ml-1">Amadeus API Client Secret</label>
                <input
                  type="password"
                  placeholder="Client Secret"
                  value={amadeusClientSecret}
                  onChange={(e) => setAmadeusClientSecret(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-body transition-all text-xs"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground font-body">
              Used to query live flight rates and hotel availability. 
              Get free sandbox credentials at <a href="https://developers.amadeus.com/" target="_blank" rel="noreferrer" className="text-teal-600 underline font-semibold">Amadeus for Developers</a>. 
              If empty, the app will simulate live search responses dynamically.
            </p>
          </div>

          <div className="pt-2 border-t border-border/20 flex gap-4">
            <button
              type="submit"
              className="bg-lagoon text-white font-semibold text-sm py-2.5 px-6 rounded-xl shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              Save Credentials & Reload Config
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
