import React, { useState } from "react";
import { User, Smartphone, ArrowRight, LogOut, CheckCircle } from "lucide-react";
import { dbService } from "../lib/firebaseClient";

interface UpiOnboardingProps {
  profile: { name: string; email?: string; upi_id?: string };
  onComplete: () => void;
  onLogout: () => void;
}

export function UpiOnboarding({ profile, onComplete, onLogout }: UpiOnboardingProps) {
  const [name, setName] = useState(profile.name || "");
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!name.trim()) throw new Error("Please enter your name.");
      if (!upiId.trim() || !upiId.includes("@")) {
        throw new Error("Please enter a valid UPI ID (e.g. name@okhdfc).");
      }

      const updated = await dbService.updateProfile(name.trim(), upiId.trim());
      if (!updated) throw new Error("Failed to update profile. Please try again.");

      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-xl py-3 pl-10 pr-4 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-violet-400";
  const inputStyle = {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    color: "#f1f5f9",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden w-full gradient-page"
    >
      {/* Ambient blobs */}
      <div className="blob w-80 h-80 bg-violet-600/30 top-[-5rem] left-[-5rem]" />
      <div className="blob w-72 h-72 bg-orange-500/20 bottom-[-4rem] right-[-4rem]" />
      <div className="blob w-56 h-56 bg-pink-500/20 top-1/3 right-0" />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md rounded-3xl p-8 animate-slide-up card"
      >
        {/* Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg" style={{ background: "linear-gradient(135deg,#7c3aed,#f97316)" }}>
            <span style={{ fontSize: "26px" }}>🌴</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-center text-white">Complete Your Profile</h1>
          <p className="text-sm font-medium mt-2 text-center" style={{ color: "#94a3b8" }}>
            Just one quick step to get started with splitting and pooling money!
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-10 animate-scale-in">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "#d1fae5" }}>
              <CheckCircle className="w-9 h-9" style={{ color: "#059669" }} />
            </div>
            <h2 className="text-xl font-black mb-1" style={{ color: "#1e1b4b" }}>All set! 🚀</h2>
            <p className="text-sm font-medium" style={{ color: "#94a3b8" }}>Redirecting you to dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Display Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold px-1" style={{ color: "#4f46e5" }}>YOUR NAME</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#a78bfa" }} />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* UPI ID */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold px-1" style={{ color: "#4f46e5" }}>UPI ID (FOR SETTLEMENTS)</label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#a78bfa" }} />
                <input
                  type="text"
                  placeholder="e.g. name@okhdfc or 9876543210@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  required
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <p className="text-[11px] px-1 font-medium leading-relaxed" style={{ color: "#94a3b8" }}>
                This is where friends will send money when settling up with you.
              </p>
            </div>

            {error && (
              <div className="text-sm p-3 rounded-xl text-center font-medium animate-scale-in" style={{ background: "#ffe4e6", color: "#e11d48", border: "1px solid #fecdd3" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)", boxShadow: "0 6px 20px rgba(124,58,237,0.35)" }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Complete Setup
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Logout Link */}
        {!success && (
          <div className="flex justify-center mt-6">
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95"
              style={{ color: "#f43f5e" }}
            >
              <LogOut size={14} />
              Sign out / Use another account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
