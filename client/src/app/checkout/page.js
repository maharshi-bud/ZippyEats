"use client";

import { useSelector, useDispatch } from "react-redux";
import { selectCartItems, selectCartTotal, clearCart } from "../../store/slices/cartSlice";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "../../lib/axios";
import { startRouteLoader } from "../../lib/routeLoading";

const DELIVERY_FEE = 40;

const PAYMENT_OPTIONS = [
  { id: "cod", label: "Cash on Delivery", icon: "💵", available: true },
  { id: "upi", label: "UPI", icon: "📱", available: false },
  { id: "card", label: "Card", icon: "💳", available: false },
];

export default function CheckoutPage() {
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const dispatch = useDispatch();
  const router = useRouter();

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [useCustom, setUseCustom] = useState(false);
  const [zipCoins, setZipCoins] = useState(0);
  const [useZipCoins, setUseZipCoins] = useState(false);

  const [form, setForm] = useState({
    full_name: "", phone: "", address_line: "",
    city: "Ahmedabad", state: "Gujarat", pincode: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Computed totals ──────────────────────────────────────
  const subtotal = total + DELIVERY_FEE;
  const coinsDiscount = useZipCoins ? Math.min(zipCoins, subtotal) : 0;
  const coinsRemaining = useZipCoins ? Math.max(0, zipCoins - subtotal) : zipCoins;
  const finalTotal = subtotal - coinsDiscount;

  useEffect(() => {
    // Fetch addresses
    api.get("/users/addresses")
      .then((res) => {
        const addrs = res.data.data || [];
        setSavedAddresses(addrs);
        const def = addrs.find((a) => a.is_default) || addrs[0];
        if (def) { setSelectedAddressId(def._id); setUseCustom(false); }
        else setUseCustom(true);
      })
      .catch(() => setUseCustom(true));

    // Fetch ZipCoins balance
    api.get("/users/me/coins")
      .then((res) => setZipCoins(res.data.data?.zipCoins || 0))
      .catch(() => {});
  }, []);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    let delivery_address;
    if (!useCustom && selectedAddressId) {
      const addr = savedAddresses.find((a) => a._id === selectedAddressId);
      if (!addr) { setError("Please select a delivery address."); return; }
      delivery_address = addr;
    } else {
      if (!form.full_name || !form.phone || !form.address_line) {
        setError("Please fill in all required address fields.");
        return;
      }
      delivery_address = form;
    }

    setLoading(true);
    setError("");

    try {
      const restaurantId = items[0]?.restaurant_id;

      const res = await api.post("/orders", {
        items: items.map((i) => ({ menu_item_id: i.menu_item_id, quantity: i.quantity })),
        restaurant_id: restaurantId,
        delivery_address,
        payment_method: paymentMethod,
        useZipCoins, // ← send to server
      });

      dispatch(clearCart());
      startRouteLoader();
      router.push(`/orders/${res.data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-2xl mx-auto px-4 space-y-6">

        <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>

        {/* ── DELIVERY ADDRESS ─────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Delivery address</h2>

          {savedAddresses.length > 0 && (
            <div className="space-y-2 mb-4">
              {savedAddresses.map((addr) => (
                <label
                  key={addr._id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    !useCustom && selectedAddressId === addr._id
                      ? "border-green-500 bg-green-50"
                      : "border-slate-200"
                  }`}
                >
                  <input type="radio" name="address" value={addr._id}
                    checked={!useCustom && selectedAddressId === addr._id}
                    onChange={() => { setSelectedAddressId(addr._id); setUseCustom(false); }}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {addr.full_name}
                      <span className="ml-2 text-xs font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{addr.label}</span>
                      {addr.is_default && <span className="ml-1 text-xs text-green-600">✓ Default</span>}
                    </p>
                    <p className="text-xs text-slate-500">{addr.address_line}, {addr.city} — {addr.phone}</p>
                  </div>
                </label>
              ))}
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${useCustom ? "border-green-500 bg-green-50" : "border-slate-200"}`}>
                <input type="radio" name="address" checked={useCustom} onChange={() => setUseCustom(true)} />
                <span className="text-sm text-slate-700">Enter a different address</span>
              </label>
            </div>
          )}

          {(useCustom || savedAddresses.length === 0) && (
            <div className="space-y-3">
              <input placeholder="Full name *" value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <input placeholder="Phone *" value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <input placeholder="Flat / Building / Street *" value={form.address_line}
                onChange={(e) => setForm((f) => ({ ...f, address_line: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <div className="grid grid-cols-3 gap-3">
                <input placeholder="City" value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <input placeholder="State" value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <input placeholder="Pincode" value={form.pincode}
                  onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
                  className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
          )}
        </div>

        {/* ── ZIPCOINS ─────────────────────────────────────── */}
        {zipCoins > 0 && (
          <div className={`rounded-2xl border p-5 transition ${
            useZipCoins ? "bg-amber-50 border-amber-300" : "bg-white border-slate-200"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🪙</span>
                <div>
                  <p className="font-semibold text-slate-800">
                    Use ZipCoins
                    <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      {zipCoins} coins = ₹{zipCoins}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {useZipCoins
                      ? coinsDiscount === subtotal
                        ? `Covers full bill! ${coinsRemaining > 0 ? `${coinsRemaining} coins remain in your account.` : ""}`
                        : `Saves ₹${coinsDiscount}. Pay ₹${finalTotal} remaining.`
                      : "1 ZipCoin = ₹1 off your order"}
                  </p>
                </div>
              </div>

              {/* Toggle */}
              <button
                onClick={() => setUseZipCoins(!useZipCoins)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  useZipCoins ? "bg-amber-500" : "bg-slate-300"
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  useZipCoins ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>

            {useZipCoins && (
              <div className="mt-3 pt-3 border-t border-amber-200 flex items-center justify-between text-sm">
                <span className="text-amber-700 font-medium">🪙 Coins discount</span>
                <span className="text-amber-700 font-bold">-₹{coinsDiscount}</span>
              </div>
            )}
          </div>
        )}

        {/* ── PAYMENT METHOD ───────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Payment method</h2>
          <div className="space-y-2">
            {PAYMENT_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                  paymentMethod === opt.id && opt.available
                    ? "border-green-500 bg-green-50"
                    : opt.available
                    ? "border-slate-200 hover:border-slate-300"
                    : "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input type="radio" name="payment" value={opt.id}
                    checked={paymentMethod === opt.id} disabled={!opt.available}
                    onChange={() => opt.available && setPaymentMethod(opt.id)} />
                  <span className="text-lg">{opt.icon}</span>
                  <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                </div>
                {!opt.available && (
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Coming soon</span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* ── ORDER SUMMARY ────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Order summary</h2>
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={item.menu_item_id} className="flex justify-between text-sm">
                <span className="text-slate-700">{item.name} × {item.quantity}</span>
                <span className="font-semibold text-slate-800">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-200 pt-3 space-y-1.5">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Subtotal</span><span>₹{total}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>Delivery fee</span><span>₹{DELIVERY_FEE}</span>
            </div>
            {useZipCoins && coinsDiscount > 0 && (
              <div className="flex justify-between text-sm text-amber-600 font-medium">
                <span>🪙 ZipCoins discount</span>
                <span>-₹{coinsDiscount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-slate-900 text-base pt-1 border-t border-slate-100">
              <span>Total</span>
              <div className="text-right">
                {useZipCoins && coinsDiscount > 0 && (
                  <p className="text-xs text-slate-400 line-through font-normal">₹{subtotal}</p>
                )}
                <span>₹{finalTotal}</span>
              </div>
            </div>
            {useZipCoins && coinsRemaining > 0 && (
              <p className="text-xs text-amber-600 text-right">
                🪙 {coinsRemaining} coins remain in your account
              </p>
            )}
          </div>

          {error && (
            <p className="text-red-500 text-sm mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleCheckout}
            disabled={loading || items.length === 0}
            className="mt-5 w-full py-3.5 rounded-xl bg-green-600 text-white font-semibold text-base hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Placing order…</span>
              </>
            ) : (
              `Place order · ₹${finalTotal}`
            )}
          </button>

          <p className="text-center text-xs text-slate-400 mt-3">🔒 Your information is secure</p>
        </div>
      </div>
    </div>
  );
}