import React, { useState } from "react";
import { Mail, Lock, User, ArrowRight, CheckCircle, Smartphone, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { dbService } from "../lib/firebaseClient";

interface AuthProps {
  onAuthSuccess: () => void;
  onBack?: () => void;
}

export default function Auth({ onAuthSuccess, onBack }: AuthProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (password.length < 6) throw new Error("Password must be at least 6 characters.");
      if (mode === "signup") {
        if (!name.trim()) throw new Error("Please enter your name.");
        if (!upiId.trim() || !upiId.includes("@")) throw new Error("Please enter a valid UPI ID (e.g. name@okhdfc).");
        const { error: signUpError } = await dbService.signUp(email, password, name, upiId);
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await dbService.signInWithPassword(email, password);
        if (signInError) throw signInError;
      }
      setSuccess(true);
      setTimeout(() => onAuthSuccess(), 800);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const { error: googleError } = await dbService.signInWithGoogle();
      if (googleError) throw googleError;
      setSuccess(true);
      setTimeout(() => onAuthSuccess(), 800);
    } catch (err: any) {
      setError(err?.message || "Something went wrong during Google Login.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-xl py-3 pl-10 pr-4 text-sm font-medium transition-all focus:outline-none focus:ring-2";
  const inputStyle = {
    background: "rgba(255,255,255,0.65)",
    border: "1px solid rgba(167,139,250,0.25)",
    color: "#1e1b4b",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#f5f3ff 0%,#ede9fe 35%,#dbeafe 70%,#e0f2fe 100%)" }}
    >
      {/* Ambient blobs */}
      <div className="blob w-80 h-80 bg-violet-300 top-[-5rem] left-[-5rem]" />
      <div className="blob w-72 h-72 bg-sky-200 bottom-[-4rem] right-[-4rem]" />
      <div className="blob w-56 h-56 bg-pink-200 top-1/3 right-0" />

      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm transition-all hover:scale-105 active:scale-95"
          style={{ background: "rgba(255,255,255,0.65)", color: "#7c3aed", border: "1px solid rgba(167,139,250,0.25)", backdropFilter: "blur(12px)" }}
        >
          <ArrowLeft size={16} />
          Back
        </button>
      )}

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md rounded-3xl p-8 animate-slide-up"
        style={{ background: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.85)", backdropFilter: "blur(24px)", boxShadow: "0 16px 60px rgba(124,58,237,0.12)" }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg" style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)" }}>
            <span style={{ fontSize: "26px" }}>🌴</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "#1e1b4b" }}>Pool-n-Pay</h1>
          <p className="text-sm font-medium mt-1" style={{ color: "#94a3b8" }}>
            {mode === "signin" ? "Welcome back 👋" : "Create your account"}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex p-1 rounded-2xl mb-6" style={{ background: "rgba(237,233,254,0.6)" }}>
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); setSuccess(false); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={
                mode === m
                  ? { background: "white", color: "#7c3aed", boxShadow: "0 2px 8px rgba(124,58,237,0.15)" }
                  : { color: "#94a3b8" }
              }
            >
              {m === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Success */}
        {success ? (
          <div className="flex flex-col items-center justify-center py-10 animate-scale-in">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "#d1fae5" }}>
              <CheckCircle className="w-9 h-9" style={{ color: "#059669" }} />
            </div>
            <h2 className="text-xl font-black mb-1" style={{ color: "#1e1b4b" }}>Welcome aboard! 🎉</h2>
            <p className="text-sm font-medium" style={{ color: "#94a3b8" }}>Setting up your dashboard…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {mode === "signup" && (
              <>
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
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#a78bfa" }} />
                  <input
                    type="text"
                    placeholder="UPI ID (e.g. name@okhdfc)"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    required
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#a78bfa" }} />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
                style={inputStyle}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#a78bfa" }} />
              <input
                type={showPw ? "text" : "password"}
                placeholder="Password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputClass + " pr-10"}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                style={{ color: "#a78bfa" }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div className="text-sm p-3 rounded-xl text-center font-medium animate-scale-in" style={{ background: "#ffe4e6", color: "#e11d48", border: "1px solid #fecdd3" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)", boxShadow: "0 6px 20px rgba(124,58,237,0.35)" }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "signin" ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center my-1.5">
              <div className="flex-1 h-px bg-slate-200/60" />
              <span className="px-3 text-slate-400 text-xs font-bold uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-slate-200/60" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              style={{
                background: "white",
                color: "#1e1b4b",
                border: "1px solid rgba(167,139,250,0.25)",
                boxShadow: "0 4px 12px rgba(124,58,237,0.04)"
              }}
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.58 14.98 1 12 1 7.35 1 3.37 3.65 1.42 7.5l3.85 2.99C6.2 7.53 8.88 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.47c-.28 1.48-1.12 2.74-2.38 3.58l3.69 2.87c2.16-1.99 3.4-4.92 3.4-8.54z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.49c-.25-.74-.39-1.53-.39-2.34s.14-1.6.39-2.34L1.42 6.82C.6 8.46.14 10.18.14 12s.46 3.54 1.28 5.18l3.85-2.69z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.08 7.96-2.92l-3.69-2.87c-1.02.68-2.33 1.09-3.95 1.09-3.12 0-5.8-2.49-6.73-5.45L1.74 15.54C3.69 19.39 7.68 23 12 23z"
                />
              </svg>
              Continue with Google
            </button>
          </form>
        )}

        {/* Footer hint */}
        {!success && (
          <p className="text-center text-xs mt-5 font-medium" style={{ color: "#94a3b8" }}>
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }} className="font-bold" style={{ color: "#7c3aed" }}>
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
