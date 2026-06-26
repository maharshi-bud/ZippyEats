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

    addItemWithBXGYCheck(state, action) {
      const { item, couponData } = action.payload;

      // Add regular item
      const existingItem = state.items.find(i => i._id === item._id);
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        state.items.push({
          ...item,
          quantity: item.quantity || 1,
          isRewardItem: false,
        });
      }

      // Check if coupon is BXGY and trigger item was added
      if (couponData?.reward_type !== 'bxgy' || !couponData?.bxgy_config) return;

      const { trigger_item_id, reward_item_id, trigger_quantity, reward_quantity, max_applications } = couponData.bxgy_config;

      if (item._id.toString() !== trigger_item_id?.toString?.()) return;

      // Count trigger items
      const triggerCount = state.items
        .filter(i => i._id.toString() === trigger_item_id?.toString?.() && !i.isRewardItem)
        .reduce((sum, i) => sum + i.quantity, 0);

      const applicationsEarned = Math.floor(triggerCount / trigger_quantity);
      const applicationsAllowed = Math.min(applicationsEarned, max_applications);
      const totalRewardQuantity = applicationsAllowed * reward_quantity;

      // Find or create reward item
      const existingReward = state.items.find(
        i => i._id.toString() === reward_item_id?.toString?.() && i.isRewardItem
      );

      if (existingReward) {
        existingReward.quantity = totalRewardQuantity;
      } else {
        state.items.push({
          _id: reward_item_id,
          name: item.name, // Update with actual reward name if available
          quantity: totalRewardQuantity,
          price: item.price,
          originalPrice: item.price,
          isRewardItem: true,
          image: item.image,
        });
      }
    },
    updateQuantityWithBXGY(state, action) {
      const { itemId, quantity, couponData } = action.payload;
      const item = state.items.find(i => i._id === itemId);

      if (!item || item.isRewardItem) return;

      item.quantity = quantity;

      // Recalculate rewards
      if (couponData?.reward_type !== 'bxgy' || !couponData?.bxgy_config) return;

      const { trigger_item_id, reward_item_id, trigger_quantity, reward_quantity, max_applications } = couponData.bxgy_config;

      if (itemId.toString() !== trigger_item_id?.toString?.()) return;

      const triggerCount = state.items
        .filter(i => i._id.toString() === trigger_item_id?.toString?.() && !i.isRewardItem)
        .reduce((sum, i) => sum + i.quantity, 0);

      const totalRewardQuantity = Math.min(
        Math.floor(triggerCount / trigger_quantity),
        max_applications
      ) * reward_quantity;

      const rewardItem = state.items.find(
        i => i._id.toString() === reward_item_id?.toString?.() && i.isRewardItem
      );

      if (rewardItem) {
        rewardItem.quantity = totalRewardQuantity;
      }
    },

    removeItemWithBXGYCleanup(state, action) {
      const itemId = action.payload;

      // Check if this item triggers rewards
      const coupon = state.appliedCoupon;
      if (coupon?.reward_type === 'bxgy' && coupon?.bxgy_config?.trigger_item_id?.toString?.() === itemId?.toString?.()) {
        // Also remove reward items
        state.items = state.items.filter(
          item => item._id?.toString?.() !== coupon.bxgy_config.reward_item_id?.toString?.() || !item.isRewardItem
        );
      }

      // Remove the item
      state.items = state.items.filter(item => item._id !== itemId);
    },

    addToCart: (state, action) => {
      const item = action.payload;
      const existing = state.items.find(
        (i) =>
          i.menu_item_id === item.menu_item_id &&
          Boolean(i.isFree) === Boolean(item.isFree)
      );

      if (existing) {
        existing.quantity += item.quantity || 1;
      } else {
        state.items.push({
          ...item,
          quantity: item.quantity || 1,
        });
      }
      // ✅ No saveCart() — store.js subscriber handles it
    },

    removeFreeRewardItems: (state, action) => {
      const coupon = action.payload;
      const freeItemId =
        coupon?.free_item_id ||
        coupon?.bxgy_config?.reward_item_id ||
        coupon?.bxgy_config?.get_item;
      const freeItemQty =
        coupon?.free_item_qty ||
        coupon?.bxgy_config?.free_quantity ||
        coupon?.bxgy_config?.reward_quantity ||
        1;

      const hasDedicatedRewardLine = state.items.some(
        (item) =>
          item.menu_item_id === freeItemId &&
          (item.isFree || item.isRewardItem || item.reward_type === "bxgy")
      );

      // Remove the dedicated reward/free lines created for BXGY coupons.
      state.items = state.items.filter(
        (item) => !item.isFree && !item.isRewardItem && item.reward_type !== "bxgy"
      );

      // Backward-compatible cleanup: older BXGY logic could merge the free qty into
      // the normal paid line. If no dedicated reward line existed, subtract that qty.
      if (coupon?.reward_type === "bxgy" && freeItemId && !hasDedicatedRewardLine) {
        const mergedRewardItem = state.items.find(
          (item) => item.menu_item_id === freeItemId
        );

        if (mergedRewardItem) {
          mergedRewardItem.quantity -= freeItemQty;
          if (mergedRewardItem.quantity <= 0) {
            state.items = state.items.filter(
              (item) => item.menu_item_id !== freeItemId
            );
          }
        }
      }
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
  removeFreeRewardItems,
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
    (total, item) =>
      // If it's a free reward, add 0 to the total. Otherwise, add normal price.
      total + ((item.price || 0) * (item.quantity || 0)),
    0
  );
};