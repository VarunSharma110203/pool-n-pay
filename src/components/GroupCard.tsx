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

  // Badge styles
  const badgeStyle = isSplit
    ? { background: "#ede9fe", color: "#7c3aed", border: "1px solid rgba(167,139,250,0.3)" }
    : { background: "#d1fae5", color: "#059669", border: "1px solid rgba(110,231,183,0.3)" };

  // Balance color
  const balanceColor = isPositive ? "#059669" : isNegative ? "#e11d48" : "#7c3aed";

  return (
    <div
      onClick={onClick}
      className="card-hover flex items-stretch gap-4 p-4"
      style={{
        background: "rgba(255,255,255,0.75)",
        border: "1px solid rgba(255,255,255,0.9)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 2px 16px rgba(124,58,237,0.07)",
        borderRadius: "20px",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {/* Emoji circle */}
      <div
        className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl select-none"
        style={{ background: isSplit ? "rgba(237,233,254,0.7)" : "rgba(209,250,229,0.7)" }}
      >
        {emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
        {/* Name + badge */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm truncate" style={{ color: "#1e1b4b" }}>{name}</span>
          <span
            className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={badgeStyle}
          >
            {isSplit ? "Split" : "Pool"}
          </span>
        </div>

        {/* Members */}
        <div className="flex items-center gap-1" style={{ color: "#94a3b8" }}>
          <Users className="w-3 h-3" />
          <span className="text-xs">{memberCount} {memberCount === 1 ? "member" : "members"}</span>
        </div>

        {/* Pool progress bar */}
        {!isSplit && target_amount && target_amount > 0 && (
          <div className="space-y-1">
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progressPercent}%`,
                  background: "linear-gradient(90deg,#7c3aed,#a78bfa)",
                }}
              />
            </div>
            <span className="text-[10px] font-medium" style={{ color: "#94a3b8" }}>
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
          <span className="text-[10px] font-medium" style={{ color: "#94a3b8" }}>
            {isSplit ? (isPositive ? "owed to you" : isNegative ? "you owe" : "") : "contributed"}
          </span>
        </div>
      )}
    </div>
  );
};

export default GroupCard;
export { GroupCard };
