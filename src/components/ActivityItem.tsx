import React from "react";
import { timeAgo } from "../lib/firebaseClient";

interface ActivityItemProps {
  avatar: string;
  name: string;
  action: string;
  amount: string;
  type: "expense" | "payment" | "pool";
  created_at: string;
}

function isEmoji(str: string): boolean {
  return /\p{Emoji}/u.test(str) && str.length <= 4;
}

const typeConfig = {
  expense: { dot: "#fb7185", amountColor: "#f43f5e", bg: "rgba(244, 63, 94, 0.15)", label: "Expense" },
  payment: { dot: "#34d399", amountColor: "#10b981", bg: "rgba(16, 185, 129, 0.15)", label: "Payment" },
  pool:    { dot: "#c084fc", amountColor: "#a78bfa", bg: "rgba(124, 58, 237, 0.15)", label: "Pool" },
};

const ActivityItem: React.FC<ActivityItemProps> = ({ avatar, name, action, amount, type, created_at }) => {
  const config = typeConfig[type] || typeConfig.expense;
  const isEmojiAvatar = isEmoji(avatar);
  const timestamp = timeAgo(created_at);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 transition-colors group cursor-default"
      style={{ borderRadius: "12px" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255, 255, 255, 0.05)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 relative">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden"
          style={
            isEmojiAvatar
              ? { background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.08)" }
              : { background: "linear-gradient(135deg,#7c3aed,#f97316)", color: "#fff" }
          }
        >
          {isEmojiAvatar
            ? <span className="text-xl">{avatar}</span>
            : <span className="text-xs">{avatar.slice(0, 2)}</span>}
        </div>
        {/* Type dot */}
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#120f26]"
          style={{ background: config.dot }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug text-white">
          <span className="font-bold">{name}</span>{" "}
          <span className="text-slate-400">{action}</span>
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] font-medium text-slate-400">{timestamp}</span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
            style={{ background: config.bg, color: config.amountColor }}
          >
            {config.label}
          </span>
        </div>
      </div>

      {/* Amount */}
      {amount && (
        <div className="flex-shrink-0">
          <span className="font-mono font-bold text-sm" style={{ color: config.amountColor }}>{amount}</span>
        </div>
      )}
    </div>
  );
};

export default ActivityItem;
export { ActivityItem };
