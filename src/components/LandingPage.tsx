import React, { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, Zap, Users } from "lucide-react";

interface LandingPageProps {
  onLoginClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-200">
      {/* ─── HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
              <span className="text-xl">🌴</span>
            </div>
            <span className="font-black text-xl text-slate-900 tracking-tight">Pool-n-Pay</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onLoginClick}
              className="hidden md:block text-slate-600 hover:text-slate-900 font-semibold px-4 py-2 transition-colors"
            >
              Log in
            </button>
            <button
              onClick={onLoginClick}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-full font-bold shadow-md shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="pt-40 pb-20 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          
          <div className="space-y-8 transition-all duration-1000 opacity-100 translate-y-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-sm mx-auto">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              The smartest way to travel
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
              Split like <span className="text-slate-400">Splitwise</span>.<br />
              Pool like <span className="text-emerald-500">nobody else</span>.
            </h1>
            
            <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
              Stop fronting money for your friends. Pool funds upfront for trips, track every expense with an audit ledger, and settle instantly with UPI.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <button
                onClick={onLoginClick}
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-slate-900/20 transition-all hover:scale-105 active:scale-95"
              >
                Start Pooling
                <ArrowRight size={20} />
              </button>
              <button
                onClick={onLoginClick}
                className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-200 px-8 py-4 rounded-full font-bold text-lg transition-all active:scale-95"
              >
                Log in
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES SECTION ─── */}
      <section className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">Built for the Group Chat.</h2>
            <p className="text-lg text-slate-500 font-medium">Everything you need to never argue about money again.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <Users className="text-emerald-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Upfront Money Pools</h3>
              <p className="text-slate-600 leading-relaxed">
                Everyone chips into a central pool before the trip starts. The Pool Admin holds the funds safely, so no one carries the credit card burden.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="text-teal-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Transparent Ledger</h3>
              <p className="text-slate-600 leading-relaxed">
                As the Admin spends the pooled money, every expense is logged. Everyone sees exactly what was collected, spent, and what's left over.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="text-indigo-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Instant UPI Settling</h3>
              <p className="text-slate-600 leading-relaxed">
                When the trip is over, settle remaining balances instantly with integrated UPI IDs. No more copying and pasting bank details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-12 bg-slate-900 text-center px-6">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-2xl">🌴</span>
          <span className="font-black text-xl text-white tracking-tight">Pool-n-Pay</span>
        </div>
        <p className="text-slate-500 font-medium">© {new Date().getFullYear()} Pool-n-Pay. The smartest travel companion.</p>
      </footer>
    </div>
  );
};
