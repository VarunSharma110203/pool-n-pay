import { useState, useEffect, useCallback } from "react";
import {
  Scissors,
  Wallet,
  Users,
  Compass,
  RefreshCw,
  QrCode,
  X,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Zap,
  Plus,
} from "lucide-react";
import { dbService } from "../lib/firebaseClient";
import GroupCard from "../components/GroupCard";
import ActivityItem from "../components/ActivityItem";
import QuickAction from "../components/QuickAction";
import { GroupDetail } from "../components/GroupDetail";
import { PwaInstallBanner } from "../components/PwaInstallBanner";
import confetti from "canvas-confetti";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Profile {
  name: string;
  upi_id: string;
  avatar: string;
}

interface Group {
  id: string;
  name: string;
  mode: "split" | "pool";
  members: string[];
  emoji?: string;
  target_amount?: number;
}

interface Activity {
  id: string;
  avatar: string;
  name: string;
  action: string;
  amount: string;
  type: "pool" | "expense" | "payment";
  created_at: string;
}

interface Balances {
  youOwe: number;
  owedToYou: number;
  net: number;
}

type FriendBalances = {
  [name: string]: { label: string; positive: boolean | null; amount: number };
};

interface Props {
  profile: Profile;
  onNavigate: (tab: string) => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function fmt(n: number) {
  return `₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function Index({ profile, onNavigate }: Props) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [balances, setBalances] = useState<Balances>({
    youOwe: 0,
    owedToYou: 0,
    net: 0,
  });
  const [friendBalances, setFriendBalances] = useState<FriendBalances>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [showSettleDialog, setShowSettleDialog] = useState<{
    name: string;
    positive: boolean | null;
    amount: number;
  } | null>(null);
  const [activeQrData, setActiveQrData] = useState<{
    name: string;
    upiId: string;
    amount: number;
  } | null>(null);

  // ─── Data loading ─────────────────────────────────────────────────────────

  const loadAll = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else if (!refreshing) setLoading(true);
    try {
      const [g, a, b, fb] = await Promise.all([
        dbService.getGroups(),
        dbService.getActivities(),
        dbService.getBalances(),
        (dbService as any).getFriendBalances
          ? (dbService as any).getFriendBalances()
          : Promise.resolve({}),
      ]);
      setGroups(g as Group[]);
      setActivities((a as Activity[]).slice(0, 8));
      setBalances(b);
      setFriendBalances(fb);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadAll();
    const handler = () => loadAll();
    window.addEventListener("pool_n_pay_db_change", handler);
    return () => window.removeEventListener("pool_n_pay_db_change", handler);
  }, [loadAll]);

  // ─── Settlement ───────────────────────────────────────────────────────────

  const recordDashboardSettlement = async (
    debtorName: string,
    creditorName: string,
    amount: number
  ) => {
    try {
      const friendName =
        debtorName === profile.name ? creditorName : debtorName;
      const directGroup = await dbService.getOrCreateDirectGroup(friendName);
      if (directGroup) {
        const debtorAvatar = debtorName === profile.name ? profile.avatar : "🧑‍🦱";
        await dbService.addExpense(
          directGroup.id,
          `Settle: ${debtorName} paid ${creditorName}`,
          amount,
          debtorName,
          debtorAvatar,
          [creditorName]
        );
      }
      confetti({
        particleCount: 140,
        spread: 70,
        origin: { y: 0.55 },
        colors: ["#10b981", "#34d399", "#a7f3d0", "#fbbf24"],
      });
      setActiveQrData(null);
      setShowSettleDialog(null);
      loadAll();
    } catch (e) {
      console.error(e);
    }
  };

  // ─── Derived ──────────────────────────────────────────────────────────────

  const firstName = profile.name.split(" ")[0] || profile.name;

  const netSubtitle =
    balances.net > 0
      ? `You're ahead by ${fmt(balances.net)} 🌴`
      : balances.net < 0
      ? "Time to settle up 💸"
      : "All balanced! ✨";

  const nonNullBalances = Object.keys(friendBalances).filter(
    (n) => friendBalances[n].positive !== null
  );

  // ─── GroupDetail view ─────────────────────────────────────────────────────

  if (activeGroupId) {
    return (
      <GroupDetail
        groupId={activeGroupId}
        onBack={() => setActiveGroupId(null)}
        profile={profile}
      />
    );
  }

  // ─── Dashboard ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pb-28">
      <div className="max-w-5xl mx-auto">
      {/* ── 1. HERO BALANCE CARD ─────────────────────────────────────── */}
      <div className="mx-4 mt-4">
        <div className="rounded-3xl p-6 shadow-xl relative overflow-hidden" style={{ background: "linear-gradient(135deg,#7c3aed 0%,#a78bfa 50%,#f97316 100%)", boxShadow: "0 12px 40px rgba(249,115,22,0.18)" }}>
          {/* Decorative glows */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-8 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top row */}
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h1 className="text-white font-bold text-xl">
                Hey {firstName}!{" "}
                <span className="animate-wave inline-block">👋</span>
              </h1>
              <p className="text-white/70 text-sm mt-0.5">{netSubtitle}</p>
            </div>
            <div
              className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-lg flex-shrink-0"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <span className="font-black text-sm leading-none" style={{ color: "#7c3aed" }}>
                {getInitials(profile.name)}
              </span>
            </div>
          </div>

          {/* Big balance */}
          <div className="my-5 relative z-10 text-center">
            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">
              Net Balance
            </p>
            <p className="font-mono font-black text-white text-5xl tracking-tight animate-number drop-shadow-md">
              {balances.net >= 0 ? "+" : "-"}
              {fmt(balances.net)}
            </p>
          </div>

          {/* Bottom stats row */}
          <div className="flex items-center gap-0 relative z-10 bg-white/10 rounded-2xl px-4 py-3">
            {/* You Owe */}
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-0.5">
                <TrendingDown className="w-3 h-3 text-rose-300" />
                <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">
                  You Owe
                </p>
              </div>
              <p className="text-white font-mono font-bold text-sm">
                {fmt(balances.youOwe)}
              </p>
            </div>

            <div className="w-px h-8 bg-white/20 mx-2 flex-shrink-0" />

            {/* Owed to You */}
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-0.5">
                <TrendingUp className="w-3 h-3 text-emerald-300" />
                <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">
                  Owed to You
                </p>
              </div>
              <p className="text-white font-mono font-bold text-sm">
                {fmt(balances.owedToYou)}
              </p>
            </div>

            <div className="w-px h-8 bg-white/20 mx-2 flex-shrink-0" />

            {/* Refresh */}
            <button
              onClick={() => loadAll(true)}
              className={`w-9 h-9 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors flex-shrink-0 cursor-pointer ${
                refreshing ? "animate-spin" : ""
              }`}
              aria-label="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-white/80" />
            </button>
          </div>
        </div>
      </div>

      {/* ── PWA Install Banner ─────────────────────────────────────── */}
      <PwaInstallBanner page="dashboard" />

      {/* ── 2. QUICK ACTIONS ─────────────────────────────────────────── */}
      <div className="mx-4 mt-4">
        <div className="grid grid-cols-4 gap-3">
          <QuickAction
            icon={Scissors}
            label="Split"
            color="teal"
            onClick={() => onNavigate("trips")}
          />
          <QuickAction
            icon={Wallet}
            label="Pool"
            color="emerald"
            onClick={() => onNavigate("trips")}
          />
          <QuickAction
            icon={Users}
            label="Friends"
            color="orange"
            onClick={() => onNavigate("friends")}
          />
          <QuickAction
            icon={Compass}
            label="Explore"
            color="rose"
            onClick={() => onNavigate("explore")}
          />
        </div>
      </div>

      {/* ── 3. OUTSTANDING BALANCES ───────────────────────────────────── */}
      {nonNullBalances.length > 0 && (
        <div className="mx-4 mt-4">
          <div className="card rounded-3xl p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-white">
                  Outstanding
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black badge-violet">
                  {nonNullBalances.length}
                </span>
              </div>
              {nonNullBalances.length > 3 && (
                <button
                  onClick={() => onNavigate("friends")}
                  className="flex items-center gap-1 text-teal-600 text-xs font-semibold hover:text-teal-700 transition-colors cursor-pointer"
                >
                  View all
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Balance list */}
            <div className="space-y-2">
              {nonNullBalances.slice(0, 3).map((name) => {
                const fb = friendBalances[name];
                const isOwed = fb.positive === true;
                return (
                  <div
                    key={name}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                      isOwed
                        ? "bg-emerald-50/60 border-emerald-100"
                        : "bg-rose-50/60 border-rose-100"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm ${
                        isOwed
                          ? "bg-emerald-500 text-white"
                          : "bg-rose-500 text-white"
                      }`}
                    >
                      {name.slice(0, 2).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">
                        {name}
                      </p>
                      <p
                        className={`text-xs font-medium ${
                          isOwed ? "text-emerald-600" : "text-rose-500"
                        }`}
                      >
                        {isOwed ? "owes you" : "you owe"}
                      </p>
                    </div>

                    {/* Amount */}
                    <p
                      className={`font-mono font-black text-sm flex-shrink-0 mr-2 ${
                        isOwed ? "text-emerald-600" : "text-rose-500"
                      }`}
                    >
                      {fmt(fb.amount)}
                    </p>

                    {/* Settle button */}
                    <button
                      onClick={() =>
                        setShowSettleDialog({
                          name,
                          positive: fb.positive,
                          amount: fb.amount,
                        })
                      }
                      className="flex-shrink-0 px-3 py-1.5 text-white font-bold text-[10px] rounded-xl shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer" style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)" }}
                    >
                      Settle
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. YOUR TRIPS ─────────────────────────────────────────────── */}
      <div className="mt-6">
        {/* Section header */}
        <div className="flex items-center justify-between mx-4 mb-3">
          <h2 className="text-lg font-bold font-bold" style={{ color: "#1e1b4b" }}>Your Groups</h2>
          <button
            onClick={() => onNavigate("trips")}
            className="flex items-center gap-1 text-sm font-semibold hover:opacity-70 transition-opacity cursor-pointer" style={{ color: "#7c3aed" }}
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          /* Skeleton */
          <div className="scroll-row px-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex-shrink-0 w-72 h-28 rounded-2xl animate-pulse card"
              />
            ))}
          </div>
        ) : groups.length === 0 ? (
          /* Empty state */
          <div className="mx-4">
            <div className="card rounded-2xl p-8 text-center">
              <div className="text-4xl mb-2">🏝️</div>
              <p className="font-bold text-slate-700 text-sm mb-1">
                No adventures yet
              </p>
              <p className="text-slate-400 text-xs mb-4">
                Create a group to start splitting costs
              </p>
              <button
                onClick={() => onNavigate("trips")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-semibold text-xs shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer" style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)" }}
              >
                <Plus className="w-3.5 h-3.5" />
                New Group
              </button>
            </div>
          </div>
        ) : (
          /* Horizontal scroll list */
          <div className="scroll-row px-4">
            {groups.slice(0, 8).map((group) => (
              <div
                key={group.id}
                className="flex-shrink-0 w-72 cursor-pointer"
                onClick={() => setActiveGroupId(group.id)}
              >
                <GroupCard
                  id={group.id}
                  name={group.name}
                  mode={group.mode}
                  members={group.members}
                  balance=""
                  emoji={group.emoji || "🌴"}
                  target_amount={group.target_amount}
                  onClick={() => setActiveGroupId(group.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 5. RECENT ACTIVITY ────────────────────────────────────────── */}
      <div className="mx-4 mt-6">
        {/* Section header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">Recent Activity</h2>
          <button
            onClick={() => loadAll(true)}
            className={`w-8 h-8 rounded-full card flex items-center justify-center text-slate-400 hover:bg-white/5 transition-colors cursor-pointer ${
              refreshing ? "animate-spin" : ""
            }`}
            aria-label="Refresh activity"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          /* Skeleton rows */
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="card h-16 animate-pulse"
              />
            ))}
          </div>
        ) : activities.length === 0 ? (
          /* Empty */
          <div className="rounded-2xl p-10 text-center" style={{ background: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.9)", backdropFilter: "blur(12px)" }}>
            <div className="text-4xl mb-2">🌊</div>
            <p className="text-slate-500 text-sm">
              Nothing yet — add your first expense!
            </p>
          </div>
        ) : (
          /* Activity feed */
          <div className="card rounded-2xl overflow-hidden">
            {activities.map((activity, idx) => (
              <div
                key={activity.id}
                className={idx < activities.length - 1 ? "border-b border-white/5" : ""}
              >
                <ActivityItem
                  avatar={activity.avatar}
                  name={activity.name}
                  action={activity.action}
                  amount={activity.amount}
                  type={activity.type}
                  created_at={activity.created_at}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* SETTLE DIALOG                                                   */}
      {/* ─────────────────────────────────────────────────────────────── */}
      {showSettleDialog && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-base font-extrabold text-white">
                Settle up with {showSettleDialog.name}
              </h3>
              <button
                onClick={() => setShowSettleDialog(null)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-500">
              {showSettleDialog.positive === true ? (
                <span>
                  Record a payment received from{" "}
                  <span className="font-bold text-slate-900">
                    {showSettleDialog.name}
                  </span>
                  :
                </span>
              ) : (
                <span>
                  Choose how you want to pay{" "}
                  <span className="font-bold text-slate-900">
                    {showSettleDialog.name}
                  </span>
                  :
                </span>
              )}
            </p>

            {/* Amount pill */}
            <div className="flex items-center justify-center">
              <div
                className={`px-6 py-3 rounded-2xl font-mono font-black text-2xl shadow-inner ${
                  showSettleDialog.positive === true
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-rose-500/10 text-rose-400"
                }`}
              >
                {fmt(showSettleDialog.amount)}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2.5 pt-1">
              {showSettleDialog.positive === false && (
                <button
                  onClick={async () => {
                    const friendsList = await dbService.getFriends();
                    const f = friendsList.find(
                      (fr: any) => fr.name === showSettleDialog.name
                    );
                    const upiId =
                      f?.upi_id ||
                      `${showSettleDialog.name
                        .toLowerCase()
                        .replace(/\s+/g, "")}@okaxis`;
                    setActiveQrData({
                      name: showSettleDialog.name,
                      upiId,
                      amount: showSettleDialog.amount,
                    });
                    setShowSettleDialog(null);
                  }}
                  className="w-full text-white font-bold text-sm py-3 rounded-2xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-sm" style={{ background: "linear-gradient(135deg,#7c3aed,#f97316)" }}
                >
                  <QrCode className="w-4 h-4" />
                  Pay via UPI QR
                </button>
              )}

              {showSettleDialog.positive === false ? (
                <button
                  onClick={() => {
                    const debtor = profile.name;
                    const creditor = showSettleDialog.name;
                    recordDashboardSettlement(
                      debtor,
                      creditor,
                      showSettleDialog.amount
                    );
                  }}
                  className="w-full bg-white/5 border border-white/10 text-white font-bold text-sm py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Record Cash Payment
                </button>
              ) : (
                <button
                  onClick={() => {
                    const debtor = showSettleDialog.name;
                    const creditor = profile.name;
                    recordDashboardSettlement(
                      debtor,
                      creditor,
                      showSettleDialog.amount
                    );
                  }}
                  className="w-full text-white font-bold text-sm py-3 rounded-2xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-sm" style={{ background: "linear-gradient(135deg,#7c3aed,#f97316)" }}
                >
                  Record Cash Received
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* UPI QR MODAL                                                    */}
      {/* ─────────────────────────────────────────────────────────────── */}
      {activeQrData && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white">
                Scan to Pay 🔍
              </h3>
              <button
                onClick={() => setActiveQrData(null)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Paying{" "}
              <span className="font-bold text-slate-900">
                {activeQrData.name}
              </span>
            </p>

            {/* Editable UPI ID */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                UPI ID
              </label>
              <input
                type="text"
                value={activeQrData.upiId}
                onChange={(e) =>
                  setActiveQrData({ ...activeQrData, upiId: e.target.value })
                }
                className="rounded-xl px-3 py-2.5 w-full text-xs font-mono focus:outline-none transition-all text-white bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              />
              <p className="text-[10px] text-slate-400">
                ✏️ Edit to test with a real UPI handle
              </p>
            </div>

            {/* QR Code */}
            <div className="w-48 h-48 bg-slate-50 border border-slate-200 rounded-2xl mx-auto flex items-center justify-center overflow-hidden shadow-inner p-2">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=${encodeURIComponent(
                  `upi://pay?pa=${activeQrData.upiId}&pn=${activeQrData.name}&am=${activeQrData.amount}&cu=INR`
                )}`}
                alt="UPI Payment QR"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>

            {/* Amount display */}
            <div className="text-center">
              <p className="font-mono font-black text-slate-900 text-2xl">
                {fmt(activeQrData.amount)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                {activeQrData.upiId}
              </p>
            </div>

            {/* Tip box */}
            <p className="text-[10px] p-3 rounded-xl text-center leading-relaxed font-medium badge-violet">
              💡 Open any UPI app (GPay, PhonePe, Paytm) and scan this QR to
              pay instantly.
            </p>

            {/* Action buttons */}
            <div className="flex gap-2.5">
              <button
                onClick={() =>
                  recordDashboardSettlement(
                    profile.name,
                    activeQrData.name,
                    activeQrData.amount
                  )
                }
                className="flex-1 text-white font-semibold text-xs py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-sm" style={{ background: "linear-gradient(135deg,#10b981,#34d399)" }}
              >
                I've Paid! ✓
              </button>
              <button
                onClick={() => setActiveQrData(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs py-3 rounded-xl transition-colors cursor-pointer border border-white/5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
