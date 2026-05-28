import React, { useState, useRef } from "react";
import {
  Plane,
  Hotel,
  Search,
  MapPin,
  ExternalLink,
} from "lucide-react";

const CITIES = [
  { name: "Mumbai", code: "BOM", country: "India" },
  { name: "Delhi", code: "DEL", country: "India" },
  { name: "Bangalore", code: "BLR", country: "India" },
  { name: "Goa", code: "GOI", country: "India" },
  { name: "Chennai", code: "MAA", country: "India" },
  { name: "Hyderabad", code: "HYD", country: "India" },
  { name: "Kolkata", code: "CCU", country: "India" },
  { name: "Jaipur", code: "JAI", country: "India" },
  { name: "Kochi", code: "COK", country: "India" },
  { name: "Ahmedabad", code: "AMD", country: "India" },
  { name: "Pune", code: "PNQ", country: "India" },
  { name: "Bhubaneswar", code: "BBI", country: "India" },
  { name: "Dubai", code: "DXB", country: "UAE" },
  { name: "Singapore", code: "SIN", country: "Singapore" },
  { name: "Bangkok", code: "BKK", country: "Thailand" },
  { name: "London", code: "LHR", country: "UK" },
  { name: "New York", code: "JFK", country: "USA" },
  { name: "Tokyo", code: "NRT", country: "Japan" },
  { name: "Bali", code: "DPS", country: "Indonesia" },
  { name: "Maldives", code: "MLE", country: "Maldives" },
];

const MOCK_FLIGHTS = [
  {
    id: 1,
    airline: "IndiGo",
    code: "6E",
    color: "#1e3a8a",
    departure: "06:15",
    arrival: "08:30",
    duration: "2h 15m",
    stops: "Non-stop",
    price: "₹4,599",
  },
  {
    id: 2,
    airline: "Air India",
    code: "AI",
    color: "#dc2626",
    departure: "09:45",
    arrival: "12:10",
    duration: "2h 25m",
    stops: "Non-stop",
    price: "₹5,299",
  },
  {
    id: 3,
    airline: "SpiceJet",
    code: "SG",
    color: "#ea580c",
    departure: "13:20",
    arrival: "15:55",
    duration: "2h 35m",
    stops: "Non-stop",
    price: "₹3,899",
  },
  {
    id: 4,
    airline: "Vistara",
    code: "UK",
    color: "#7c3aed",
    departure: "17:00",
    arrival: "19:15",
    duration: "2h 15m",
    stops: "Non-stop",
    price: "₹7,499",
  },
  {
    id: 5,
    airline: "Akasa Air",
    code: "QP",
    color: "#0f766e",
    departure: "20:30",
    arrival: "22:50",
    duration: "2h 20m",
    stops: "Non-stop",
    price: "₹4,199",
  },
];

const MOCK_HOTELS = [
  {
    id: 1,
    name: "The Grand Palms Resort",
    stars: 5,
    rating: 4.8,
    reviews: 1243,
    price: "₹8,500",
    tag: "Beachfront",
  },
  {
    id: 2,
    name: "Ocean Breeze Boutique",
    stars: 4,
    rating: 4.5,
    reviews: 876,
    price: "₹4,200",
    tag: "City View",
  },
  {
    id: 3,
    name: "Sunset Villa Stays",
    stars: 4,
    rating: 4.6,
    reviews: 654,
    price: "₹5,800",
    tag: "Pool Access",
  },
  {
    id: 4,
    name: "Tropical Inn Express",
    stars: 3,
    rating: 4.2,
    reviews: 432,
    price: "₹2,100",
    tag: "Best Value",
  },
  {
    id: 5,
    name: "Azure Luxury Suites",
    stars: 5,
    rating: 4.9,
    reviews: 521,
    price: "₹14,000",
    tag: "Luxury",
  },
];

interface CityDropdownProps {
  value: string;
  onChange: (name: string, code: string) => void;
  placeholder: string;
  id: string;
}

