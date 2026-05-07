"use client";

import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { setLocation as setLocationRedux, selectLocation } from "../store/slices/locationSlice";
import { useState, useEffect, useRef } from "react";
import logo from "../lib/imgs/logoText.png";
import CartDrawer from "./CartDrawer";
import { selectCartItems } from "../store/slices/cartSlice";
import { useRouter } from "next/navigation";
import { startRouteLoader } from "../lib/routeLoading";

export default function Navbar() {
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();

  const [cartOpen, setCartOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState({ restaurants: [], items: [] });
  const [searchOpen, setSearchOpen] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef(null);
  const searchRef = useRef(null); // ✅ NEW — search click outside ref

  const router = useRouter();
  const cart = useSelector(selectCartItems);
  const location = useSelector(selectLocation);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ✅ Build readable address from Nominatim response
  const buildReadableAddress = (address) => {
    const parts = [];
    if (address.neighbourhood) parts.push(address.neighbourhood);
    else if (address.suburb) parts.push(address.suburb);
    else if (address.hamlet) parts.push(address.hamlet);
    else if (address.village) parts.push(address.village);
    else if (address.road) parts.push(address.road);

    if (address.city) parts.push(address.city);
    else if (address.town) parts.push(address.town);
    else if (address.county) parts.push(address.county);

    if (address.state) parts.push(address.state);
    if (address.postcode) parts.push(address.postcode);

    return parts.join(", ") || "Unknown Location";
  };

  // ✅ Close profile popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Fetch location suggestions as user types
  useEffect(() => {
    if (manualAddress.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            manualAddress
          )}&limit=5&countrycodes=in&addressdetails=1`
        );
        const data = await response.json();
        setSuggestions(
          data.map((item) => ({
            display_name: item.display_name,
            short_name: buildReadableAddress(item.address),
            lat: item.lat,
            lon: item.lon,
          }))
        );
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [manualAddress]);

  // ✅ Search debounce
  useEffect(() => {
    if (!search.trim()) {
      setSearchOpen(false); // ✅ close if cleared
    }

    if (search.trim().length < 2) {
      setResults({ restaurants: [], items: [] });
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingSearch(true);
        setHasSearched(true);
        const res = await fetch(
          `http://localhost:5010/api/search?q=${encodeURIComponent(search)}`
        );
        const data = await res.json();
        setResults(data.data);
        setSearchOpen(true); // ✅ open dropdown when results come
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSearch(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // ✅ Get current location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();
          const fullAddress = buildReadableAddress(data.address);
          dispatch(setLocationRedux(fullAddress));
          setLocationOpen(false);
        } catch (error) {
          console.error("Error fetching location:", error);
          alert("Failed to get location name");
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        setLoadingLocation(false);
        alert("Unable to retrieve your location");
        console.error(error);
      }
    );
  };

  // ✅ Set manual address
  const handleSetAddress = () => {
    if (manualAddress.trim()) {
      dispatch(setLocationRedux(manualAddress.trim()));
      setManualAddress("");
      setSuggestions([]);
      setLocationOpen(false);
    }
  };

  // ✅ Select from suggestions
  const handleSelectSuggestion = (suggestion) => {
    dispatch(setLocationRedux(suggestion.short_name));
    setManualAddress("");
    setSuggestions([]);
    setLocationOpen(false);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <nav className="sticky top-0 z-[1000] flex items-center justify-between gap-5 bg-gray-900 px-5 py-3 text-white">
        
        {/* LEFT */}
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex-shrink-0 flex items-center">
            <img src={logo.src} alt="ZippyEats" className="h-10 w-auto" />
          </Link>

          {/* 📍 LOCATION BUTTON */}
          <button
            onClick={() => setLocationOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium transition hover:bg-white/20 min-w-0 max-w-[180px]"
          >
            <span className="flex-shrink-0">📍</span>
            <span className="truncate min-w-0">{location}</span>
          </button>
        </div>

        {/* 🔍 SEARCH */}
        <div ref={searchRef} className="flex-1 max-w-[500px] relative">
          <input
            type="text"
            placeholder="Search food or restaurants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => {
              if (search.trim().length >= 2) setSearchOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && search.trim()) {
                // ✅ FIXED: correct frontend route, not /api/search
                router.push(`/search?q=${encodeURIComponent(search)}`);
                setSearchOpen(false);
              }
            }}
            className="w-full rounded-3xl border border-white/30 bg-white/15 px-4 py-2.5 text-sm text-white outline-none backdrop-blur-md transition-all duration-300 placeholder:text-white/50 focus:border-orange-400/60 focus:shadow-[0_0_0_3px_rgba(17,24,39,1)]"
          />

          {/* 🔽 SEARCH DROPDOWN */}
          {searchOpen && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border z-[2000] text-black overflow-hidden">

              {/* 🔄 LOADING */}
              {loadingSearch && (
                <div className="px-4 py-3 text-sm text-gray-400">
                  Searching...
                </div>
              )}

              {/* ❌ NO RESULTS — only show after a search has been made */}
              {!loadingSearch &&
                hasSearched &&
                results.restaurants.length === 0 &&
                results.items.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-400">
                    No results found for &quot;{search}&quot;
                  </div>
                )}

              {/* ✅ RESTAURANTS */}
              {results.restaurants.length > 0 && (
                <>
                  <p className="text-xs text-gray-400 px-4 pt-3 pb-1 font-semibold uppercase tracking-wide">
                    Restaurants
                  </p>
                  {results.restaurants.map((r) => (
                    <div
                      key={r._id}
                      onClick={() => {
                        router.push(`/restaurant/${r._id}`);
                        setSearchOpen(false);
                        setSearch("");
                      }}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-2 text-sm"
                    >
                      <span>🍽️</span>
                      <span>{r.name}</span>
                    </div>
                  ))}
                </>
              )}

              {/* ✅ ITEMS */}
              {results.items.length > 0 && (
                <>
                  <p className="text-xs text-gray-400 px-4 pt-3 pb-1 font-semibold uppercase tracking-wide border-t">
                    Menu Items
                  </p>
                  {results.items.map((i) => (
                    <div
                      key={i._id}
                      onClick={() => {
                        router.push(`/restaurant/${i.restaurant_id}`);
                        setSearchOpen(false);
                        setSearch("");
                      }}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-2 text-sm"
                    >
                      <span>🍜</span>
                      <span>{i.name}</span>
                    </div>
                  ))}
                </>
              )}

              {/* ✅ ENTER TO SEARCH ALL */}
              {search.trim().length >= 2 && (
                <div
                  onClick={() => {
                    router.push(`/search?q=${encodeURIComponent(search)}`);
                    setSearchOpen(false);
                  }}
                  className="px-4 py-3 border-t hover:bg-orange-50 cursor-pointer text-sm text-orange-500 font-medium flex items-center gap-2"
                >
                  <span>🔍</span>
                  <span>See all results for &quot;{search}&quot;</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT */}
        {/* RIGHT */}
<div className="flex items-center gap-4">

  {/* 🏠 HOME */}
  <Link
    href="/"
    className="w-10 h-10 grid place-items-center rounded-full text-white transition hover:bg-white/10"
  >
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  </Link>

  {/* 🛒 CART */}
  <button
    className="relative w-10 h-10 grid place-items-center rounded-full text-white transition hover:bg-white/10"
    onClick={() => setCartOpen(true)}
  >
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>

    {totalItems > 0 && (
      <span className="absolute -right-1 -top-1 grid place-items-center min-w-[18px] h-[18px] rounded-full bg-green-500 px-[3px] text-[11px] font-semibold text-white transition-transform active:scale-125">
        <span className="block leading-none">{totalItems}</span>
      </span>
    )}
  </button>

  <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

  {/* 👤 PROFILE POPUP */}
  <label className="popup" ref={profileRef}>
    <input
      type="checkbox"
      checked={profileOpen}
      onChange={(e) => setProfileOpen(e.target.checked)}
    />
    <div tabIndex={0} className="burger">
      <svg
        viewBox="0 0 24 24"
        fill="white"
        height="20"
        width="20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 2c2.757 0 5 2.243 5 5.001 0 2.756-2.243 5-5 5s-5-2.244-5-5c0-2.758 2.243-5.001 5-5.001zm0-2c-3.866 0-7 3.134-7 7.001 0 3.865 3.134 7 7 7s7-3.135 7-7c0-3.867-3.134-7.001-7-7.001zm6.369 13.353c-.497.498-1.057.931-1.658 1.302 2.872 1.874 4.378 5.083 4.972 7.346h-19.387c.572-2.29 2.058-5.503 4.973-7.358-.603-.374-1.162-.811-1.658-1.312-4.258 3.072-5.611 8.506-5.611 10.669h24c0-2.142-1.44-7.557-5.631-10.647z"></path>
      </svg>
    </div>
    <nav className="popup-window">
      <legend>Quick Start</legend>
      <ul>
        {token ? (
          <>
            <li>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  startRouteLoader();
                  router.push("/profile");
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2c2.757 0 5 2.243 5 5.001 0 2.756-2.243 5-5 5s-5-2.244-5-5c0-2.758 2.243-5.001 5-5.001zm0-2c-3.866 0-7 3.134-7 7.001 0 3.865 3.134 7 7 7s7-3.135 7-7c0-3.867-3.134-7.001-7-7.001z"></path>
                </svg>
                <span>My Profile</span>
              </button>
            </li>
            <hr />
            <li>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  dispatch(logout());
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.598 9h-1.055c1.482-4.638 5.83-8 10.957-8 6.347 0 11.5 5.153 11.5 11.5s-5.153 11.5-11.5 11.5c-5.127 0-9.475-3.362-10.957-8h1.055c1.443 4.076 5.334 7 9.902 7 5.795 0 10.5-4.705 10.5-10.5s-4.705-10.5-10.5-10.5c-4.568 0-8.459 2.923-9.902 7zm12.228 3l-4.604-3.747.666-.753 6.112 5-6.101 5-.679-.737 4.608-3.763h-14.828v-1h14.826z"></path>
                </svg>
                <span>Logout</span>
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  startRouteLoader();
                  router.push("/login");
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 4v6.406l-3.753 3.741-6.463-6.462 3.7-3.685h6.516zm2-2h-12.388l1.497 1.5-4.171 4.167 9.291 9.291 4.161-4.193 1.61 1.623v-12.388zm-5 4c.552 0 1 .449 1 1s-.448 1-1 1-1-.449-1-1 .448-1 1-1zm0-1c-1.104 0-2 .896-2 2s.896 2 2 2 2-.896 2-2-.896-2-2-2zm6.708.292l-.708.708v3.097l2-2.065-1.292-1.74zm-12.675 9.294l-1.414 1.414h-2.619v2h-2v2h-2v-2.17l5.636-5.626-1.417-1.407-6.219 6.203v5h6v-2h2v-2h2l1.729-1.729-1.696-1.685z"></path>
                </svg>
                <span>Log In</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  startRouteLoader();
                  router.push("/signup");
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.598 9h-1.055c1.482-4.638 5.83-8 10.957-8 6.347 0 11.5 5.153 11.5 11.5s-5.153 11.5-11.5 11.5c-5.127 0-9.475-3.362-10.957-8h1.055c1.443 4.076 5.334 7 9.902 7 5.795 0 10.5-4.705 10.5-10.5s-4.705-10.5-10.5-10.5c-4.568 0-8.459 2.923-9.902 7zm12.228 3l-4.604-3.747.666-.753 6.112 5-6.101 5-.679-.737 4.608-3.763h-14.828v-1h14.826z"></path>
                </svg>
                <span>Sign Up</span>
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  </label>
</div>

      </nav>

      {/* 📍 LOCATION POPUP */}
      {locationOpen && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => {
            setLocationOpen(false);
            setSuggestions([]);
            setManualAddress("");
          }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setLocationOpen(false);
                setSuggestions([]);
                setManualAddress("");
              }}
              className="absolute right-4 top-4 text-2xl text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Choose Your Location
            </h2>

            <button
              onClick={handleCurrentLocation}
              disabled={loadingLocation}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
            >
              {loadingLocation ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Getting location...
                </>
              ) : (
                <>📍 Use Current Location</>
              )}
            </button>

            <div className="relative mb-4 flex items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="mx-4 flex-shrink text-sm text-gray-500">OR</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <div className="space-y-3 relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter delivery address"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  onKeyDown={(e) => {
                    // ✅ FIXED: was wrongly pushing to /api/search
                    if (e.key === "Enter") handleSetAddress();
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />

                {loadingSuggestions && (
                  <div className="absolute right-3 top-3.5">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                  </div>
                )}
              </div>

              {/* ✅ Location suggestions */}
              {suggestions.length > 0 && (
                <div className="absolute z-10 w-full max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-orange-50 transition border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">
                        {suggestion.short_name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">
                        {suggestion.display_name}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={handleSetAddress}
                className="w-full rounded-lg border-2 border-orange-500 bg-white px-4 py-3 font-semibold text-orange-500 transition hover:bg-orange-50"
              >
                Set Location
              </button>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-medium text-gray-600">
                Popular Cities
              </p>
              <div className="grid grid-cols-2 gap-2">
                {["Mumbai", "Delhi", "Bangalore", "Ahmedabad"].map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      dispatch(setLocationRedux(city));
                      setLocationOpen(false);
                      setSuggestions([]);
                      setManualAddress("");
                    }}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}