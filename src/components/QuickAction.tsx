import React from "react";
import type { LucideIcon } from "lucide-react";

interface QuickActionProps {
  icon: LucideIcon;
  label: string;
  color: "teal" | "emerald" | "rose" | "orange";
  onClick: () => void;
}

const colorMap = {
  teal:    { iconBg: "rgba(124, 58, 237, 0.15)", iconColor: "#a78bfa" },
  emerald: { iconBg: "rgba(16, 185, 129, 0.15)", iconColor: "#34d399" },
  rose:    { iconBg: "rgba(244, 63, 94, 0.15)", iconColor: "#fb7185" },
  orange:  { iconBg: "rgba(249, 115, 22, 0.15)", iconColor: "#f97316" },
};

const QuickAction: React.FC<QuickActionProps> = ({ icon: Icon, label, color, onClick }) => {
  const c = colorMap[color];
  return (
    <button
      onClick={onClick}
      className="card card-hover flex flex-col items-center gap-2.5 p-3.5 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer group w-full btn-ripple"
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
        style={{ background: c.iconBg }}
      >
        <Icon className="w-5 h-5" style={{ color: c.iconColor }} />
      </div>
      <span className="text-[11px] font-bold leading-tight text-center text-white">
        {label}
      </span>
    </button>
  );
};

export default QuickAction;
export { QuickAction };
