import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./slices/cartSlice";
import authReducer from "./slices/authSlice";

// 🔥 safe loader
const loadCart = () => {
  if (typeof window === "undefined") return { items: [] };

  try {
    const data = localStorage.getItem("cart");
    return data ? JSON.parse(data) : { items: [] };
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
    cart: loadCart() // ✅ clean
  }
});

// 🔥 save only in browser
if (typeof window !== "undefined") {
  store.subscribe(() => {
    try {
      const state = store.getState();
      localStorage.setItem("cart", JSON.stringify(state.cart));
    } catch {}
  });
}