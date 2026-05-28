import React from "react";
import type { LucideIcon } from "lucide-react";

interface QuickActionProps {
  icon: LucideIcon;
  label: string;
  color: "teal" | "emerald" | "rose" | "orange";
  onClick: () => void;
}

const colorMap = {
  teal:    { bg: "bg-teal-100",    icon: "text-teal-600",    active: "bg-teal-500" },
  emerald: { bg: "bg-emerald-100", icon: "text-emerald-600", active: "bg-emerald-500" },
  rose:    { bg: "bg-rose-100",    icon: "text-rose-500",    active: "bg-rose-500" },
  orange:  { bg: "bg-orange-100",  icon: "text-orange-500",  active: "bg-orange-500" },
};

const QuickAction: React.FC<QuickActionProps> = ({ icon: Icon, label, color, onClick }) => {
  const c = colorMap[color];
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2.5 p-3.5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer group w-full btn-ripple"
    >
      <div className={`w-11 h-11 rounded-2xl ${c.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
        <Icon className={`w-5 h-5 ${c.icon}`} />
      </div>
      <span className="text-[11px] font-bold text-slate-700 leading-tight text-center">{label}</span>
    </button>
  );
};

export default QuickAction;
export { QuickAction };
