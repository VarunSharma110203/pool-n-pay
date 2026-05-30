import React, { useState } from "react";
import { Mail, Lock, User, ArrowRight, ShieldCheck, CheckCircle, Smartphone } from "lucide-react";
import { dbService } from "../lib/firebaseClient";

interface AuthProps {
  onAuthSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

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
      setTimeout(() => {
        onAuthSuccess();
      }, 800);
      
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans relative overflow-hidden">
      {/* Background gradients for sleek fintech look */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

      <div className="glass-dark w-full max-w-[420px] rounded-[24px] p-8 shadow-2xl relative z-10 animate-slide-up">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-600/30">
            <ShieldCheck className="text-white w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Pool-n-Pay</h1>
          <p className="text-sm text-slate-400">Secure travel money companion</p>
        </div>

        {/* Toggle */}
        <div className="flex bg-slate-800/50 p-1 rounded-xl mb-6">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError("");
                setSuccess(false);
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === m ? "bg-slate-700 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {m === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Form */}
        {success ? (
          <div className="flex flex-col items-center justify-center py-8 animate-scale-in">
            <CheckCircle className="w-16 h-16 text-emerald-400 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Welcome aboard!</h2>
            <p className="text-emerald-400/80 text-sm">Authenticating securely...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {mode === "signup" && (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  />
                </div>
                
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="UPI ID (e.g. name@okhdfc)"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    required
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                placeholder="Password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
              />
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-3 rounded-lg text-center animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "signin" ? "Secure Login" : "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
