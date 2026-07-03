import { useState, useEffect, useCallback } from "react";
import {
  Share2,
  MessageCircle,
  MessageSquare,
  Link2,
  UserPlus,
  Search,
  CheckCircle,
  X,
} from "lucide-react";
import { dbService, getInviteCode } from "../lib/firebaseClient";
import { GroupDetail } from "../components/GroupDetail";

interface Friend {
  id: string;
  name: string;
  avatar: string;
  upi_id?: string;
  status: "friend" | "pending_sent" | "pending_received";
}

interface Props {
  profile: { name: string; upi_id: string; avatar: string };
}

const SIMULATED_USERS = [
  { name: "Rohit Verma", emoji: "🧔" },
  { name: "Anjali Singh", emoji: "👩" },
  { name: "Karan Mehta", emoji: "🧑" },
  { name: "Sneha Patel", emoji: "👩‍🦱" },
  { name: "Dev Sharma", emoji: "👨‍💻" },
  { name: "Nisha Kapoor", emoji: "👩‍🎨" },
  { name: "Akash Gupta", emoji: "🧑‍🚀" },
  { name: "Priya Nair", emoji: "👩‍🔬" },
  { name: "Ravi Kumar", emoji: "👨‍🍳" },
  { name: "Tanya Roy", emoji: "👩‍🎤" },
];



