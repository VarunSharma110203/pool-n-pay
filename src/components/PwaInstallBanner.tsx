import { useState, useEffect } from "react";
import { X, Download, Share, ArrowUpFromLine } from "lucide-react";

interface PwaInstallBannerProps {
  /** Where it's placed — slight style variation */
  page?: "dashboard" | "profile";
}

export function PwaInstallBanner({ page = "dashboard" }: PwaInstallBannerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already running as an installed standalone app
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Detect iOS (Safari) — no beforeinstallprompt support
    const ua = window.navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(ios);

    // Already dismissed this session?
    const dismissed = sessionStorage.getItem("pnp_pwa_dismissed");
    if (dismissed) return;

    if (standalone) return; // Already installed, no need to show banner

    if (ios) {
      // Show iOS manual install guide after a short delay
      const t = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(t);
    }

    // Android / Desktop — listen for browser's native install event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 2000);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Listen for successful app installation
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setShowBanner(false);
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
        setShowBanner(false);
      }
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem("pnp_pwa_dismissed", "1");
  };

  // Don't render if: already installed, already running standalone, or banner is hidden
  if (isStandalone || installed || !showBanner) return null;

  const isProfile = page === "profile";

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border shadow-lg animate-slide-up ${
        isProfile
          ? "mx-0 mt-0"
          : "mx-4 mt-4"
      }`}
      style={{
        background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(167,139,250,0.08) 100%)",
        border: "1px solid rgba(124,58,237,0.2)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      {/* Decorative glow */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-violet-400/20 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-indigo-400/15 blur-2xl pointer-events-none" />

      <div className="relative p-4">
        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:bg-violet-100 active:scale-90"
          style={{ color: "#7c3aed" }}
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>

        <div className="flex items-start gap-3 pr-6">
          {/* App icon */}
          <div
            className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
            style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)" }}
          >
            <span style={{ fontSize: 22 }}>🌴</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-black text-sm leading-tight" style={{ color: "#1e1b4b" }}>
              Install Pool-n-Pay
            </p>
            <p className="text-xs font-medium mt-0.5" style={{ color: "#7c3aed" }}>
              Add to your home screen — free, no App Store needed
            </p>
          </div>
        </div>

        {/* iOS Instructions */}
        {isIOS ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold" style={{ color: "#6d28d9" }}>
              To install on iPhone / iPad:
            </p>
            <div className="flex flex-col gap-1.5">
              {[
                { icon: <Share size={13} />, text: "Tap the Share icon in Safari's toolbar" },
                { icon: <ArrowUpFromLine size={13} />, text: "Scroll down and tap \"Add to Home Screen\"" },
                { icon: <span style={{ fontSize: 13 }}>✅</span>, text: "Tap \"Add\" to install the app" },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(124,58,237,0.12)", color: "#7c3aed" }}
                  >
                    {step.icon}
                  </div>
                  <span className="text-xs font-medium" style={{ color: "#4c1d95" }}>
                    {step.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Android / Desktop: One-tap install button */
          <button
            onClick={handleInstall}
            disabled={installing || !deferredPrompt}
            className="mt-3 w-full py-2.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg,#7c3aed,#a78bfa)",
              boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
            }}
          >
            <Download size={15} />
            {installing ? "Installing…" : "Install App — It's Free!"}
          </button>
        )}
      </div>
    </div>
  );
}
