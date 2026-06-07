import { useState, useEffect } from "react";
import { X, Download, Share } from "lucide-react";

interface PwaInstallBannerProps {
  page?: "dashboard" | "profile";
}

export function PwaInstallBanner({ page = "dashboard" }: PwaInstallBannerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Already running as installed PWA?
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    // iOS detection
    const ua = window.navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);

    // Check if already dismissed permanently
    const wasDismissed = localStorage.getItem("pnp_pwa_dismissed");
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // For Android/Desktop: pick up the globally captured prompt from main.tsx
    // (beforeinstallprompt fires before React mounts, so we stored it on window)
    const checkPrompt = () => {
      const captured = (window as any).__pwaInstallPrompt;
      if (captured) setDeferredPrompt(captured);
    };
    checkPrompt();

    // Also listen in case it fires after mount (rare but possible)
    const handler = (e: Event) => {
      e.preventDefault();
      (window as any).__pwaInstallPrompt = e;
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      (window as any).__pwaInstallPrompt = null;
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
        (window as any).__pwaInstallPrompt = null;
        setDeferredPrompt(null);
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("pnp_pwa_dismissed", "1");
  };

  // Hide if: already installed, running standalone, or user dismissed
  if (isStandalone || installed || dismissed) return null;

  // On Android/Desktop — only show if we have the native prompt captured
  if (!isIOS && !deferredPrompt) return null;

  const isProfile = page === "profile";

  return (
    <div
      className={`relative overflow-hidden rounded-3xl animate-slide-up ${isProfile ? "" : "mx-4 mt-4"}`}
      style={{
        background: "linear-gradient(135deg, rgba(124,58,237,0.10) 0%, rgba(167,139,250,0.06) 100%)",
        border: "1px solid rgba(124,58,237,0.18)",
      }}
    >
      {/* Decorative glow blobs */}
      <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-violet-300/20 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-3 -left-3 w-16 h-16 rounded-full bg-indigo-300/15 blur-xl pointer-events-none" />

      <div className="relative p-4">
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center hover:bg-violet-100 active:scale-90 transition-all"
          style={{ color: "#7c3aed" }}
          aria-label="Dismiss install banner"
        >
          <X size={13} />
        </button>

        {/* Header row */}
        <div className="flex items-center gap-3 pr-7">
          <div
            className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center shadow-md"
            style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)" }}
          >
            <span style={{ fontSize: 20 }}>🌴</span>
          </div>
          <div>
            <p className="font-black text-sm" style={{ color: "#1e1b4b" }}>
              Install Pool-n-Pay
            </p>
            <p className="text-xs font-medium" style={{ color: "#7c3aed" }}>
              Add to Home Screen — free, no App Store
            </p>
          </div>
        </div>

        {/* iOS: step-by-step guide */}
        {isIOS ? (
          <div className="mt-3 rounded-2xl p-3 space-y-2" style={{ background: "rgba(124,58,237,0.06)" }}>
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#6d28d9" }}>
              How to install on iPhone / iPad
            </p>
            {[
              { emoji: "1️⃣", text: "Open this page in Safari (not Chrome)" },
              { emoji: "2️⃣", text: "Tap the Share icon  at the bottom" },
              { emoji: "3️⃣", text: "Scroll & tap \"Add to Home Screen\"" },
              { emoji: "✅", text: "Tap \"Add\" — done!" },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="text-base leading-none">{step.emoji}</span>
                <span className="text-xs font-semibold" style={{ color: "#4c1d95" }}>
                  {step.text}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 pt-1">
              <Share size={11} style={{ color: "#7c3aed" }} />
              <span className="text-[10px] font-bold" style={{ color: "#7c3aed" }}>
                Safari → Share → Add to Home Screen
              </span>
            </div>
          </div>
        ) : (
          /* Android / Desktop: one-tap install */
          <button
            onClick={handleInstall}
            disabled={installing}
            className="mt-3 w-full py-2.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg,#7c3aed,#a78bfa)",
              boxShadow: "0 4px 14px rgba(124,58,237,0.30)",
            }}
          >
            <Download size={14} />
            {installing ? "Installing…" : "Install App — It's Free!"}
          </button>
        )}
      </div>
    </div>
  );
}
