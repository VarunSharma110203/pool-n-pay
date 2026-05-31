import React from "react";
import { ArrowRight, ShieldCheck, Zap, Users, Sparkles, CreditCard } from "lucide-react";

interface LandingPageProps {
  onLoginClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  return (
    <div className="min-h-screen font-sans overflow-hidden" style={{ background: "linear-gradient(135deg,#f5f3ff 0%,#ede9fe 30%,#dbeafe 65%,#e0f2fe 100%)" }}>

      {/* ── Ambient background blobs ── */}
      <div className="blob w-96 h-96 bg-violet-300 top-[-6rem] left-[-6rem]" />
      <div className="blob w-80 h-80 bg-sky-200 top-20 right-0" />
      <div className="blob w-72 h-72 bg-pink-200 bottom-40 left-1/3" />
      <div className="blob w-64 h-64 bg-emerald-200 bottom-0 right-[-4rem]" />

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50" style={{ background: "rgba(245,243,255,0.75)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(167,139,250,0.15)" }}>
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between" style={{ height: "72px" }}>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md" style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)" }}>
              <span style={{ fontSize: "18px" }}>🌴</span>
            </div>
            <span className="font-black text-lg tracking-tight" style={{ color: "#1e1b4b" }}>Pool-n-Pay</span>
          </div>

          {/* Nav */}
          <div className="flex items-center gap-3">
            <button
              onClick={onLoginClick}
              className="hidden md:block font-semibold text-sm px-4 py-2 transition-colors rounded-lg hover:bg-violet-50"
              style={{ color: "#6d28d9" }}
            >
              Log in
            </button>
            <button
              onClick={onLoginClick}
              className="text-white font-bold text-sm px-5 py-2.5 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-44 pb-28 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-7 animate-slide-up">

