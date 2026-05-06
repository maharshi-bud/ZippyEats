import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./slices/cartSlice";
import authReducer from "./slices/authSlice";

// ✅ Load cart as object shape
const loadCart = () => {
  if (typeof window === "undefined") return { items: [] };

  try {
    const data = localStorage.getItem("cart");
    if (!data) return { items: [] };
    
    const parsed = JSON.parse(data);
    
    // ✅ Handle both shapes (for migration)
    if (Array.isArray(parsed)) return { items: parsed };
    if (parsed && Array.isArray(parsed.items)) return { items: parsed.items };
    
    return { items: [] };
  } catch {
    return { items: [] };
  }
};

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    auth: authReducer
  },
  preloadedState: {
    cart: loadCart()
  }
});

// ✅ Save entire cart object
if (typeof window !== "undefined") {
  store.subscribe(() => {
    try {
      const state = store.getState();
      localStorage.setItem("cart", JSON.stringify(state.cart));
    } catch {}
  });
}