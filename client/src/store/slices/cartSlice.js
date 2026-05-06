import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [], // ✅ Will be overwritten by preloadedState from store.js
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // ✅ Cross-tab sync
    replaceCart: (state, action) => {
      state.items = Array.isArray(action.payload) ? action.payload : [];
    },

    addToCart: (state, action) => {
      const item = action.payload;
      const existing = state.items.find(
        (i) => i.menu_item_id === item.menu_item_id
      );
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...item, quantity: 1 });
      }
      // ✅ No saveCart() — store.js subscriber handles it
    },

    removeFromCart: (state, action) => {
      state.items = state.items.filter(
        (i) => i.menu_item_id !== action.payload
      );
    },

    updateQuantity: (state, action) => {
      const { menu_item_id, quantity } = action.payload;
      const item = state.items.find((i) => i.menu_item_id === menu_item_id);
      if (item) {
        item.quantity = quantity;
      }
    },

    clearCart: (state) => {
      state.items = [];
    },

    decreaseQty: (state, action) => {
      const id = action.payload;
      const item = state.items.find((i) => i.menu_item_id === id);
      if (item) {
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          state.items = state.items.filter((i) => i.menu_item_id !== id);
        }
      }
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  decreaseQty,
  replaceCart,
} = cartSlice.actions;

export default cartSlice.reducer;

// ✅ Safe selectors
export const selectCartItems = (state) =>
  Array.isArray(state.cart?.items) ? state.cart.items : [];

export const selectCartTotal = (state) => {
  const items = Array.isArray(state.cart?.items) ? state.cart.items : [];
  return items.reduce(
    (total, item) => total + (item.price || 0) * (item.quantity || 0),
    0
  );
};