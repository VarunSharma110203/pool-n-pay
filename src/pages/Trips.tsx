import { useState, useEffect, useCallback } from "react";
import { PlusCircle, X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { dbService } from "../lib/supabaseClient";
import GroupCard from "../components/GroupCard";
import { GroupDetail } from "../components/GroupDetail";
import confetti from "canvas-confetti";

interface Group {
  id: string;
  name: string;
  mode: "split" | "pool";
  members: string[];
  emoji?: string;
  target_amount?: number;
}

interface Friend {
  id: string;
  name: string;
  status: string;
}

type Filter = "all" | "split" | "pool";

interface Props {
  profile: { name: string; upi_id: string; avatar: string };
}

const EMOJIS = ["🌴", "🏖️", "🏠", "🎂", "🏄", "🍹", "✈️", "⛰️", "🌊", "🎯", "🏔️", "🎪", "🚢", "🏕️", "🎰", "🌮"];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`rounded-full transition-all duration-300 ${
          i === current ? "w-8 h-2.5 gradient-tropical" : i < current ? "w-2.5 h-2.5 bg-teal-300" : "w-2.5 h-2.5 bg-gray-200"
        }`} />
      ))}
    </div>
  );
}

export default function Trips({ profile }: Props) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupBalances, setGroupBalances] = useState<{ [id: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  // Create modal state
  const [step, setStep] = useState(0);
  const [tripName, setTripName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("🌴");
  const [mode, setMode] = useState<"split" | "pool">("split");
  const [targetAmount, setTargetAmount] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const computeGroupBalances = async (groupList: Group[]) => {
    const myName = profile.name;
    const balMap: { [id: string]: number } = {};
    for (const g of groupList) {
      if (g.mode === "split") {
        const expenses = await dbService.getExpenses(g.id);
        let net = 0;
        expenses.forEach(exp => {
          const share = exp.amount / exp.participants.length;
          if (exp.payer === myName) {
            exp.participants.forEach((p: string) => { if (p !== myName) net += share; });
          } else {
            if (exp.participants.includes(myName)) net -= share;
          }
        });
        balMap[g.id] = Math.round(net);
      } else {
        const contribs = await dbService.getContributions(g.id);
        const myContrib = contribs.filter((c: any) => c.member === myName).reduce((s: number, c: any) => s + c.amount, 0);
        balMap[g.id] = myContrib;
      }
    }
    setGroupBalances(balMap);
  };

  const loadGroups = useCallback(async () => {
    try {
      const data = await dbService.getGroups();
      setGroups(data as Group[]);
      computeGroupBalances(data as Group[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFriends = useCallback(async () => {
    try {
      const data = await dbService.getFriends();
      setFriends((data as Friend[]).filter((f: Friend) => f.status === "friend"));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadGroups();
    loadFriends();
    const handler = () => { loadGroups(); loadFriends(); };
    window.addEventListener("pool_n_pay_db_change", handler);
    return () => window.removeEventListener("pool_n_pay_db_change", handler);
  }, [loadGroups, loadFriends]);

  const filteredGroups = groups.filter((g) => filter === "all" || g.mode === filter);

  const openCreateModal = () => {
    setStep(0); setTripName(""); setSelectedEmoji("🌴"); setMode("split"); setTargetAmount(""); setSelectedFriends([]);
    setShowCreateModal(true);
  };

  const handleCreate = async () => {
    if (!tripName.trim()) return;
    setCreating(true);
    try {
      const memberNames = friends.filter((f) => selectedFriends.includes(f.id)).map((f) => f.name);
      await dbService.createGroup(tripName.trim(), mode, memberNames, targetAmount ? parseFloat(targetAmount) : undefined, selectedEmoji);
      setShowCreateModal(false);
      await loadGroups();
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ["#0d9488", "#06b6d4", "#10b981", "#f59e0b"] });
    } catch { } finally { setCreating(false); }
  };

  const canNext = step === 0 ? tripName.trim().length > 0 : true;

  if (activeGroupId) {
    return <GroupDetail groupId={activeGroupId} onBack={() => setActiveGroupId(null)} profile={profile} />;
  }

  // Stats
  const splitGroups = groups.filter(g => g.mode === "split");
  const poolGroups = groups.filter(g => g.mode === "pool");
  const totalNet = Object.values(groupBalances).filter((_, i) => groups[i]?.mode === "split").reduce((s, v) => s + v, 0);

  return (
    <div className="min-h-screen pb-28" style={{ background: "#f4f7f6" }}>
      <div className="max-w-5xl mx-auto">
      {/* Header Hero */}
      <div className="gradient-tropical px-5 pt-14 pb-10 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 -left-6 w-28 h-28 bg-white/8 rounded-full blur-xl" />
        <div className="flex items-start justify-between relative">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Your Groups</h1>
            <p className="text-white/70 text-sm mt-1 font-medium">
              {groups.length === 0 ? "Start your first adventure!" : `${groups.length} adventure${groups.length !== 1 ? "s" : ""} tracked`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-sm">
              {getInitials(profile.name)}
            </div>
            <button
              onClick={openCreateModal}
              className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform active:scale-95 btn-ripple"
            >
              <PlusCircle className="w-6 h-6 text-teal-600" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        {groups.length > 0 && (
          <div className="flex items-center gap-3 mt-5 relative">
            <div className="flex-1 glass rounded-2xl px-4 py-3">
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-0.5">Split Groups</p>
              <p className="text-white font-black text-xl">{splitGroups.length}</p>
            </div>
            <div className="flex-1 glass rounded-2xl px-4 py-3">
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-0.5">Pool Groups</p>
              <p className="text-white font-black text-xl">{poolGroups.length}</p>
            </div>
            <div className="flex-1 glass rounded-2xl px-4 py-3">
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-0.5">Net Balance</p>
              <p className={`font-black text-lg money ${ totalNet >= 0 ? 'text-emerald-300' : 'text-rose-300' }`}>
                {totalNet >= 0 ? '+' : ''}₹{Math.abs(totalNet).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 -mt-3 space-y-4">
        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 animate-fade-in">
          {(["all", "split", "pool"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold capitalize flex-shrink-0 transition-all duration-200 shadow-sm ${
                filter === f ? "gradient-tropical text-white shadow-md scale-105" : "bg-white text-slate-600 border border-gray-100 hover:bg-gray-50"
              }`}
            >
              {f === "all" ? "🗺️ All" : f === "split" ? "✂️ Split" : "🎯 Pool"}
            </button>
          ))}
        </div>

        {/* Groups List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 h-24">
                <div className="flex items-center gap-3 animate-pulse">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded-full w-2/3" />
                    <div className="h-3 bg-gray-50 rounded-full w-1/2" />
                  </div>
                  <div className="h-5 bg-gray-100 rounded-full w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center animate-fade-in">
            <div className="text-6xl mb-4 animate-float">🏝️</div>
            <p className="font-black text-slate-800 text-xl mb-1">No groups yet!</p>
            <p className="text-slate-400 text-sm mb-6">Create your first group adventure</p>
            <button
              onClick={openCreateModal}
              className="px-6 py-3 rounded-2xl gradient-tropical text-white font-bold text-sm shadow-md hover:opacity-90 transition-opacity btn-ripple"
            >
              + Create Group
            </button>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {filteredGroups.map((group, idx) => {
              const bal = groupBalances[group.id] ?? 0;
              const balStr = group.mode === 'split' && bal !== 0 ? (bal > 0 ? `+₹${bal.toLocaleString()}` : `-₹${Math.abs(bal).toLocaleString()}`) : group.mode === 'pool' ? `₹${bal.toLocaleString()}` : '';
              return (
                <div key={group.id} onClick={() => setActiveGroupId(group.id)} className="cursor-pointer animate-slide-up" style={{ animationDelay: `${idx * 40}ms` }}>
                  <GroupCard
                    id={group.id}
                    name={group.name}
                    mode={group.mode}
                    members={group.members}
                    balance={balStr}
                    emoji={group.emoji || "🌴"}
                    target_amount={group.target_amount}
                    onClick={() => setActiveGroupId(group.id)}
                  />
                </div>
              );
            })}
            {/* Floating create button at the end */}
            <button
              onClick={openCreateModal}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-teal-200 bg-teal-50/50 text-teal-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-teal-50 hover:border-teal-300 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              New Group
            </button>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl shadow-2xl animate-slide-up">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 pb-4 pt-2">
              <div>
                <h2 className="font-black text-slate-900 text-lg">New Group ✨</h2>
                <p className="text-slate-400 text-xs">Step {step + 1} of 3</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-slate-500 hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Dots */}
            <div className="px-5 pb-5">
              <StepDots current={step} total={3} />
            </div>

            {/* Step Content */}
            <div className="px-5 min-h-[280px]">
              {step === 0 && (
                <div className="space-y-5 animate-fade-in">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base mb-1">Name your adventure</h3>
                    <p className="text-slate-400 text-sm mb-4">What's this group called?</p>
                    <input
                      type="text"
                      value={tripName}
                      onChange={(e) => setTripName(e.target.value)}
                      placeholder="e.g. Goa Trip 🏖️ or Roommates 🏠"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 w-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-semibold transition-shadow"
                      autoFocus
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 text-sm mb-3">Pick an emoji icon</p>
                    <div className="grid grid-cols-8 gap-2">
                      {EMOJIS.map((emoji) => (
                        <button key={emoji} onClick={() => setSelectedEmoji(emoji)}
                          className={`h-10 rounded-xl text-lg flex items-center justify-center transition-all ${
                            selectedEmoji === emoji ? "bg-teal-100 border-2 border-teal-500 scale-110 shadow-sm" : "bg-gray-50 border border-gray-100 hover:bg-gray-100"
                          }`}>
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base mb-1">Expense style</h3>
                    <p className="text-slate-400 text-sm mb-4">How will your group handle money?</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(["split", "pool"] as const).map((m) => (
                      <button key={m} onClick={() => setMode(m)}
                        className={`p-5 rounded-2xl border-2 text-left transition-all ${
                          mode === m ? "border-teal-500 bg-teal-50 shadow-sm" : "border-gray-100 bg-gray-50 hover:border-gray-200"
                        }`}>
                        <div className="text-2xl mb-3">{m === "split" ? "✂️" : "🎯"}</div>
                        <p className="font-bold text-slate-900 text-sm">{m === "split" ? "Split" : "Pool"}</p>
                        <p className="text-xs text-slate-400 mt-1">{m === "split" ? "Track & split individual expenses" : "Everyone contributes to a goal"}</p>
                      </button>
                    ))}
                  </div>
                  {mode === "pool" && (
                    <div className="animate-fade-in">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Target Amount (₹)</label>
                      <input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)}
                        placeholder="e.g. 50000"
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono" />
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="animate-fade-in">
                  <h3 className="font-bold text-slate-900 text-base mb-1">Who's coming? 🧳</h3>
                  <p className="text-slate-400 text-sm mb-4">Select group members (optional)</p>
                  {friends.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="text-4xl mb-2">🌊</div>
                      <p className="text-slate-500 text-sm font-semibold">No friends yet</p>
                      <p className="text-slate-400 text-xs mt-1">Add friends in the Friends tab first</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {friends.map((friend) => {
                        const selected = selectedFriends.includes(friend.id);
                        return (
                          <button key={friend.id}
                            onClick={() => setSelectedFriends((prev) => selected ? prev.filter((id) => id !== friend.id) : [...prev, friend.id])}
                            className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${
                              selected ? "border-teal-500 bg-teal-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"
                            }`}>
                            <div className="w-9 h-9 rounded-full gradient-tropical flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {getInitials(friend.name)}
                            </div>
                            <span className="font-semibold text-slate-800 text-sm flex-1">{friend.name}</span>
                            {selected && <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex gap-3 px-5 py-5 pb-8">
              {step > 0 && (
                <button onClick={() => setStep((s) => s - 1)}
                  className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-slate-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
              {step < 2 ? (
                <button onClick={() => setStep((s) => s + 1)} disabled={!canNext}
                  className="flex-1 py-3.5 rounded-2xl gradient-tropical text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleCreate} disabled={creating || !tripName.trim()}
                  className="flex-1 py-3.5 rounded-2xl gradient-tropical text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity">
                  {creating ? "Creating..." : "🎉 Create Group!"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