function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function AvatarCircle({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "w-9 h-9 text-sm" : size === "lg" ? "w-14 h-14 text-xl" : "w-11 h-11 text-base";
  return (
    <div
      className={`${sizeClass} rounded-full gradient-tropical flex items-center justify-center text-white font-bold flex-shrink-0`}
    >
      {getInitials(name)}
    </div>
  );
}

export default function Friends({ profile }: Props) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; avatar: string; upi_id: string; isReal?: boolean; isAlreadyFriend?: boolean }>>([]);
  const [toast, setToast] = useState({ message: "", show: false });
  const [addingId, setAddingId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [friendBalances, setFriendBalances] = useState<{ [name: string]: { label: string; positive: boolean | null; amount: number } }>({});

  const handleFriendClick = async (friendName: string) => {
    try {
      if ((dbService as any).getOrCreateDirectGroup) {
        const directGroup = await (dbService as any).getOrCreateDirectGroup(friendName);
        setActiveGroupId(directGroup.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const code = getInviteCode();
  const inviteLink = `${window.location.origin}/?code=${code}`;
  const inviteText = `Hey! 🌴 Join me on Pool-n-Pay to split our expenses!\n\nMy invite code: ${code}\n${inviteLink}`;

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: "", show: false }), 2500);
  };

  const loadFriends = useCallback(async () => {
    try {
      const data = await dbService.getFriends();
      setFriends(data);
      if ((dbService as any).getFriendBalances) {
        const fb = await (dbService as any).getFriendBalances();
        setFriendBalances(fb);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFriends();
    const handler = () => loadFriends();
    window.addEventListener("pool_n_pay_db_change", handler);
    return () => window.removeEventListener("pool_n_pay_db_change", handler);
  }, [loadFriends]);

  // Find user by invite code or search simulated sandbox users
  useEffect(() => {
    let active = true;
    const term = searchQuery.trim();
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const results: any[] = [];

        // 1. Try to find real user by invite code (usually 6 characters)
        if (term.length === 6) {
          const realUser = await (dbService as any).findUserByInviteCode(term);
          if (realUser) {
            results.push({
              id: realUser.id,
              name: realUser.name,
              avatar: realUser.avatar,
              upi_id: realUser.upi_id,
              isReal: true,
              isAlreadyFriend: realUser.isAlreadyFriend
            });
          }
        }

        // 2. Fallback / sandbox simulated user search by name
        const q = term.toLowerCase();
        const existingFriendNames = new Set(friends.map(f => f.name.toLowerCase()));

        const simResults = SIMULATED_USERS.filter(
          (u) => u.name.toLowerCase().includes(q) && !existingFriendNames.has(u.name.toLowerCase())
        ).map(u => ({
          id: `sim-${u.name}`,
          name: u.name,
          avatar: u.emoji,
          upi_id: `${u.name.replace(/\s+/g,"").toLowerCase()}@upi`,
          isReal: false,
          isAlreadyFriend: false
        }));

        if (active) {
          const realNames = new Set(results.map(r => r.name.toLowerCase()));
          const filteredSim = simResults.filter(s => !realNames.has(s.name.toLowerCase()));
          setSearchResults([...results, ...filteredSim]);
        }
      } catch (err) {
        console.error("Invite code lookup failed:", err);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(delayDebounce);
    };
  }, [searchQuery, friends]);

  const handleAddFriend = async (name: string, upiId?: string) => {
    setAddingId(name);
    try {
      await dbService.addFriendRequest(name, upiId);
      showToast(`Request sent to ${name} 🌴`);
      setSearchQuery("");
      await loadFriends();
    } catch {
      showToast("Failed to send request");
    } finally {
      setAddingId(null);
    }
  };

  const handleAccept = async (id: string, name: string) => {
    setAcceptingId(id);
    try {
      await dbService.acceptFriend(id);
      showToast(`${name} joined your tribe! 🎉`);
      await loadFriends();
    } catch {
      showToast("Failed to accept request");
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDecline = async (id: string, name: string) => {
    try {
      await dbService.removeFriend(id);
      showToast(`Declined request from ${name}`);
      await loadFriends();
    } catch {
      showToast("Failed to decline request");
    }
  };

  const actualFriends = friends.filter((f) => f.status === "friend");
  const pendingReceived = friends.filter((f) => f.status === "pending_received");

  if (activeGroupId) {
    return (
      <GroupDetail
        groupId={activeGroupId}
        onBack={() => setActiveGroupId(null)}
        profile={profile}
      />
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="gradient-tropical px-5 pt-12 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Your Tribe 🌴</h1>
            <p className="text-white/70 text-sm mt-1">
              {actualFriends.length === 0
                ? "No friends yet — start inviting!"
                : `${actualFriends.length} friend${actualFriends.length !== 1 ? "s" : ""} in your crew`}
            </p>
          </div>
          <AvatarCircle name={profile.name} size="md" />
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Invite Card */}
        <div className="card rounded-3xl p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center">
              <Share2 className="w-4 h-4 text-teal-600" />
            </div>
            <h2 className="font-bold text-slate-900 text-base">Invite Friends</h2>
          </div>

          {/* Invite Code */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
              <p className="text-xs text-teal-600 font-medium mb-0.5">Your Invite Code</p>
              <p className="font-mono font-black text-teal-700 text-lg tracking-widest">{code}</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(code);
                showToast("Code copied! 📋");
              }}
              className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center text-white hover:bg-teal-700 transition-colors flex-shrink-0"
            >
              <CheckCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Share buttons */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button
              onClick={() =>
                window.open("https://wa.me/?text=" + encodeURIComponent(inviteText), "_blank")
              }
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all active:scale-95"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs font-semibold">WhatsApp</span>
            </button>
            <button
              onClick={() =>
                (window.location.href =
                  "sms:?body=" + encodeURIComponent(`Hey! Join Pool-n-Pay with my code: ${code}`))
              }
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-blue-500 text-white hover:bg-blue-600 transition-all active:scale-95"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs font-semibold">SMS</span>
            </button>
            <button
              onClick={() =>
                navigator.clipboard
                  .writeText(inviteLink)
                  .then(() => showToast("Link copied! 🔗"))
              }
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-slate-500 text-white hover:bg-slate-600 transition-all active:scale-95"
            >
              <Link2 className="w-5 h-5" />
              <span className="text-xs font-semibold">Copy Link</span>
            </button>
          </div>

          {"contacts" in navigator && (
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-teal-200 text-teal-600 hover:bg-teal-50 transition-colors text-sm font-semibold">
              <UserPlus className="w-4 h-4" />
              Import from Contacts
            </button>
          )}
        </div>

        {/* Search & Add */}
        <div className="card rounded-3xl p-5 animate-fade-in delay-100">
          <h2 className="font-bold text-white text-base mb-3">Add Friend by Code</h2>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Friend's Invite Code (e.g. ABC123)"
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-semibold uppercase tracking-wider text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="mt-3 space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.name}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                >
                  <div className="w-10 h-10 rounded-full gradient-lagoon flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {user.avatar.length <= 2 ? user.avatar : getInitials(user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{user.name}</p>
                    <p className="text-xs text-slate-400">
                      {user.id.startsWith("sim-") ? "Simulated tribe member" : "Pool-n-Pay user"}
                    </p>
                  </div>
                  {user.isAlreadyFriend ? (
                    <span className="text-xs text-slate-400 font-bold px-3 py-1.5 bg-gray-100 rounded-xl">
                      Friends
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAddFriend(user.name, user.upi_id)}
                      disabled={addingId === user.name}
                      className="px-4 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors disabled:opacity-60"
                    >
                      {addingId === user.name ? "..." : "Add"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {searchQuery.trim().length >= 2 && searchResults.length === 0 && (
            <p className="text-center text-slate-400 text-sm mt-4 py-2">No users found</p>
          )}
        </div>

        {/* Pending Requests */}
        {pendingReceived.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-5 animate-fade-in delay-100">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-bold text-slate-900 text-base">Friend Requests</h2>
              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold">
                {pendingReceived.length}
              </span>
            </div>
            <div className="space-y-3">
              {pendingReceived.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20"
                >
                  <AvatarCircle name={req.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{req.name}</p>
                    <p className="text-xs text-slate-400">wants to join your tribe</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(req.id, req.name)}
                      disabled={acceptingId === req.id}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors disabled:opacity-60"
                    >
                      {acceptingId === req.id ? "..." : "Accept"}
                    </button>
                    <button
                      onClick={() => handleDecline(req.id, req.name)}
                      className="px-3 py-1.5 rounded-xl bg-gray-100 text-slate-600 text-xs font-bold hover:bg-gray-200 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="animate-fade-in delay-200">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="font-bold text-white text-lg">
              Friends{" "}
              <span className="text-slate-400 font-normal text-base">({actualFriends.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card rounded-2xl p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32" />
                      <div className="h-3 bg-gray-100 rounded w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : actualFriends.length === 0 ? (
            <div className="card rounded-3xl p-10 text-center">
              <div className="text-5xl mb-3">🌊</div>
              <p className="font-bold text-white text-lg">Your tribe is empty!</p>
              <p className="text-slate-400 text-sm mt-1">Start by inviting friends above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {actualFriends.map((friend) => {
                const balance = friendBalances[friend.name] || { label: "all settled ✨", positive: null };
                return (
                  <div
                    key={friend.id}
                    onClick={() => handleFriendClick(friend.name)}
                    className="card rounded-2xl p-4 flex items-center gap-3 hover:scale-[1.01] transition-all cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full gradient-tropical flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                      {getInitials(friend.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{friend.name}</p>
                      {friend.upi_id && (
                        <p className="text-xs text-slate-400 font-mono truncate">{friend.upi_id}</p>
                      )}
                      <p
                        className={`text-xs font-semibold mt-0.5 ${
                          balance.positive === true
                            ? "text-emerald-600"
                            : balance.positive === false
                            ? "text-rose-500"
                            : "text-slate-400"
                        }`}
                      >
                        {balance.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl text-sm font-semibold z-50 animate-slide-up">
          {toast.message}
        </div>
      )}
      </div>
    </div>
  );
}
