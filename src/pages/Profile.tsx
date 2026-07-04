import { useState, useEffect, useCallback } from "react";
import { Edit3, Save, X, LogOut, Bell, Volume2, Copy, CheckCircle, Shield, Smartphone, Info } from "lucide-react";
import { dbService, getInviteCode } from "../lib/firebaseClient";
import { PwaInstallBanner } from "../components/PwaInstallBanner";

interface Profile {
  name: string;
  upi_id: string;
  avatar: string;
}

interface Balances {
  youOwe: number;
  owedToYou: number;
  net: number;
}

interface Props {
  profile: Profile;
  onProfileUpdated: () => void;
  onLogout: () => void;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none cursor-pointer ${ enabled ? "bg-teal-500" : "bg-white/10 border border-white/5" }`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${ enabled ? "translate-x-6" : "translate-x-0" }`} />
    </button>
  );
}

function SettingRow({ icon, iconBg, title, subtitle, right }: { icon: React.ReactNode; iconBg: string; title: string; subtitle: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${iconBg} rounded-2xl flex items-center justify-center flex-shrink-0`}>{icon}</div>
        <div>
          <p className="font-semibold text-white text-sm">{title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="flex-shrink-0">{right}</div>
    </div>
  );
}

export default function ProfilePage({ profile, onProfileUpdated, onLogout }: Props) {
  const [balances, setBalances] = useState<Balances>({ youOwe: 0, owedToYou: 0, net: 0 });
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editUpi, setEditUpi] = useState(profile.upi_id || "");
  const [saving, setSaving] = useState(false);
  const [pushNotif, setPushNotif] = useState(() => localStorage.getItem("pnp_push_notifications") !== "false");
  const [soundFx, setSoundFx] = useState(() => localStorage.getItem("pnp_sound_effects") !== "false");
  const [toast, setToast] = useState({ message: "", show: false });
  const [copiedCode, setCopiedCode] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncTime, setSyncTime] = useState("Just now");

  const inviteCode = getInviteCode();

  const showToast = (msg: string) => {
    setToast({ message: msg, show: true });
    setTimeout(() => setToast({ message: "", show: false }), 2500);
  };

  const loadBalances = useCallback(async () => {
    try {
      const b = await dbService.getBalances();
      setBalances(b);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadBalances(); }, [loadBalances]);

  const handlePushNotifChange = (enabled: boolean) => {
    setPushNotif(enabled);
    localStorage.setItem("pnp_push_notifications", String(enabled));
    if (enabled && "Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("Pool-n-Pay 🌴", {
            body: "Push Notifications Enabled! You will receive transaction alerts.",
            icon: "/pwa-192x192.png"
          });
        }
      });
    }
  };

  const handleSoundFxChange = (enabled: boolean) => {
    setSoundFx(enabled);
    localStorage.setItem("pnp_sound_effects", String(enabled));
    if (enabled) {
      // Synthesize a quick cute chiptune sound to preview
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.08); // A5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } catch (e) {
        console.error("Audio error:", e);
      }
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await loadBalances();
      setSyncTime("Just now");
      showToast("Cloud sync complete! ☁️");
    } catch {
      showToast("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await dbService.updateProfile(editName.trim(), editUpi.trim());
      onProfileUpdated();
      setEditing(false);
      showToast("Profile saved! ✨");
    } catch { showToast("Failed to save"); } finally { setSaving(false); }
  };


  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showToast("Invite code copied!");
  };

  const fmt = (n: number) => `₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <div className="min-h-screen pb-28">
      {/* Hero */}
      <div className="gradient-tropical px-5 pt-14 pb-20 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/8 rounded-full blur-2xl" />
        <div className="flex flex-col items-center text-center relative">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full gradient-sunset border-4 border-white/30 flex items-center justify-center shadow-xl">
              <span className="text-3xl font-black text-white">{getInitials(profile.name)}</span>
            </div>
            {!editing && (
              <button onClick={() => { setEditing(true); setEditName(profile.name); setEditUpi(profile.upi_id || ""); }}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform">
                <Edit3 className="w-4 h-4 text-teal-600" />
              </button>
            )}
          </div>
          <h1 className="text-2xl font-black text-white">{profile.name}</h1>
          {profile.upi_id && <p className="text-white/65 text-sm font-mono mt-1">{profile.upi_id}</p>}
          {/* Cloud Sync badge */}
          <div className="mt-3 glass rounded-full px-4 py-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/80 text-xs font-semibold">Cloud Synced</span>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Balance Summary */}
        <div className="card rounded-3xl p-5 animate-slide-up">
          <p className="section-heading mb-4 text-white">Balance Overview</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-rose-500/10 rounded-2xl p-3.5 text-center border border-rose-500/20">
              <p className="text-[10px] text-rose-300 font-bold mb-1 uppercase">You Owe</p>
              <p className="money font-black text-rose-400 text-base">{fmt(balances.youOwe)}</p>
            </div>
            <div className="bg-emerald-500/10 rounded-2xl p-3.5 text-center border border-emerald-500/20">
              <p className="text-[10px] text-emerald-300 font-bold mb-1 uppercase">Owed</p>
              <p className="money font-black text-emerald-400 text-base">{fmt(balances.owedToYou)}</p>
            </div>
            <div className={`rounded-2xl p-3.5 text-center border ${ balances.net >= 0 ? 'bg-teal-500/10 border-teal-500/20' : 'bg-rose-500/10 border-rose-500/20' }`}>
              <p className={`text-[10px] font-bold mb-1 uppercase ${ balances.net >= 0 ? 'text-teal-300' : 'text-rose-300' }`}>Net</p>
              <p className={`money font-black text-base ${ balances.net >= 0 ? 'text-teal-400' : 'text-rose-400' }`}>
                {balances.net >= 0 ? "+" : ""}{fmt(balances.net)}
              </p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <div className="card rounded-3xl p-5 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white text-base">Edit Profile</h2>
              <button onClick={() => setEditing(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Display Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your name"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm text-white transition-shadow" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">UPI ID</label>
                <input type="text" value={editUpi} onChange={(e) => setEditUpi(e.target.value)} placeholder="yourname@upi"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono text-white transition-shadow" />
                <p className="text-xs text-slate-400 mt-1.5">Used to generate UPI payment QR codes</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setEditing(false)}
                  className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-slate-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving || !editName.trim()}
                  className="flex-1 py-3 rounded-2xl gradient-tropical text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90">
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Code */}
        <div className="card rounded-3xl p-5 animate-fade-in delay-100">
          <p className="section-heading mb-4 text-white">Your Invite Code</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-teal-500/10 border border-teal-500/20 rounded-2xl px-4 py-3">
              <p className="text-xs text-teal-300 font-medium mb-0.5">Share this to invite friends</p>
              <p className="font-mono font-black text-teal-400 text-xl tracking-widest">{inviteCode}</p>
            </div>
            <button onClick={copyInviteCode}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 ${ copiedCode ? 'bg-emerald-500' : 'gradient-tropical' }`}>
              {copiedCode ? <CheckCircle className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>

        {/* App Settings */}
        <div className="card rounded-3xl p-5 animate-fade-in delay-150">
          <p className="section-heading mb-1 text-white">App Settings</p>
          <div className="divide-y divide-white/5">
            <SettingRow
              icon={<Bell className="w-5 h-5 text-teal-400" />} iconBg="bg-teal-500/10"
              title="Push Notifications" subtitle="Expense alerts & reminders"
              right={<Toggle enabled={pushNotif} onChange={handlePushNotifChange} />}
            />
            <SettingRow
              icon={<Volume2 className="w-5 h-5 text-orange-400" />} iconBg="bg-orange-500/10"
              title="Sound Effects" subtitle="Confetti & celebration sounds"
              right={<Toggle enabled={soundFx} onChange={handleSoundFxChange} />}
            />
            <SettingRow
              icon={<Smartphone className="w-5 h-5 text-violet-400" />} iconBg="bg-violet-500/10"
              title="Cloud Sync" subtitle={`Last synced: ${syncTime}`}
              right={
                <button
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="text-[11px] font-bold badge-mint px-2.5 py-1 rounded-full cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                >
                  {syncing ? "Syncing..." : "Sync Now"}
                </button>
              }
            />
          </div>
        </div>

        {/* Install App Banner */}
        <PwaInstallBanner page="profile" />

        {/* About */}
        <div className="card rounded-3xl p-5 animate-fade-in delay-200">
          <p className="section-heading mb-4 text-white">About</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Version</span>
              <span className="text-sm font-mono font-bold text-slate-500">v1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Built with</span>
              <span className="text-sm font-semibold text-teal-400">❤️ React + Tailwind</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Portfolio project</span>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-400">Varun Sharma</span>
              </div>
            </div>
          </div>
          <div className="mt-4 bg-teal-500/10 border border-teal-500/20 rounded-2xl p-3.5 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-teal-300 leading-relaxed">
              Pool-n-Pay automatically syncs all trips, groups, and expenses to your cloud profile. Payment simulation is mock (no real transfers).
            </p>
          </div>
        </div>


        {/* Sign Out */}
        <div className="animate-fade-in delay-300 pb-4">
          <button onClick={onLogout}
            className="w-full py-4 rounded-3xl gradient-sunset text-white font-black text-base flex items-center justify-center gap-3 shadow-lg hover:opacity-90 transition-opacity active:scale-95 btn-ripple">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl text-sm font-semibold z-50 animate-slide-up whitespace-nowrap">
          {toast.message}
        </div>
      )}
    </div>
  );
}
