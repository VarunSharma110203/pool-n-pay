import React from "react";
import { Users } from "lucide-react";

interface GroupCardProps {
  id: string;
  name: string;
  mode: "split" | "pool";
  members: string[] | number;
  balance: string;
  emoji: string;
  target_amount?: number;
  onClick?: () => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ id: _id, name, mode, members, balance, emoji, target_amount, onClick }) => {
  const memberCount = typeof members === "number" ? members : members.length;
  const isSplit = mode === "split";

  // Parse balance for coloring
  const balanceStr = balance || "";
  const isPositive = balanceStr.startsWith("+");
  const isNegative = balanceStr.startsWith("-");
  const hasBalance = balanceStr.length > 0 && balanceStr !== "₹0";

  // Pool progress
  const poolNum = parseFloat(balanceStr.replace(/[^0-9.]/g, "")) || 0;
  const progressPercent = (!isSplit && target_amount && target_amount > 0)
    ? Math.min(100, (poolNum / target_amount) * 100)
    : 0;

  return (
    <div
      onClick={onClick}
      className="card card-hover flex items-stretch gap-4 p-4"
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {/* Emoji circle */}
      <div
        className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl select-none"
        style={{ background: isSplit ? "#f0fdfa" : "#f0fdf4" }}
      >
        {emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
        {/* Name + badge */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 text-sm truncate">{name}</span>
          <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${ isSplit ? "bg-teal-100 text-teal-700" : "bg-emerald-100 text-emerald-700" }`}>
            {isSplit ? "Split" : "Pool"}
          </span>
        </div>

        {/* Members */}
        <div className="flex items-center gap-1 text-slate-400">
          <Users className="w-3 h-3" />
          <span className="text-xs">{memberCount} {memberCount === 1 ? "member" : "members"}</span>
        </div>

        {/* Pool progress bar */}
        {!isSplit && target_amount && target_amount > 0 && (
          <div className="space-y-1">
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="gradient-tropical h-full rounded-full transition-all duration-700" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">{progressPercent.toFixed(0)}% of ₹{target_amount.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Balance */}
      {hasBalance && (
        <div className="flex-shrink-0 flex flex-col items-end justify-center gap-0.5">
          <span className={`money text-sm font-bold ${ isPositive ? "text-emerald-600" : isNegative ? "text-rose-500" : "text-teal-600" }`}>
            {balanceStr}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {isSplit ? (isPositive ? "owed to you" : isNegative ? "you owe" : "") : "contributed"}
          </span>
        </div>
      )}
    </div>
  );
};

export default GroupCard;
export { GroupCard };