          {/* Tag pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold" style={{ background: "rgba(167,139,250,0.18)", color: "#6d28d9", border: "1px solid rgba(167,139,250,0.3)" }}>
            <Sparkles size={14} />
            Built for Goa trips, house parties & everything between
          </div>

          {/* Headline */}
          <h1 className="font-black tracking-tight leading-[1.08]" style={{ fontSize: "clamp(2.6rem, 7vw, 4.5rem)", color: "#1e1b4b" }}>
            Split bills.<br />
            <span style={{ background: "linear-gradient(90deg,#7c3aed,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Pool money.
            </span>{" "}
            <span style={{ color: "#64748b" }}>Travel.</span>
          </h1>

          {/* Sub-copy */}
          <p className="text-lg leading-relaxed mx-auto max-w-xl" style={{ color: "#64748b", fontWeight: 450 }}>
            Stop fronting ₹30,000 for everyone. With Pool-n-Pay, your whole group chips in upfront — and you get a transparent ledger of every rupee spent.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-3">
            <button
              onClick={onLoginClick}
              className="flex items-center justify-center gap-2 font-bold text-base text-white px-8 py-4 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)", boxShadow: "0 8px 24px rgba(124,58,237,0.35)" }}
            >
              Start for free
              <ArrowRight size={18} />
            </button>
            <button
              onClick={onLoginClick}
              className="flex items-center justify-center gap-2 font-semibold text-base px-8 py-4 rounded-2xl transition-all active:scale-95 hover:shadow-md"
              style={{ background: "rgba(255,255,255,0.7)", color: "#1e1b4b", border: "1px solid rgba(167,139,250,0.3)", backdropFilter: "blur(12px)" }}
            >
              Log in
            </button>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS BAND ── */}
      <section className="py-6 px-6" style={{ background: "rgba(255,255,255,0.4)", borderTop: "1px solid rgba(167,139,250,0.12)", borderBottom: "1px solid rgba(167,139,250,0.12)" }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-around gap-4 text-center">
          {["Create a Pool Group", "Everyone contributes via UPI", "Admin logs expenses", "Settle remainders — done"].map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)" }}>{i + 1}</div>
              <p className="text-sm font-semibold" style={{ color: "#475569" }}>{step}</p>
              {i < 3 && <span className="hidden sm:block text-violet-300 text-lg">→</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <h2 className="font-black text-4xl tracking-tight" style={{ color: "#1e1b4b" }}>Why Pool-n-Pay?</h2>
            <p className="text-lg font-medium" style={{ color: "#94a3b8" }}>The only app with a real group money pool — not just a bill splitter.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Users size={26} />,
                title: "Upfront Money Pools",
                desc: "Everyone chips into a central pool before the trip. The Pool Admin holds the funds — no one person carries the financial burden alone.",
                iconBg: "#ede9fe", iconColor: "#7c3aed", cardBg: "rgba(237,233,254,0.45)"
              },
              {
                icon: <ShieldCheck size={26} />,
                title: "Transparent Ledger",
                desc: "Every contribution, every expense logged in real-time. The entire group sees exactly what was collected, spent, and what's left over.",
                iconBg: "#dbeafe", iconColor: "#2563eb", cardBg: "rgba(219,234,254,0.45)"
              },
              {
                icon: <Zap size={26} />,
                title: "Instant UPI Settling",
                desc: "Trip over? Settle refunds and balances with one click, routed directly to UPI IDs. Zero copy-pasting bank details.",
                iconBg: "#d1fae5", iconColor: "#059669", cardBg: "rgba(209,250,229,0.45)"
              },
              {
                icon: <CreditCard size={26} />,
                title: "Pool Admin Control",
                desc: "The group can assign any member as the Pool Admin. Admins approve expenses and manage the target amount — not just whoever made the group.",
                iconBg: "#ffe4e6", iconColor: "#e11d48", cardBg: "rgba(255,228,230,0.45)"
              },
              {
                icon: <Sparkles size={26} />,
                title: "Split Mode Too",
                desc: "Not pooling? Use classic split mode to track shared dinners, rent, or any expense and get exact individual balances.",
                iconBg: "#fef3c7", iconColor: "#d97706", cardBg: "rgba(254,243,199,0.45)"
              },
              {
                icon: <ArrowRight size={26} />,
                title: "Invite by Code",
                desc: "Each user gets a unique invite code. Share it over WhatsApp or SMS. Friends join in seconds — no account needed to receive money.",
                iconBg: "#f0fdf4", iconColor: "#15803d", cardBg: "rgba(240,253,244,0.45)"
              },
            ].map((f) => (
              <div
                key={f.title}
                className="p-7 rounded-3xl transition-all duration-300 cursor-default card-hover"
                style={{ background: f.cardBg, border: "1px solid rgba(255,255,255,0.75)", backdropFilter: "blur(16px)" }}
              >
                <div className="w-13 h-13 rounded-2xl flex items-center justify-center mb-5" style={{ background: f.iconBg, color: f.iconColor, width: "52px", height: "52px" }}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: "#1e1b4b" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="py-20 px-6 text-center">
        <div
          className="max-w-2xl mx-auto py-14 px-8 rounded-[2.5rem] space-y-6"
          style={{ background: "linear-gradient(135deg,#7c3aed 0%,#a78bfa 60%,#60a5fa 100%)", boxShadow: "0 20px 60px rgba(124,58,237,0.35)" }}
        >
          <h2 className="font-black text-4xl text-white tracking-tight">Ready to trip smarter?</h2>
          <p className="text-lg text-white/75 font-medium">Join your friends. Create your first pool. Goa awaits.</p>
          <button
            onClick={onLoginClick}
            className="inline-flex items-center gap-2 bg-white font-black text-base px-8 py-4 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95"
            style={{ color: "#7c3aed" }}
          >
            Create your pool
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-6 text-center" style={{ borderTop: "1px solid rgba(167,139,250,0.15)" }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span style={{ fontSize: "20px" }}>🌴</span>
          <span className="font-black text-lg tracking-tight" style={{ color: "#1e1b4b" }}>Pool-n-Pay</span>
        </div>
        <p className="text-sm font-medium" style={{ color: "#94a3b8" }}>© {new Date().getFullYear()} Pool-n-Pay · Built for travellers, by travellers.</p>
      </footer>
    </div>
  );
};
