import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  PlusCircle,
  Split,
  Wallet,
  QrCode,
  CheckCircle,
  Users,
  DollarSign,
  RefreshCw,
  TrendingUp,
  X,
  UserPlus,
  Copy,
  Check,
  Pencil,
} from "lucide-react";
import { dbService, timeAgo, db, playCelebrationSound, playPaymentSound } from "../lib/firebaseClient";
import { doc, updateDoc, collection, addDoc } from "firebase/firestore";
import confetti from "canvas-confetti";

interface GroupDetailProps {
  groupId: string;
  onBack: () => void;
  profile: { name: string; upi_id: string; avatar: string };
}

export const GroupDetail: React.FC<GroupDetailProps> = ({
  groupId,
  onBack,
  profile,
}) => {
  const [group, setGroup] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [contributions, setContributions] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmt, setExpenseAmt] = useState("");
  const [expensePayer, setExpensePayer] = useState("");
  const [expenseParticipants, setExpenseParticipants] = useState<string[]>([]);

  const [poolAmt, setPoolAmt] = useState("");

  const [activeQrData, setActiveQrData] = useState<{
    name: string;
    upiId: string;
    amount: number;
    isPool?: boolean;
  } | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [newTarget, setNewTarget] = useState("");
  const [poolTab, setPoolTab] = useState<"expenses" | "contributions">("expenses");

  const fetchGroupDetails = async () => {
    setLoading(true);
    try {
      const groupsList = await dbService.getGroups();
      let currentGroup = groupsList.find((g) => g.id === groupId);
      
      if (currentGroup && !currentGroup.invite_code) {
        const code = `G-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        try {
          await updateDoc(doc(db, "groups", groupId), { invite_code: code });
          currentGroup.invite_code = code;
        } catch (e) {
          console.error("Failed to backfill group invite code:", e);
        }
      }
      
      setGroup(currentGroup);

      if (currentGroup) {
        setExpensePayer(profile.name);
        setExpenseParticipants(currentGroup.members);

        if (currentGroup.mode === "split") {
          const expList = await dbService.getExpenses(groupId);
          setExpenses(expList);
        } else {
          const contribs = await dbService.getContributions(groupId);
          setContributions(contribs);
          const expList = await dbService.getExpenses(groupId);
          setExpenses(expList);
        }
      }

      const friendsList = await dbService.getFriends();
      setFriends(friendsList.filter((f) => f.status === "friend"));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
    window.addEventListener("pool_n_pay_db_change", fetchGroupDetails);
    return () => {
      window.removeEventListener("pool_n_pay_db_change", fetchGroupDetails);
    };
  }, [groupId, profile]);

  const handleSaveTarget = async () => {
    if (!newTarget || isNaN(Number(newTarget))) {
      setIsEditingTarget(false);
      return;
    }
    await (dbService as any).updateGroupTarget(groupId, Number(newTarget));
    setIsEditingTarget(false);
    fetchGroupDetails();
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc.trim() || !expenseAmt)
      return;

    if (isSplit && expenseParticipants.length === 0)
      return;

    try {
      const amount = parseFloat(expenseAmt);
      if (isSplit) {
        const payerAvatar = expensePayer === profile.name ? profile.avatar : "🧑‍🦱";
        await dbService.addExpense(
          groupId,
          expenseDesc,
          amount,
          expensePayer,
          payerAvatar,
          expenseParticipants
        );
      } else {
        await dbService.addExpense(
          groupId,
          expenseDesc,
          amount,
          profile.name,
          profile.avatar,
          group.members
        );
      }

      setExpenseDesc("");
      setExpenseAmt("");
      setShowAddForm(false);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#0d9488", "#f43f5e", "#f97316"],
      });
      playPaymentSound();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poolAmt) return;

    try {
      const amount = parseFloat(poolAmt);
      if (amount <= 0) return;

      const poolOwner = poolAdmin;
      if (poolOwner === profile.name || !poolOwner) {
        await dbService.addContribution(groupId, profile.name, amount);
        setPoolAmt("");
        setShowAddForm(false);
        confetti({
          particleCount: 150,
          spread: 80,
          colors: ["#14b8a6", "#22c55e", "#fef08a"],
        });
        playPaymentSound();
      } else {
        const ownerFriend = friends.find(f => f.name === poolOwner);
        const ownerUpi = ownerFriend?.upi_id || poolOwner.toLowerCase().replace(/\s+/g, '') + '@upi';
        setActiveQrData({
          name: poolOwner,
          upiId: ownerUpi,
          amount: amount,
          isPool: true
        });
        setShowAddForm(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const recordSettlement = async (debtor: string, creditor: string, amount: number) => {
    try {
      const debtorAvatar = debtor === profile.name ? profile.avatar : "🧑‍🦱";
      await dbService.addExpense(
        groupId,
        `Settle: ${debtor} paid ${creditor}`,
        amount,
        debtor,
        debtorAvatar,
        [creditor]
      );
      
      confetti({
        particleCount: 120,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#10b981", "#34d399", "#a7f3d0"]
      });
      playPaymentSound();
      
      setActiveQrData(null);
      fetchGroupDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompletePool = async () => {
    if (
      confirm(
        `Are you sure you want to end the trip "${group.name}"? This will lock the pool, prevent any further expenses or contributions, and calculate refunds for all members based on the remaining pot of ₹${poolRemaining.toLocaleString()}.`
      )
    ) {
      try {
        await updateDoc(doc(db, "groups", groupId), { status: "completed" });
        
        // Add activity
        await addDoc(collection(db, "activities"), {
          group_id: groupId,
          avatar: profile.avatar,
          name: profile.name,
          action: `completed the trip and finalized refunds`,
          amount: `Refundable Pot: ₹${poolRemaining.toLocaleString()}`,
          type: "pool",
          created_at: new Date().toISOString()
        });

        confetti({
          particleCount: 200,
          spread: 100,
          colors: ["#10b981", "#3b82f6", "#f59e0b"],
        });
        playCelebrationSound();

        fetchGroupDetails();
      } catch (err) {
        console.error("Failed to complete group:", err);
        alert("Failed to end the trip. Please try again.");
      }
    }
  };

  const toggleParticipant = (memberName: string) => {
    if (expenseParticipants.includes(memberName)) {
      setExpenseParticipants(expenseParticipants.filter((p) => p !== memberName));
    } else {
      setExpenseParticipants([...expenseParticipants, memberName]);
    }
  };

  if (loading || !group) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  const isSplit = group.mode === "split";
  const poolAdmin = group.admin || (group.members && group.members[0]) || "";
  const isCurrentAdmin = poolAdmin === profile.name;
  const isCompleted = group.status === "completed";

  const poolCollected = !isSplit
    ? contributions.reduce((sum, c) => sum + c.amount, 0)
    : 0;
  const poolSpent = !isSplit
    ? expenses.reduce((sum, e) => sum + e.amount, 0)
    : 0;
  const poolRemaining = poolCollected - poolSpent;
  const potentialRemaining = poolRemaining - (parseFloat(expenseAmt) || 0);

  const poolProgress =
    !isSplit && group.target_amount
      ? (poolCollected / group.target_amount) * 100
      : 0;

  // ── Pool: equal-share logic ──────────────────────────────────────────────
  const requiredPerMember = !isSplit && group.members.length > 0
    ? Math.max(
        group.target_amount ? Math.ceil(group.target_amount / group.members.length) : 0,
        Math.ceil(poolSpent / group.members.length)
      )
    : 0;

  // How much each member has contributed so far
  const memberContribMap: { [name: string]: number } = {};
  if (!isSplit) {
    group.members.forEach((m: string) => { memberContribMap[m] = 0; });
    contributions.forEach((c: any) => {
      if (memberContribMap[c.member] !== undefined) {
        memberContribMap[c.member] += c.amount;
      }
    });
  }

  // Refund calculation logic
  const memberRefundMap: { [name: string]: number } = {};
  if (!isSplit && poolRemaining > 0) {
    const averageExpense = poolSpent / group.members.length;
    const overContributions: { [name: string]: number } = {};
    let totalOverContribution = 0;

    group.members.forEach((m: string) => {
      const contributed = memberContribMap[m] ?? 0;
      const over = Math.max(0, contributed - averageExpense);
      overContributions[m] = over;
      totalOverContribution += over;
    });

    if (totalOverContribution > 0) {
      group.members.forEach((m: string) => {
        const over = overContributions[m] ?? 0;
        memberRefundMap[m] = Math.floor(poolRemaining * (over / totalOverContribution));
      });
    } else {
      group.members.forEach((m: string) => {
        memberRefundMap[m] = Math.floor(poolRemaining / group.members.length);
      });
    }
  }

  // How much the current user still owes
  const myContributed = memberContribMap[profile.name] ?? 0;
  const myRemaining = Math.max(0, requiredPerMember - myContributed);
  const myPercent = requiredPerMember > 0
    ? Math.min(100, (myContributed / requiredPerMember) * 100)
    : 0;

  // Deficit share is simply the user's remaining shortfall relative to their fair share of total expenses
  const myDeficitShare = poolRemaining < 0 ? myRemaining : 0;

  const getSettlements = () => {
    if (!isSplit || expenses.length === 0) return [];

    const balances: { [name: string]: number } = {};
    group.members.forEach((m: string) => {
      balances[m] = 0;
    });

    expenses.forEach((exp) => {
      const payer = exp.payer;
      const share = exp.amount / exp.participants.length;
      balances[payer] += exp.amount;
      exp.participants.forEach((p: string) => {
        balances[p] -= share;
      });
    });

    const debtors: Array<{ name: string; amount: number }> = [];
    const creditors: Array<{ name: string; amount: number }> = [];

    Object.keys(balances).forEach((name) => {
      const bal = balances[name];
      if (bal < -0.01) debtors.push({ name, amount: -bal });
      else if (bal > 0.01) creditors.push({ name, amount: bal });
    });

    const transactions: Array<{
      debtor: string;
      creditor: string;
      amount: number;
    }> = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      const settledAmount = Math.min(debtor.amount, creditor.amount);

      transactions.push({
        debtor: debtor.name,
        creditor: creditor.name,
        amount: Math.round(settledAmount),
      });

      debtor.amount -= settledAmount;
      creditor.amount -= settledAmount;

      if (debtor.amount < 0.1) dIdx++;
      if (creditor.amount < 0.1) cIdx++;
    }

    return transactions;
  };

  const settlements = getSettlements();

  const handleSettlePay = (creditorName: string, amount: number) => {
    let upiId = "merchant@upi";
    if (creditorName === profile.name) {
      upiId = profile.upi_id;
    } else {
      const f = friends.find((fr) => fr.name === creditorName);
      if (f) upiId = f.upi_id;
    }
    setActiveQrData({ name: creditorName, upiId, amount });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10 px-4">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-gray-100 -mx-4 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <span
          className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
            isSplit
              ? "bg-rose-50 text-rose-500"
              : "bg-teal-50 text-teal-600"
          }`}
        >
          {isSplit ? "Split Mode 🏖️" : "Pool Mode 🥥"}
        </span>
      </div>

      {/* Hero Group Card */}
      <div className="gradient-tropical rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full bg-white/5 blur-3xl" />

        <div className="flex items-center gap-4 relative">
          <span className="text-5xl select-none drop-shadow-md">
            {group.emoji || "🌴"}
          </span>
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {group.name}
            </h2>
            <p className="text-xs text-white/70 mt-1">
              Created{" "}
              {new Date(group.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
              {!isSplit && poolAdmin && (
                <> · Pool Admin: {poolAdmin === profile.name ? "You" : poolAdmin} 👑</>
              )}
            </p>
          </div>
        </div>

        {isSplit ? (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-white/15 pt-6">
            <div>
              <p className="text-[10px] uppercase font-bold text-white/60 tracking-wider">
                Total Expenses
              </p>
              <p className="text-2xl md:text-3xl font-mono font-bold mt-0.5">
                ₹{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-white/60 tracking-wider">
                Your Share
              </p>
              <p className="text-2xl md:text-3xl font-mono font-bold mt-0.5 text-teal-200">
                ₹
                {expenses
                  .filter((e) => e.participants.includes(profile.name))
                  .reduce(
                    (sum, e) => sum + e.amount / e.participants.length,
                    0
                  )
                  .toLocaleString()}
              </p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-[10px] uppercase font-bold text-white/60 tracking-wider">
                Status
              </p>
              <p className="text-sm font-semibold mt-1 bg-white/10 w-fit px-3 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {settlements.length === 0
                  ? "Fully Settled"
                  : `${settlements.length} active balance${settlements.length > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 border-t border-white/15 pt-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-white/60 tracking-wider">
                  Remaining Pot 🍯
                </p>
                <p className={`text-2xl md:text-3xl font-mono font-black mt-0.5 ${poolRemaining >= 0 ? 'text-teal-200' : 'text-red-300'}`}>
                  ₹{poolRemaining.toLocaleString()}
                </p>
              </div>
              {group.target_amount && (
                <div className="text-right flex flex-col items-end">
                  <p className="text-[10px] uppercase font-bold text-white/60 tracking-wider">
                    Target Goal
                  </p>
                  {isCurrentAdmin ? (
                    isEditingTarget ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/70 font-mono">₹</span>
                          <input 
                            type="number" 
                            value={newTarget}
                            onChange={(e) => setNewTarget(e.target.value)}
                            className="bg-white/10 border border-white/20 rounded-lg pl-6 pr-2 py-1 w-24 text-white font-mono text-sm focus:outline-none focus:border-white/40"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveTarget()}
                          />
                        </div>
                        <button onClick={handleSaveTarget} className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 p-1 rounded-md transition-colors">
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-0.5 group/target cursor-pointer" onClick={() => { if (!isCompleted) { setNewTarget(group.target_amount.toString()); setIsEditingTarget(true); } }}>
                        <p className="text-lg font-mono font-bold text-teal-200">
                          ₹{group.target_amount.toLocaleString()}
                        </p>
                        {!isCompleted && (
                          <button className="opacity-0 group-hover/target:opacity-100 transition-opacity text-white/40 hover:text-white">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )
                  ) : (
                    <p className="text-lg font-mono font-bold text-teal-200 mt-0.5">
                      ₹{group.target_amount.toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
            {/* Split collected and spent summary */}
            <div className="grid grid-cols-2 gap-3 bg-white/10 rounded-2xl p-3 border border-white/15">
              <div className="text-center">
                <p className="text-[10px] text-white/55 font-bold uppercase tracking-wider mb-1">Total Pooled</p>
                <p className="font-mono font-bold text-sm text-emerald-300">₹{poolCollected.toLocaleString()}</p>
              </div>
              <div className="text-center border-l border-white/15">
                <p className="text-[10px] text-white/55 font-bold uppercase tracking-wider mb-1">Total Spent</p>
                <p className="font-mono font-bold text-sm text-amber-300">₹{poolSpent.toLocaleString()}</p>
              </div>
            </div>

            {/* Deficit Warning / Smart Alert */}
            {poolRemaining < 0 && (
              <div className="bg-rose-500/20 border border-rose-500/35 rounded-2xl p-4 space-y-1 text-left">
                <p className="text-xs font-bold text-rose-300 flex items-center gap-1">
                  <span>⚠️</span> Insufficient Funds (Deficit: ₹{Math.abs(poolRemaining).toLocaleString()})
                </p>
                <div className="text-[10px] text-white/70 mt-0.5 leading-relaxed">
                  {myDeficitShare > 0 ? (
                    <p>
                      Your share of the deficit is <span className="font-extrabold text-amber-300">₹{myDeficitShare.toLocaleString()}</span>. Please contribute to balance the pot.
                    </p>
                  ) : (
                    <p>
                      🎉 You have fully covered your share of the expenses! Other members need to contribute to balance the pot.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Per-member equal share */}
            {requiredPerMember > 0 && (
              <div className="grid grid-cols-3 gap-3 bg-white/10 rounded-2xl p-3 border border-white/15">
                <div className="text-center">
                  <p className="text-[10px] text-white/55 font-bold uppercase tracking-wider mb-1">Each Pays</p>
                  <p className="font-mono font-black text-lg text-amber-300">₹{requiredPerMember.toLocaleString()}</p>
                </div>
                <div className="text-center border-x border-white/15">
                  <p className="text-[10px] text-white/55 font-bold uppercase tracking-wider mb-1">Your Share</p>
                  <p className={`font-mono font-black text-lg ${myRemaining === 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {myRemaining === 0 ? '✓ Paid' : `₹${myRemaining.toLocaleString()}`}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-white/55 font-bold uppercase tracking-wider mb-1">Members</p>
                  <p className="font-mono font-black text-lg text-white">{group.members.length}</p>
                </div>
              </div>
            )}

            {group.target_amount && (
              <div className="space-y-1.5">
                <div className="w-full h-3 bg-white/15 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(poolProgress, 100)}%`,
                      background:
                        "linear-gradient(90deg, #fbbf24 0%, #f97316 100%)",
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-white/60">
                  <span>{Math.round(poolProgress)}% Completed</span>
                  <span>
                    ₹{(group.target_amount - poolCollected).toLocaleString()}{" "}
                    left
                  </span>
                </div>
              </div>
            )}
          </div>

        )}
      </div>

      {/* Tab Switcher for Pool Mode */}
      {!isSplit && (
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-gray-200/60 max-w-md mx-auto w-full shadow-inner animate-fade-in">
          <button
            onClick={() => {
              setPoolTab("expenses");
              setShowAddForm(false);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-extrabold rounded-xl transition-all duration-300 cursor-pointer ${
              poolTab === "expenses"
                ? "bg-white text-teal-600 shadow-sm scale-[1.02]"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
            }`}
          >
            <span>🥥</span> Pool Expenses
          </button>
          <button
            onClick={() => {
              setPoolTab("contributions");
              setShowAddForm(false);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-extrabold rounded-xl transition-all duration-300 cursor-pointer ${
              poolTab === "contributions"
                ? "bg-white text-emerald-600 shadow-sm scale-[1.02]"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
            }`}
          >
            <span>💰</span> Contributions
          </button>
        </div>
      )}

      {/* Completed Alert Card */}
      {isCompleted && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 shadow-sm flex items-start gap-3 animate-fade-in max-w-2xl mx-auto w-full">
          <div className="text-3xl select-none">🏝️</div>
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-emerald-950">
              Trip Completed & Settled!
            </h4>
            <p className="text-xs text-slate-600">
              This pool group is locked and completed. The remaining balance of <span className="font-black text-emerald-700">₹{poolRemaining.toLocaleString()}</span> has been finalized for refunds.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-12 gap-6">
        {/* Left — Expenses / Contributions */}
        <div className="md:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">
              {isSplit
                ? "Group Expenses"
                : poolTab === "expenses"
                ? "Pot Expenses 🥥"
                : "Pool Contributions 💰"}
            </h3>

            <div className="flex gap-2">
              {isCompleted ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-xl">
                  🔒 Locked & Completed
                </span>
              ) : (
                <>
                  {isSplit ? (
                    <button
                      onClick={() => setShowSettleModal(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 border border-teal-200 bg-teal-50 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" strokeWidth={2.5} />
                      Settle Up
                    </button>
                  ) : (
                    isCurrentAdmin && (
                      <button
                        onClick={handleCompletePool}
                        className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 border border-rose-200 bg-rose-50 px-3 py-1.5 rounded-xl transition-all cursor-pointer animate-pulse"
                      >
                        🏁 End Trip & Refund
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 border border-emerald-200 bg-emerald-50 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    {showAddForm
                      ? "Close"
                      : isSplit
                      ? "Add Expense"
                      : poolTab === "expenses"
                      ? "Add Pool Expense"
                      : "Add Fund"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Add Form Panel */}
          {showAddForm && (
            <div className="bg-teal-50 border border-teal-200 rounded-3xl p-5 shadow-sm animate-slide-up">
              <h4 className="text-sm font-bold text-teal-900 mb-4 flex items-center gap-1.5">
                {isSplit ? (
                  <>
                    <Split className="w-4 h-4 text-rose-500" />
                    Record New Shared Expense
                  </>
                ) : poolTab === "expenses" ? (
                  <>
                    <Wallet className="w-4 h-4 text-teal-600" />
                    Log Pot Spending Expense
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 text-teal-600" />
                    Contribute to Pool
                  </>
                )}
              </h4>

              {isSplit || (!isSplit && poolTab === "expenses") ? (
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-teal-900/60 uppercase tracking-wider mb-1">
                        What did you buy?
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Scooters, Dinner, Snorkeling"
                        value={expenseDesc}
                        onChange={(e) => setExpenseDesc(e.target.value)}
                        required
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-teal-900/60 uppercase tracking-wider mb-1">
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={expenseAmt}
                        onChange={(e) => setExpenseAmt(e.target.value)}
                        required
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                      />
                    </div>
                  </div>

                  {isSplit ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-teal-900/60 uppercase tracking-wider mb-1">
                            Who Paid?
                          </label>
                          <select
                            value={expensePayer}
                            onChange={(e) => setExpensePayer(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                          >
                            {group.members.map((m: string) => (
                              <option key={m} value={m}>
                                {m === profile.name ? `You (${profile.name})` : m}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-teal-900/60 uppercase tracking-wider mb-1">
                            Split Cost
                          </label>
                          <div className="bg-teal-100 rounded-xl px-4 py-3 text-center text-sm font-mono font-bold text-teal-800">
                            {expenseAmt
                              ? `₹${Math.round(
                                  parseFloat(expenseAmt) /
                                    expenseParticipants.length
                                ).toLocaleString()} each`
                              : "₹0 each"}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-teal-900/60 uppercase tracking-wider mb-2">
                          Include in split:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {group.members.map((m: string) => {
                            const included = expenseParticipants.includes(m);
                            return (
                              <button
                                key={m}
                                type="button"
                                onClick={() => toggleParticipant(m)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                  included
                                    ? "bg-teal-600 border-teal-600 text-white shadow-sm"
                                    : "bg-white border-gray-200 text-slate-600 hover:bg-teal-50"
                                }`}
                              >
                                {m === profile.name ? "You" : m}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {potentialRemaining < 0 && (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 space-y-1">
                          <p className="font-bold flex items-center gap-1">
                            <span>⚠️</span> Potential Deficit Alert
                          </p>
                          <p>
                            This expense will exceed the remaining pot balance by <span className="font-extrabold">₹{Math.abs(potentialRemaining).toLocaleString()}</span>.
                          </p>
                        </div>
                      )}
                      <div className="bg-teal-100/50 rounded-2xl p-4 border border-teal-200/50 text-xs text-teal-800 space-y-1">
                        <p className="font-bold flex items-center gap-1">
                          <span>ℹ️</span> Pot Expense Details
                        </p>
                        <p>
                          This expense will be deducted directly from the group's pooled balance (₹{poolRemaining.toLocaleString()} remaining).
                        </p>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    className="w-full gradient-sunset text-white font-semibold text-sm py-3 rounded-xl shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    {!isSplit ? "Log Pot Expense" : "Add Expense"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAddContribution} className="space-y-4">
                  {/* Deficit Alert banner */}
                  {poolRemaining < 0 && (
                    myDeficitShare > 0 ? (
                      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2 animate-pulse">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-rose-950 flex items-center gap-1">
                              <span>⚠️</span> Group Deficit Active
                            </p>
                            <p className="text-[10.5px] text-rose-700 mt-0.5 font-medium">
                              The pot has run dry. Your share of the deficit is <span className="font-extrabold">₹{myDeficitShare.toLocaleString()}</span>.
                            </p>
                          </div>
                          <span className="font-mono font-black text-rose-600 text-sm">
                            ₹{myDeficitShare.toLocaleString()}
                          </span>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => setPoolAmt(myDeficitShare.toString())}
                          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm active:scale-95"
                        >
                          Fill Deficit Share — ₹{myDeficitShare.toLocaleString()}
                        </button>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-800">
                        🎉 <span className="font-bold">Deficit Covered!</span> You have contributed ₹{myContributed.toLocaleString()} which fully covers your share of the expenses. Other members need to contribute to balance the pot.
                      </div>
                    )
                  )}

                  {/* Your share status banner */}
                  {requiredPerMember > 0 && (
                    <div className={`rounded-2xl p-4 border ${ myRemaining === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200' }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-xs font-bold text-slate-700">
                            {myRemaining === 0 ? '✅ Your share is fully paid!' : 'Your equal share'}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            ₹{requiredPerMember.toLocaleString()} required
                            {myContributed > 0 && ` · ₹${myContributed.toLocaleString()} paid`}
                          </p>
                        </div>
                        <span className={`font-mono font-black text-lg ${ myRemaining === 0 ? 'text-emerald-600' : 'text-amber-600' }`}>
                          {myRemaining === 0 ? '✓' : `₹${myRemaining.toLocaleString()} left`}
                        </span>
                      </div>
                      {/* Mini progress bar */}
                      <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${ myRemaining === 0 ? 'bg-emerald-500' : 'bg-amber-400' }`}
                          style={{ width: `${myPercent}%` }}
                        />
                      </div>
                      {/* Pay my share button */}
                      {myRemaining > 0 && (
                        <button
                          type="button"
                          onClick={() => setPoolAmt(myRemaining.toString())}
                          className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
                        >
                          Pay My Remaining Share — ₹{myRemaining.toLocaleString()}
                        </button>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-teal-900/60 uppercase tracking-wider mb-2">
                      Contribution Amount (₹)
                    </label>
                    {/* Quick-pick buttons — includes share amounts */}
                    <div className="flex gap-2 flex-wrap mb-3">
                      {poolRemaining < 0 && myDeficitShare > 0 && (
                        <button
                          type="button"
                          onClick={() => setPoolAmt(myDeficitShare.toString())}
                          className="bg-rose-50 border border-rose-300 hover:bg-rose-100 text-rose-800 font-mono font-bold text-xs py-2.5 px-3 rounded-xl transition-colors cursor-pointer flex-shrink-0"
                        >
                          Deficit Share (₹{myDeficitShare.toLocaleString()})
                        </button>
                      )}
                      {myRemaining > 0 && (
                        <button
                          type="button"
                          onClick={() => setPoolAmt(myRemaining.toString())}
                          className="bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 font-mono font-bold text-xs py-2.5 px-3 rounded-xl transition-colors cursor-pointer flex-shrink-0"
                        >
                          My Share (₹{myRemaining.toLocaleString()})
                        </button>
                      )}
                      {[500, 1000, 2000].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setPoolAmt(v.toString())}
                          className="bg-white border border-teal-200 hover:bg-teal-50 text-teal-800 font-mono font-bold text-xs py-2.5 px-3 rounded-xl transition-colors cursor-pointer flex-shrink-0"
                        >
                          ₹{v}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <DollarSign className="w-4 h-4" />
                      </span>
                      <input
                        type="number"
                        placeholder="Or enter custom amount"
                        value={poolAmt}
                        onChange={(e) => setPoolAmt(e.target.value)}
                        required
                        className="bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full gradient-tropical text-white font-semibold text-sm py-3 rounded-xl shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    Contribute to Pool
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Refund Settlements Card for completed Pool */}
          {!isSplit && isCompleted && (
            <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 space-y-4 animate-fade-in mb-4">
              <h3 className="text-sm font-extrabold text-emerald-900 flex items-center gap-1.5">
                <span>🤝</span> Refund Settlements
              </h3>
              
              {poolRemaining > 0 ? (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Refunds calculated based on contribution share:
                  </p>
                  <div className="space-y-2">
                    {group.members.map((member: string) => {
                      const refund = memberRefundMap[member] ?? 0;
                      const isMe = member === profile.name;
                      return (
                        <div
                          key={member}
                          className="flex justify-between items-center p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/50 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[9px]">
                              {member.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-800">
                              {isMe ? `You (${profile.name})` : member}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-emerald-700">
                              ₹{refund.toLocaleString()}
                            </span>
                            
                            {!isMe && refund > 0 && (
                              <button
                                onClick={() => {
                                  let upiId = member.toLowerCase().replace(/\s+/g, '') + '@upi';
                                  const friend = friends.find(f => f.name === member);
                                  if (friend) upiId = friend.upi_id;
                                  setActiveQrData({
                                    name: member,
                                    upiId,
                                    amount: refund
                                  });
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-2 py-1 rounded-lg transition-colors cursor-pointer"
                              >
                                Refund via UPI
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 text-xs text-amber-800 text-center">
                  All money in the pot was fully spent! No refunds to settle. 🍹
                </div>
              )}
            </div>
          )}

          {/* List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            {isSplit ? (
              expenses.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0 animate-fade-in"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg select-none">
                          {exp.payer_avatar}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-900">
                            {exp.description}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Paid by{" "}
                            <span className="font-bold text-slate-600">
                              {exp.payer === profile.name ? "You" : exp.payer}
                            </span>{" "}
                            · Split between {exp.participants.length} ·{" "}
                            {timeAgo(exp.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-mono font-bold text-slate-900">
                          ₹{exp.amount.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-teal-600 font-mono font-semibold">
                          ₹
                          {Math.round(
                            exp.amount / exp.participants.length
                          ).toLocaleString()}{" "}
                          each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <Split className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="font-semibold text-slate-500">No expenses yet</p>
                  <p>Tap "Add Expense" to get started!</p>
                </div>
              )
            ) : poolTab === "expenses" ? (
              expenses.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0 animate-fade-in"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-lg select-none">
                          🥥
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-900">
                            {exp.description}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Deducted from Pot · Logged by{" "}
                            <span className="font-bold text-slate-600">
                              {exp.payer === profile.name ? "You" : exp.payer}
                            </span>{" "}
                            · {timeAgo(exp.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-mono font-bold text-rose-500">
                          -₹{exp.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <Wallet className="w-10 h-10 text-slate-200 mx-auto mb-2 animate-pulse" />
                  <p className="font-semibold text-slate-500">No pot expenses logged yet</p>
                  <p>Tap "Add Pool Expense" to track your spending!</p>
                </div>
              )
            ) : requiredPerMember > 0 ? (
              /* ── Member share tracker (pool with target) ── */
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Member Contributions — ₹{requiredPerMember.toLocaleString()} each
                </p>
                {group.members.map((member: string) => {
                  const paid = memberContribMap[member] ?? 0;
                  const remaining = Math.max(0, requiredPerMember - paid);
                  const pct = Math.min(100, (paid / requiredPerMember) * 100);
                  const isMe = member === profile.name;
                  const done = remaining === 0;
                  const isAdmin = member === poolAdmin;
                  return (
                    <div key={member} className={`p-3.5 rounded-2xl border ${ isMe ? 'border-teal-200 bg-teal-50/60' : 'border-gray-100 bg-gray-50/60' }`}>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold ${ isMe ? 'gradient-sunset text-white' : 'bg-teal-100 text-teal-700' }`}>
                            {member.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                              {isMe ? `You (${profile.name})` : member}
                              {isAdmin && (
                                <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                  Admin 👑
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              ₹{paid.toLocaleString()} paid · ₹{remaining.toLocaleString()} left
                            </p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700' }`}>
                          {done ? '✓ Done' : `${Math.round(pct)}%`}
                        </span>
                      </div>
                      {/* Per-member progress bar */}
                      <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-gray-100">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${ done ? 'bg-emerald-400' : isMe ? 'bg-teal-500' : 'bg-slate-300' }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {/* Contribution history */}
                {contributions.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-2">Payment History</p>
                    <div className="divide-y divide-gray-100">
                      {contributions.map((contrib: any) => (
                        <div key={contrib.id} className="flex justify-between items-center py-2.5 first:pt-0">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-[10px]">
                              {contrib.member.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-xs text-slate-800">{contrib.member === profile.name ? 'You' : contrib.member}</p>
                              <p className="text-[10px] text-slate-400">{timeAgo(contrib.created_at)}</p>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-xs text-emerald-600">+₹{contrib.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : contributions.length > 0 ? (
              /* ── Free-form pool (no target set) ── */
              <div className="divide-y divide-gray-100">
                {contributions.map((contrib: any) => (
                  <div key={contrib.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0 animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs select-none">
                        {contrib.member.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-900">
                          {contrib.member === profile.name ? 'You' : contrib.member} contributed
                        </p>
                        <p className="text-[10px] text-slate-400">{timeAgo(contrib.created_at)}</p>
                      </div>
                    </div>
                    <p className="font-mono text-sm font-bold text-emerald-600">+₹{contrib.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                <Wallet className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="font-semibold text-slate-500">No contributions yet</p>
                <p>Tap "Add Fund" to get started!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right — Members + Settlements */}
        <div className="md:col-span-5 space-y-5">
          {/* Members */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                Group Members
              </h3>
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="flex items-center gap-1 text-[10px] font-bold text-teal-600 hover:text-teal-700 bg-teal-50 px-2.5 py-1.5 rounded-lg cursor-pointer"
              >
                <UserPlus className="w-3 h-3" />
                Add Mate
              </button>
            </div>

            <div className="flex flex-col gap-2 text-xs font-semibold text-slate-700">
              {group.members.map((m: string) => {
                const isMe = m === profile.name;
                const isAdmin = m === poolAdmin;
                return (
                  <div
                    key={m}
                    className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                          isMe
                            ? "gradient-sunset text-white"
                            : "bg-teal-50 text-teal-700"
                        }`}
                      >
                        {isMe ? profile.avatar : m.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate">{isMe ? `You (${profile.name})` : m}</span>
                      {isAdmin && (
                        <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0 uppercase">
                          Admin 👑
                        </span>
                      )}
                    </div>

                    {/* Admin reassign capability in pool mode */}
                    {!isSplit && isCurrentAdmin && !isMe && !isCompleted && (
                      <button
                        onClick={async () => {
                          if (confirm(`Are you sure you want to make ${m} the Pool Admin? This will direct all new contributions to their UPI ID.`)) {
                            try {
                              await (dbService as any).updateGroupAdmin(groupId, m);
                              alert(`${m} is now the Pool Admin!`);
                            } catch (e) {
                              alert("Failed to change admin.");
                            }
                          }
                        }}
                        className="text-[9px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        Make Admin
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Settlement Balances (Split mode only) */}
          {isSplit && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-rose-500" />
                Settlement Balances
              </h3>

              {settlements.length > 0 ? (
                <div className="space-y-3 text-xs">
                  {settlements.map((tx, idx) => {
                    const amDebtor = tx.debtor === profile.name;
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between ${
                          amDebtor
                            ? "bg-rose-50 border-rose-100"
                            : "bg-white border-gray-100"
                        }`}
                      >
                        <div>
                          <p className="text-slate-800 leading-tight">
                            <span className="font-bold text-slate-900">
                              {tx.debtor === profile.name ? "You" : tx.debtor}
                            </span>{" "}
                            owe{" "}
                            <span className="font-bold text-slate-900">
                              {tx.creditor === profile.name
                                ? "You"
                                : tx.creditor}
                            </span>
                          </p>
                          <p className="text-[11px] text-rose-500 mt-0.5 font-mono font-bold">
                            ₹{tx.amount.toLocaleString()}
                          </p>
                        </div>

                        <button
                          onClick={() => setShowSettleModal(true)}
                          className="bg-teal-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer hover:bg-teal-700 active:scale-95 transition-all shadow-sm"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Settle Up
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 flex flex-col items-center gap-1.5">
                  <CheckCircle className="w-9 h-9 text-emerald-500" />
                  <p className="font-bold text-slate-900 text-xs">
                    Balances are fully cleared!
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Everyone is squared away. Nice! ✨
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* UPI QR Modal */}
      {activeQrData && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center border border-gray-100 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                Scan to Settle Up
              </h3>
              <button
                onClick={() => setActiveQrData(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Paying{" "}
              <span className="font-bold text-slate-900">
                {activeQrData.name}
              </span>
            </p>

            <div className="text-left space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Recipient UPI ID
              </label>
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                <span className="text-xs font-mono text-slate-800 truncate mr-2">{activeQrData.upiId}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeQrData.upiId);
                    setCopiedUpi(true);
                    setTimeout(() => setCopiedUpi(false), 2000);
                  }}
                  className="text-slate-500 hover:text-slate-700 flex-shrink-0 cursor-pointer p-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center"
                  title="Copy UPI ID"
                >
                  {copiedUpi ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="w-48 h-48 bg-slate-50 border border-slate-200 rounded-2xl mx-auto flex items-center justify-center overflow-hidden shadow-inner p-1">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `upi://pay?pa=${activeQrData.upiId}&pn=${activeQrData.name}&am=${activeQrData.amount}&cu=INR`
                )}`}
                alt="UPI Payment QR"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>

            <div className="font-mono text-sm">
              <p className="font-bold text-slate-900 text-xl">
                ₹{activeQrData.amount.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {activeQrData.upiId}
              </p>
            </div>

            <p className="text-[10px] text-teal-700 bg-teal-50 p-2.5 rounded-xl">
              💡 Open any UPI app (GPay, PhonePe, Paytm, BHIM) on your mobile
              and scan this QR to pay.
            </p>

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (activeQrData) {
                    if (activeQrData.isPool) {
                      try {
                        await dbService.addContribution(groupId, profile.name, activeQrData.amount);
                        setPoolAmt("");
                        confetti({
                          particleCount: 150,
                          spread: 80,
                          colors: ["#14b8a6", "#22c55e", "#fef08a"],
                        });
                        playPaymentSound();
                        fetchGroupDetails();
                      } catch(err) { console.error(err); }
                    } else {
                      recordSettlement(profile.name, activeQrData.name, activeQrData.amount);
                    }
                    setActiveQrData(null);
                  }
                }}
                className="flex-1 gradient-palm text-white font-semibold text-xs py-2.5 rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                I've Paid! ✓
              </button>
              <button
                onClick={() => setActiveQrData(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    {/* Settle Group Balances Modal */}
    {showSettleModal && (
      <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4 animate-scale-in text-left">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>🤝</span> Settle Group Balances
            </h3>
            <button
              onClick={() => setShowSettleModal(false)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {settlements.length > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {settlements.map((tx, idx) => {
                const amDebtor = tx.debtor === profile.name;
                const amCreditor = tx.creditor === profile.name;

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-gray-100 bg-gray-50 flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-slate-800 font-semibold">
                          {amDebtor ? (
                            <span>You owe <span className="font-bold text-slate-900">{tx.creditor}</span></span>
                          ) : amCreditor ? (
                            <span><span className="font-bold text-slate-900">{tx.debtor}</span> owes you</span>
                          ) : (
                            <span><span className="font-bold text-slate-950">{tx.debtor}</span> owes <span className="font-bold text-slate-950">{tx.creditor}</span></span>
                          )}
                        </p>
                        <p className="text-base font-mono font-black text-rose-500 mt-1">
                          ₹{tx.amount.toLocaleString()}
                        </p>
                      </div>

                      {/* Badges */}
                      {amDebtor && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg">
                          You Pay
                        </span>
                      )}
                      {amCreditor && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                          You Receive
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1">
                      {amDebtor && (
                        <button
                          onClick={() => {
                            handleSettlePay(tx.creditor, tx.amount);
                            setShowSettleModal(false);
                          }}
                          className="flex-1 bg-teal-600 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 hover:bg-teal-700 transition-colors cursor-pointer"
                        >
                          <QrCode className="w-4 h-4" />
                          Pay via UPI
                        </button>
                      )}
                      <button
                        onClick={() => {
                          recordSettlement(tx.debtor, tx.creditor, tx.amount);
                          setShowSettleModal(false);
                        }}
                        className="flex-1 bg-white border border-gray-200 text-slate-700 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Record Cash Payment
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 space-y-2">
              <div className="text-4xl">✨</div>
              <p className="font-bold text-slate-900 text-sm">Everyone is settled up!</p>
              <p className="text-xs text-slate-400">No active balances to resolve in this group.</p>
            </div>
          )}

          <button
            onClick={() => setShowSettleModal(false)}
            className="w-full bg-slate-900 text-white font-bold text-xs py-3 rounded-2xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    )}
    {/* Add Member Modal */}
    {showAddMemberModal && (
      <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4 animate-scale-in text-left">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-teal-600" />
              <span>Add Mates to {group.name}</span>
            </h3>
            <button
              onClick={() => setShowAddMemberModal(false)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* List of Addable Friends */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Select from Friends
            </h4>
            {friends.filter(f => !group.members.includes(f.name)).length > 0 ? (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {friends
                  .filter(f => !group.members.includes(f.name))
                  .map(friend => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-[10px]">
                          {friend.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-700">{friend.name}</span>
                      </div>
                      <button
                        onClick={async () => {
                          await dbService.addGroupMember(groupId, friend.name);
                          fetchGroupDetails();
                        }}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-[10px]"
                      >
                        Add
                      </button>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center bg-gray-50 rounded-2xl border border-gray-100">
                🌴 All your friends are in the group!
              </p>
            )}
          </div>

          {/* Share Group Join Link */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Invite New Friends
            </h4>
            <p className="text-[11px] text-slate-400">
              Share a direct link to invite people who aren't on the app yet:
            </p>
            <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 p-3 rounded-2xl">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-teal-600 font-bold uppercase tracking-wider">Group Invite Code</p>
                <p className="font-mono font-black text-teal-700 text-sm tracking-wider">
                  {group.invite_code || "Generating..."}
                </p>
              </div>
              <button
                onClick={() => {
                  const inviteLink = `${window.location.origin}/?groupCode=${group.invite_code || ""}`;
                  navigator.clipboard.writeText(inviteLink);
                  alert("Invite link copied to clipboard! 📋");
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer flex-shrink-0"
              >
                Copy Link
              </button>
            </div>

            {/* Instant Share Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  const inviteLink = `${window.location.origin}/?groupCode=${group.invite_code || ""}`;
                  const text = `Hey! Join our travel expense group "${group.name}" on Pool-n-Pay! ✈️\nCode: ${group.invite_code || ""}\nLink: ${inviteLink}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                }}
                className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                Share to WhatsApp
              </button>
              <button
                onClick={() => {
                  const inviteLink = `${window.location.origin}/?groupCode=${group.invite_code || ""}`;
                  const text = `Join my travel group "${group.name}" on Pool-n-Pay: ${inviteLink}`;
                  window.location.href = `sms:?body=${encodeURIComponent(text)}`;
                }}
                className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                Invite via SMS
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowAddMemberModal(false)}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-2xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    )}
  </div>
);
};
