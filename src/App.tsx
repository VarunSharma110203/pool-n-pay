import { useState, useEffect } from "react";
import { Home, Map, Users, Compass, User } from "lucide-react";
import { Auth } from "./components/Auth";
import { SplashScreen } from "./components/SplashScreen";
import { Onboarding } from "./components/Onboarding";
import Index from "./pages/Index";
import Trips from "./pages/Trips";
import Friends from "./pages/Friends";
import Profile from "./pages/Profile";
import { TravelSearch } from "./components/TravelSearch";
import { ItineraryGenerator } from "./components/ItineraryGenerator";
import { dbService, isFirstVisit, markOnboarded } from "./lib/supabaseClient";

type TabName = "home" | "trips" | "friends" | "explore" | "profile";

const NAV_ITEMS: { id: TabName; label: string; icon: React.ElementType; emoji: string }[] = [
  { id: "home",    label: "Home",    icon: Home,    emoji: "🏠" },
  { id: "trips",   label: "Groups",  icon: Map,     emoji: "🗺️" },
  { id: "friends", label: "Friends", icon: Users,   emoji: "👥" },
  { id: "explore", label: "Explore", icon: Compass, emoji: "🧭" },
  { id: "profile", label: "Profile", icon: User,    emoji: "🙂" },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn]   = useState(false);
  const [profile, setProfile]         = useState<any>(null);
  const [activeTab, setActiveTab]     = useState<TabName>("home");
  const [loading, setLoading]         = useState(true);
  const [showSplash, setShowSplash]   = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [splashDone, setSplashDone]   = useState(false);
  const [exploreTab, setExploreTab]   = useState<"travel" | "itinerary">("travel");
  const [pendingCount, setPendingCount] = useState(0);

  // ─── Auth / DB ───────────────────────────────────────────────────────────────

  const checkAuth = async () => {
    try {
      const session = await dbService.getSession();
      if (session?.user) {
        const prof = await dbService.getProfile();
        setProfile(prof);
        setIsLoggedIn(true);

        // Count pending friend requests
        try {
          const friends = await dbService.getFriends();
          const pending = (friends || []).filter((f: any) => f.status === "pending_received").length;
          setPendingCount(pending);
        } catch {
          // non-critical
        }

        // Splash for first visit
        if (isFirstVisit()) {
          setShowSplash(true);
        } else {
          setSplashDone(true);
        }
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const handleAuthChange = () => checkAuth();
    const handleDbChange   = () => checkAuth();

    window.addEventListener("pool_n_pay_auth_change", handleAuthChange);
    window.addEventListener("pool_n_pay_db_change",   handleDbChange);
    return () => {
      window.removeEventListener("pool_n_pay_auth_change", handleAuthChange);
      window.removeEventListener("pool_n_pay_db_change",   handleDbChange);
    };
  }, []);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleSplashComplete = () => {
    setShowSplash(false);
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = () => {
    markOnboarded();
    setShowOnboarding(false);
    setSplashDone(true);
  };

  const handleProfileUpdated = async () => {
    try {
      const prof = await dbService.getProfile();
      setProfile(prof);
    } catch (err) {
      console.error("Profile refresh failed:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await dbService.signOut();
    } catch { /* ignore */ }
    setIsLoggedIn(false);
    setProfile(null);
    setActiveTab("home");
    setSplashDone(false);
    setShowSplash(false);
    setPendingCount(0);
  };

  // ─── Page Content ────────────────────────────────────────────────────────────

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <Index
            profile={profile}
            onNavigate={(tab) => setActiveTab(tab as TabName)}
          />
        );
      case "trips":
        return <Trips profile={profile} />;
      case "friends":
        return <Friends profile={profile} />;
      case "explore":
        return (
          <div className="flex flex-col h-full">
            {/* Sub-tab switcher */}
            <div className="flex items-center gap-1 px-4 pt-4 pb-2 md:pt-2">
              <button
                onClick={() => setExploreTab("travel")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                  exploreTab === "travel"
                    ? "gradient-ocean text-white shadow-md"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                ✈️ Travel Search
              </button>
              <button
                onClick={() => setExploreTab("itinerary")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                  exploreTab === "itinerary"
                    ? "gradient-ocean text-white shadow-md"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                🤖 AI Itinerary
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {exploreTab === "travel" ? (
                <TravelSearch />
              ) : (
                <ItineraryGenerator />
              )}
            </div>
          </div>
        );
      case "profile":
        return (
          <Profile
            profile={profile}
            onProfileUpdated={handleProfileUpdated}
            onLogout={handleLogout}
          />
        );
      default:
        return null;
    }
  };

  // ─── Breadcrumb title ────────────────────────────────────────────────────────

  const currentNav = NAV_ITEMS.find((n) => n.id === activeTab);
  const pageTitle  = currentNav ? `${currentNav.emoji} ${currentNav.label}` : "";

  // ─── Guards ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f4f7f6" }}>
        <div className="flex flex-col items-center gap-5">
          <div className="gradient-tropical w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl animate-glow">
            <span style={{ fontSize: "36px" }}>🌴</span>
          </div>
          <div className="text-center space-y-1">
            <p className="text-slate-800 font-black text-xl tracking-tight">Pool-n-Pay</p>
            <p className="text-teal-600 font-semibold text-sm">Loading your oasis...</p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Auth onAuthSuccess={checkAuth} />;
  }

  if (showSplash && !splashDone) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // ─── Main Layout ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex" style={{ background: "#f4f7f6" }}>

      {/* ═══════════════════════════════════════════════════════════════════════
          DESKTOP SIDEBAR
      ════════════════════════════════════════════════════════════════════════ */}
      <aside className="hidden md:flex flex-col gradient-jungle fixed left-0 top-0 bottom-0 w-72 z-20 overflow-hidden">

        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-1/2 -left-10 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />

        {/* Logo area */}
        <div className="px-6 pt-8 pb-6 flex items-center gap-4 relative">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shadow-lg backdrop-blur-sm border border-white/10 flex-shrink-0">
            <span style={{ fontSize: "24px" }}>🌴</span>
          </div>
          <div>
            <p className="text-white font-black text-lg leading-tight tracking-tight">Pool-n-Pay</p>
            <p className="text-white/50 text-xs font-medium tracking-wide">Travel Money</p>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-white/10 mb-4" />

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 group relative ${
                  isActive
                    ? "bg-white/15 text-white border border-white/10 shadow-sm"
                    : "text-white/55 hover:text-white hover:bg-white/8 border border-transparent"
                }`}
              >
                <Icon
                  size={18}
                  className={`transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-105"}`}
                />
                <span className="flex-1 text-left">{label}</span>

                {/* Pending badge for Friends */}
                {id === "friends" && pendingCount > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black shadow-md">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}

                {/* Active indicator pip */}
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-6 h-px bg-white/10 mt-4 mb-4" />

        {/* Bottom profile card */}
        {profile && (
          <div className="mx-3 mb-4 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-sunset flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-white font-black text-base">
                  {(profile.full_name || profile.email || "U")[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-tight truncate">
                  {profile.full_name || "Traveler"}
                </p>
                {profile.upi_id && (
                  <p className="text-white/45 text-[11px] font-medium truncate mt-0.5">
                    {profile.upi_id}
                  </p>
                )}
              </div>
            </div>

            {/* Status indicator */}
            <div className="mt-3 flex items-center justify-end gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse" />
              <span className="text-white/40 text-[10px] font-semibold tracking-wide">Sandbox</span>
            </div>
          </div>
        )}
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col md:ml-72 min-h-screen">

        {/* 4. Onboarding Carousel */}
        {!showSplash && showOnboarding && (
          <Onboarding onComplete={handleOnboardingComplete} />
        )}

        {/* 5. Main App Dashboard */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white/70 backdrop-blur-md border-b border-gray-100/80 sticky top-0 z-10">
          <div>
            <h1 className="text-slate-800 font-black text-xl tracking-tight">{pageTitle}</h1>
            <p className="text-slate-400 text-xs font-medium mt-0.5">
              {activeTab === "explore" ? (exploreTab === "travel" ? "Search flights & stays" : "AI-powered trip planning") : "Pool-n-Pay"}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-700 text-xs font-bold">Connected</span>
          </div>
        </header>

        {/* Page content */}
        <main
          className={`flex-1 overflow-y-auto pb-24 md:pb-8 ${
            activeTab === "explore" ? "" : "px-0"
          }`}
        >
          {renderContent()}
        </main>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MOBILE BOTTOM NAV
      ════════════════════════════════════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-lg z-30">
        <div className="flex justify-around items-center py-2 px-1 safe-area-bottom">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex flex-col items-center gap-0.5 flex-1 relative py-1 group"
              >
                {/* Icon wrapper */}
                <div
                  className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-teal-50 scale-110"
                      : "bg-transparent group-active:bg-gray-100"
                  }`}
                >
                  <Icon
                    size={18}
                    className={`transition-colors duration-200 ${
                      isActive ? "text-teal-600" : "text-gray-400 group-hover:text-gray-600"
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />

                  {/* Friends pending badge */}
                  {id === "friends" && pendingCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black shadow-sm">
                      {pendingCount > 9 ? "9+" : pendingCount}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] font-bold transition-colors duration-200 ${
                    isActive ? "text-teal-600" : "text-gray-400"
                  }`}
                >
                  {label}
                </span>

                {/* Active dot indicator */}
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-teal-500" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
