import React from "react";
import type { LucideIcon } from "lucide-react";

interface QuickActionProps {
  icon: LucideIcon;
  label: string;
  color: "teal" | "emerald" | "rose" | "orange";
  onClick: () => void;
}

const colorMap = {
  teal:    { iconBg: "#ede9fe", iconColor: "#7c3aed" },
  emerald: { iconBg: "#d1fae5", iconColor: "#059669" },
  rose:    { iconBg: "#ffe4e6", iconColor: "#e11d48" },
  orange:  { iconBg: "#fef3c7", iconColor: "#d97706" },
};

const QuickAction: React.FC<QuickActionProps> = ({ icon: Icon, label, color, onClick }) => {
  const c = colorMap[color];
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2.5 p-3.5 rounded-2xl hover:scale-105 hover:shadow-md active:scale-95 transition-all duration-150 cursor-pointer group w-full btn-ripple"
      style={{
        background: "rgba(255,255,255,0.75)",
        border: "1px solid rgba(255,255,255,0.9)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 2px 12px rgba(124,58,237,0.07)",
      }}
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
        style={{ background: c.iconBg }}
      >
        <Icon className="w-5 h-5" style={{ color: c.iconColor }} />
      </div>
      <span className="text-[11px] font-bold leading-tight text-center" style={{ color: "#1e1b4b" }}>
        {label}
      </span>
    </button>
  );
};

export default QuickAction;
export { QuickAction };
