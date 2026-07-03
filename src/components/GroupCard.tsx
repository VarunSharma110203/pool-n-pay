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

  // Badge class
  const badgeClass = isSplit ? "badge-violet" : "badge-mint";

  // Balance color
  const balanceColor = isPositive ? "#34d399" : isNegative ? "#f43f5e" : "#a78bfa";

  return (
    <div
      onClick={onClick}
      className="card card-hover flex items-stretch gap-4 p-4 cursor-pointer"
    >
      {/* Emoji circle */}
      <div
        className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl select-none"
        style={{ background: isSplit ? "rgba(124, 58, 237, 0.15)" : "rgba(16, 185, 129, 0.15)" }}
      >
        {emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
        {/* Name + badge */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm truncate text-white">{name}</span>
          <span
            className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}
          >
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
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progressPercent}%`,
                  background: "linear-gradient(90deg,#7c3aed,#f97316)",
                }}
              />
            </div>
            <span className="text-[10px] font-medium text-slate-400">
              {progressPercent.toFixed(0)}% of ₹{target_amount.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Balance */}
      {hasBalance && (
        <div className="flex-shrink-0 flex flex-col items-end justify-center gap-0.5">
          <span className="money text-sm font-bold" style={{ color: balanceColor }}>
            {balanceStr}
          </span>
          <span className="text-[10px] font-medium text-slate-400">
            {isSplit ? (isPositive ? "owed to you" : isNegative ? "you owe" : "") : "contributed"}
          </span>
        </div>
      )}
    </div>
  );
};

export default GroupCard;
export { GroupCard };
