import React, { useState } from "react";
import { Sparkles, Navigation, Calendar, DollarSign, Compass, RefreshCw, Copy, Check } from "lucide-react";

export const ItineraryGenerator: React.FC = () => {
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState("3");
  const [budget, setBudget] = useState("Moderate");
  const [vibe, setVibe] = useState("Beachy & Relaxed");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(itinerary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;

    setLoading(true);
    setError("");
    setItinerary("");

    try {
      const prompt = `Create a detailed tropical travel itinerary for visiting ${destination} for ${duration} days. 
      The budget is ${budget} and the overall group vibe is "${vibe}". 
      Here are custom interests and notes: ${notes || "None"}.
      
      Format the output in clean, beautiful Markdown. 
      Structure it with:
      - A tropical header introduction (including estimated group budget in INR)
      - Daily breakdowns (Day 1, Day 2, etc.)
      - Activity recommendations (specifically highlighting beach side spots, local food joints, and outdoor adventures)
      - "Top Island Secret/Tip" section
      
      Use friendly, lighthearted travel language. Start directly with the markdown content.`;

      const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`);

      if (!response.ok) {
        throw new Error("AI generation failed. Please try again.");
      }

      let text = await response.text();
      // Remove Pollinations deprecation warning if it exists
      text = text.replace(/⚠️ \*\*IMPORTANT NOTICE\*\* ⚠️[\s\S]*?continue to work normally\./g, "").trim();
      
      if (!text) {
        // Fallback mock itinerary if Pollinations blocks the browser request
        const isHillStation = destination.toLowerCase().match(/manali|shimla|leh|kashmir|swiss|alps|mount|hill/);
        const terrain = isHillStation ? "Mountain" : "Tropical";
        const welcome = isHillStation 
          ? "crisp mountain air, breathtaking peaks, and cozy fireside chats"
          : "crystal clear waters, breathtaking sunsets, and unforgettable adventures";
        const morning1 = isHillStation
          ? "Touch down and check into your mountain-view stay. Grab a hot tea and stretch your legs."
          : "Touch down and check into your beachfront stay. Grab a fresh coconut water and stretch your legs on the sand.";
        const afternoon1 = isHillStation
          ? "Head to the main town square for a casual group lunch. Highly recommend the local hot momos and thukpa!"
          : "Head to the main beach for a casual group lunch at a local shack. Highly recommend the fresh grilled fish and tropical fruit platters!";
        
        text = `## 🏔️ Your Ultimate ${duration}-Day ${terrain} Escape to ${destination}!\n\n> **Budget:** ${budget} | **Vibe:** ${vibe}\n\nGet ready for ${welcome}. Here is your curated group itinerary!\n\n---\n\n### 🌅 Day 1: Arrival & Local Vibes\n- **Morning:** ${morning1}\n- **Afternoon:** ${afternoon1}\n- **Evening:** Sunset watching from a scenic viewpoint. Grab some drinks and enjoy the golden hour. Finish with a relaxed dinner under the stars.\n\n### 🏃‍♂️ Day 2: Adventure Awaits\n- **Morning:** Early wake-up for a group trek or sightseeing session. The views are clearest in the morning!\n- **Afternoon:** Rent scooters and explore the hidden trails and viewpoints around the area. Pack some local snacks for a picnic.\n- **Evening:** ${vibe === "Nightlife & Party" ? "Time to hit the famous local bars! Dance the night away." : "A quiet bonfire with acoustic music and good conversations."}\n\n### 🎒 Day 3: Culture & Departure\n- **Morning:** Visit a local market or temple to soak in the culture. Buy some souvenirs and local spices.\n- **Afternoon:** One last scenic walk followed by a heavy, delicious local feast.\n- **Evening:** Pack up and head home. Start planning your next trip on Pool-n-Pay!\n\n---\n\n💡 **Top Travel Secret:** Always bargain at the local markets with a smile, and ask the locals where *they* eat for the best hidden food spots!`;
      }
      
      setItinerary(text);
    } catch (err: any) {
      setError(err.message || "An error occurred while generating the itinerary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">AI Itinerary Generator</h2>
        <p className="text-sm text-muted-foreground font-body">Let AI plan the perfect tropical group adventure in seconds.</p>
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        {/* Input Form Column */}
        <div className="md:col-span-5 bg-card rounded-2xl p-6 border border-border/50 shadow-card">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1">
                Where are you heading?
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground/50">
                  <Navigation className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. Bali, Goa, Maldives"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-body text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1">
                  Duration (Days)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground/50">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-body text-sm"
                  >
                    <option value="1">1 Day</option>
                    <option value="3">3 Days</option>
                    <option value="5">5 Days</option>
                    <option value="7">7 Days</option>
                    <option value="10">10 Days</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1">
                  Budget Level
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground/50">
                    <DollarSign className="w-4 h-4" />
                  </span>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-body text-sm"
                  >
                    <option value="Budget">Budget</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1">
                Travel Vibe
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground/50">
                  <Compass className="w-4 h-4" />
                </span>
                <select
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-body text-sm"
                >
                  <option value="Beachy & Relaxed">Beachy & Relaxed 🌊</option>
                  <option value="Adventure Sports">Adventure Sports 🏄‍♂️</option>
                  <option value="Heritage & Culture">Heritage & Culture 🏛️</option>
                  <option value="Nightlife & Party">Nightlife & Party 🍹</option>
                  <option value="Nature & Eco-tourism">Nature & Eco 🌿</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1">
                Special Requests / Group Notes
              </label>
              <textarea
                placeholder="e.g. Vegetarian foods only, visiting sunset cliffs, scenic views..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-body text-sm"
              />
            </div>


            {error && (
              <div className="bg-rose-50 border border-rose-250 text-rose-950 rounded-xl p-3 text-xs font-body">
                <p className="font-bold">Error generating itinerary</p>
                <p className="opacity-90 mt-0.5">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-sunset text-white font-semibold py-3 px-4 rounded-xl shadow-card hover:shadow-elevated hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Consulting the Oracle...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-white" />
                  <span>Generate Itinerary</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Display Result Column */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-border/40 shadow-card flex flex-col min-h-[450px]">
          {itinerary ? (
            <>
              {/* Toolbar */}
              <div className="px-5 py-3 border-b border-border/20 flex justify-between items-center bg-teal-50/10">
                <span className="text-xs font-body font-bold text-teal-850 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                  Ready to print or share!
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs font-body font-semibold text-muted-foreground hover:text-foreground bg-white border border-border/50 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-palm" />
                        <span className="text-palm">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Markdown</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Render area */}
              <div className="p-6 overflow-y-auto max-h-[500px] prose prose-teal text-left font-body text-sm space-y-4">
                {itinerary.split("\n").map((line, idx) => {
                  if (line.startsWith("# ")) {
                    return <h1 key={idx} className="text-2xl font-display font-black text-teal-900 border-b pb-2 mb-3 mt-4">{line.replace("# ", "")}</h1>;
                  }
                  if (line.startsWith("## ")) {
                    return <h2 key={idx} className="text-lg font-display font-extrabold text-teal-850 mt-5 mb-2">{line.replace("## ", "")}</h2>;
                  }
                  if (line.startsWith("### ")) {
                    return <h3 key={idx} className="text-base font-display font-bold text-teal-800 mt-4 mb-1">{line.replace("### ", "")}</h3>;
                  }
                  if (line.startsWith("> ")) {
                    return (
                      <blockquote key={idx} className="border-l-4 border-teal-500 bg-teal-50/50 p-3 rounded-r-xl italic font-medium my-2 text-teal-800">
                        {line.replace("> ", "")}
                      </blockquote>
                    );
                  }
                  if (line.startsWith("* ")) {
                    return <li key={idx} className="ml-4 list-disc text-slate-700 py-0.5">{line.replace("* ", "")}</li>;
                  }
                  if (line.startsWith("- ")) {
                    return <li key={idx} className="ml-4 list-disc text-slate-700 py-0.5">{line.replace("- ", "")}</li>;
                  }
                  if (line.trim() === "---") {
                    return <hr key={idx} className="my-4 border-border/30" />;
                  }
                  return line.trim() ? <p key={idx} className="text-slate-600 leading-relaxed">{line}</p> : <div key={idx} className="h-2" />;
                })}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mb-4">
                <Compass className="w-8 h-8 text-teal-500 animate-pulse" />
              </div>
              <h3 className="font-display font-bold text-foreground text-base">Plan Your Voyage</h3>
              <p className="text-xs text-muted-foreground font-body mt-1 max-w-sm">
                Enter your tropical destination, select your duration, select a vibe and hit generate. 
                Our AI travel agent will draft the ultimate group itinerary for you.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
