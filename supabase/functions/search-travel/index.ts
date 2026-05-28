import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "public, max-age=3600",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { type } = body;

    if (type === "flights") {
      const { from, to, date } = body;
      const SERPAPI_KEY = Deno.env.get("SUPABASE_SERPAPI_KEY");
      
      if (!SERPAPI_KEY) {
        throw new Error("SerpApi key not configured in Edge Function environment variables.");
      }

      // SerpApi Google Flights endpoint
      const url = `https://serpapi.com/search.json?engine=google_flights&departure_id=${from}&arrival_id=${to}&outbound_date=${date}&currency=INR&api_key=${SERPAPI_KEY}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (type === "hotels") {
      const { location, checkIn, checkOut, guests } = body;
      const LITEAPI_KEY = Deno.env.get("SUPABASE_LITEAPI_KEY");

      if (!LITEAPI_KEY) {
        throw new Error("LiteAPI key not configured in Edge Function environment variables.");
      }

      // LiteAPI endpoint
      const url = `https://api.liteapi.travel/v3.0/hotels/rates?destination=${location}&checkin=${checkIn}&checkout=${checkOut}&guests=${guests || 2}`;
      
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "X-API-Key": LITEAPI_KEY,
          "Accept": "application/json"
        }
      });
      
      const data = await res.json();

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (type === "itinerary") {
      const { prompt } = body;
      
      // Server-side call to Pollinations bypassing browser CORS/Origin blocks
      const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`);
      let text = await res.text();
      text = text.replace(/⚠️ \*\*IMPORTANT NOTICE\*\* ⚠️[\s\S]*?continue to work normally\./g, "").trim();

      return new Response(JSON.stringify({ itinerary: text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Invalid request type. Must be 'flights', 'hotels', or 'itinerary'.");
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
