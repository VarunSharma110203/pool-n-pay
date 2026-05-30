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
  expense: { dot: "bg-rose-400", amount: "text-rose-500", bg: "bg-rose-50", label: "Expense" },
  payment: { dot: "bg-emerald-400", amount: "text-emerald-600", bg: "bg-emerald-50", label: "Payment" },
  pool:    { dot: "bg-teal-400",   amount: "text-teal-600",   bg: "bg-teal-50",   label: "Pool" },
};

const ActivityItem: React.FC<ActivityItemProps> = ({ avatar, name, action, amount, type, created_at }) => {
  const config = typeConfig[type] || typeConfig.expense;
  const isEmojiAvatar = isEmoji(avatar);
  const timestamp = timeAgo(created_at);

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/70 transition-colors group">
      {/* Avatar */}
      <div className="flex-shrink-0 relative">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden ${ isEmojiAvatar ? 'bg-gray-100' : 'gradient-tropical text-white' }`}>
          {isEmojiAvatar ? <span className="text-xl">{avatar}</span> : <span className="text-xs">{avatar.slice(0,2)}</span>}
        </div>
        {/* Type dot */}
        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${config.dot}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-800 leading-snug">
          <span className="font-bold">{name}</span>{" "}
          <span className="text-slate-500">{action}</span>
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-slate-400 font-medium">{timestamp}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${config.bg} ${config.amount}`}>{config.label}</span>
        </div>
      </div>

      {/* Amount */}
      {amount && (
        <div className="flex-shrink-0">
          <span className={`font-mono font-bold text-sm ${config.amount}`}>{amount}</span>
        </div>
      )}
    </div>
  );
};

export default ActivityItem;
export { ActivityItem };