const CityDropdown: React.FC<CityDropdownProps> = ({
  value,
  onChange,
  placeholder,
  id,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.code.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative">
      <input
        id={id}
        ref={inputRef}
        type="text"
        autoComplete="off"
        placeholder={placeholder}
        value={query}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl max-h-52 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.code}
              type="button"
              onMouseDown={() => {
                onChange(c.name, c.code);
                setQuery(c.name);
                setOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-teal-50 text-left transition-colors"
            >
              <span className="text-sm font-semibold text-slate-800">
                {c.name}
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{c.country}</span>
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">
                  {c.code}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const TravelSearch: React.FC = () => {
  const [searchType, setSearchType] = useState<"flights" | "hotels">("flights");
  const [from, setFrom] = useState("");
  const [fromCity, setFromCity] = useState("");
  const [to, setTo] = useState("");
  const [toCity, setToCity] = useState("");
  const [city, setCity] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [travelers, setTravelers] = useState(2);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    setLoading(true);
    setSearched(false);
    setTimeout(() => {
      setLoading(false);
      setSearched(true);
    }, 1500);
  };

  const makemytripFlight = () => {
    const date = checkIn.replace(/-/g, "");
    return `https://www.makemytrip.com/flights/domestic/${from}-${to}/${date}/1-0-0/economy`;
  };

  const ixigoFlight = () => {
    return `https://www.ixigo.com/search/result/flight/${from}/${to}/${checkIn}/1/0/0/E`;
  };

  const googleFlights = () => {
    return `https://www.google.com/travel/flights?q=flights+from+${fromCity}+to+${toCity}`;
  };

  const makemytripHotel = () => {
    return `https://www.makemytrip.com/hotels/hotel-listing/?city=${cityCode}&checkin=${checkIn}&checkout=${checkOut}&roomCount=1&adultsCount=${travelers}&childCount=0`;
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="gradient-tropical rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute -top-8 -right-8 text-8xl opacity-10 select-none pointer-events-none">
          ✈️
        </div>
        <div className="absolute -bottom-6 left-1/2 text-6xl opacity-10 select-none pointer-events-none">
          🏖️
        </div>
        <div className="relative">
          <h2 className="text-2xl font-extrabold tracking-tight">
            Plan Your Trip ✈️
          </h2>
          <p className="text-sm text-white/70 mt-1">
            Search & book flights and hotels with your group
          </p>
          {/* Toggle tabs */}
          <div className="flex gap-2 mt-4">
            <button
              id="tab-flights"
              onClick={() => {
                setSearchType("flights");
                setSearched(false);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                searchType === "flights"
                  ? "bg-white text-teal-700 shadow"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              <Plane className="w-4 h-4" />
              Flights
            </button>
            <button
              id="tab-hotels"
              onClick={() => {
                setSearchType("hotels");
                setSearched(false);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                searchType === "hotels"
                  ? "bg-white text-teal-700 shadow"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              <Hotel className="w-4 h-4" />
              Hotels
            </button>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        {searchType === "flights" ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  From
                </label>
                <CityDropdown
                  id="from-city"
                  value={fromCity}
                  placeholder="Departure city"
                  onChange={(name, code) => {
                    setFromCity(name);
                    setFrom(code);
                  }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  To
                </label>
                <CityDropdown
                  id="to-city"
                  value={toCity}
                  placeholder="Destination city"
                  onChange={(name, code) => {
                    setToCity(name);
                    setTo(code);
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Departure Date
                </label>
                <input
                  id="depart-date"
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Return Date
                </label>
                <input
                  id="return-date"
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Travelers
                </label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                  <button
                    id="travelers-minus"
                    type="button"
                    onClick={() => setTravelers(Math.max(1, travelers - 1))}
                    className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-slate-600 font-bold text-sm flex items-center justify-center hover:bg-teal-50 hover:border-teal-300 transition-colors cursor-pointer"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center text-sm font-bold text-slate-900">
                    {travelers}
                  </span>
                  <button
                    id="travelers-plus"
                    type="button"
                    onClick={() => setTravelers(travelers + 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-slate-600 font-bold text-sm flex items-center justify-center hover:bg-teal-50 hover:border-teal-300 transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Destination City
              </label>
              <CityDropdown
                id="hotel-city"
                value={city}
                placeholder="Where are you staying?"
                onChange={(name, code) => {
                  setCity(name);
                  setCityCode(code);
                }}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Check In
                </label>
                <input
                  id="checkin-date"
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Check Out
                </label>
                <input
                  id="checkout-date"
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Guests
                </label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                  <button
                    id="guests-minus"
                    type="button"
                    onClick={() => setTravelers(Math.max(1, travelers - 1))}
                    className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-slate-600 font-bold text-sm flex items-center justify-center hover:bg-teal-50 hover:border-teal-300 transition-colors cursor-pointer"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center text-sm font-bold text-slate-900">
                    {travelers}
                  </span>
                  <button
                    id="guests-plus"
                    type="button"
                    onClick={() => setTravelers(travelers + 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-slate-600 font-bold text-sm flex items-center justify-center hover:bg-teal-50 hover:border-teal-300 transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        <button
          id="search-btn"
          onClick={handleSearch}
          className="w-full gradient-tropical text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md"
        >
          <Search className="w-4 h-4" />
          {searchType === "flights" ? "Search Flights" : "Search Hotels"}
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-5"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
                <div className="space-y-2 text-right">
                  <div className="h-5 bg-gray-200 rounded w-20" />
                  <div className="h-3 bg-gray-100 rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              {searchType === "flights" ? "✈️ Available Flights" : "🏨 Available Hotels"}
            </h3>
            <span className="text-xs text-slate-400">
              Showing estimated prices
            </span>
          </div>

          {searchType === "flights"
            ? MOCK_FLIGHTS.map((flight) => (
                <div
                  key={flight.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    {/* Airline Logo */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm flex-shrink-0"
                      style={{ backgroundColor: flight.color }}
                    >
                      {flight.code}
                    </div>

                    {/* Flight Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm">
                        {flight.airline}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-base font-mono font-bold text-slate-800">
                          {flight.departure}
                        </span>
                        <div className="flex-1 flex items-center gap-1 mx-2">
                          <div className="h-px flex-1 bg-gray-200" />
                          <Plane className="w-3 h-3 text-slate-400" />
                          <div className="h-px flex-1 bg-gray-200" />
                        </div>
                        <span className="text-base font-mono font-bold text-slate-800">
                          {flight.arrival}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {flight.duration} · {flight.stops}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-mono font-extrabold text-teal-600">
                        {flight.price}
                      </p>
                      <p className="text-[10px] text-slate-400">per person</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <a
                      href={makemytripFlight()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 bg-rose-500 text-white text-xs font-semibold rounded-xl hover:bg-rose-600 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      MakeMyTrip
                    </a>
                    <a
                      href={ixigoFlight()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white text-xs font-semibold rounded-xl hover:bg-orange-600 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Ixigo
                    </a>
                    <a
                      href={googleFlights()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold rounded-xl hover:bg-teal-100 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Google Flights
                    </a>
                  </div>
                </div>
              ))
            : MOCK_HOTELS.map((hotel) => (
                <div
                  key={hotel.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                      <Hotel className="w-6 h-6 text-teal-600" />
                    </div>

                    {/* Hotel Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            {hotel.name}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {Array.from({ length: hotel.stars }).map((_, i) => (
                              <span key={i} className="text-amber-400 text-xs">
                                ★
                              </span>
                            ))}
                            <span className="text-[10px] text-slate-400 ml-1">
                              {hotel.rating} ({hotel.reviews} reviews)
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] text-slate-400">
                              {city || "Your destination"}
                            </span>
                            <span className="text-[10px] bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded font-semibold">
                              {hotel.tag}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-mono font-extrabold text-teal-600">
                            {hotel.price}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            per night
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <a
                          href={makemytripHotel()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 bg-rose-500 text-white text-xs font-semibold rounded-xl hover:bg-rose-600 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          MakeMyTrip
                        </a>
                        <a
                          href={`https://www.booking.com/search.html?ss=${encodeURIComponent(city)}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${travelers}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Booking.com
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

          {/* Disclaimer */}
          <p className="text-center text-[11px] text-slate-400 py-2">
            💡 Prices are estimated. Tap "Book" to check live availability.
          </p>
        </div>
      )}
    </div>
  );
};
