export const DEFAULT_SHELF_LIMIT = 15;
export const QUICK_BITE_MAX_PRICE = 200;

const idOf = (item) => item?._id?.toString?.() || String(item?._id || "");

export const filterQuickBites = (items, maxPrice = QUICK_BITE_MAX_PRICE) =>
  items.filter((item) => Number(item.price) <= maxPrice);

export const sortTopRatedItems = (items) =>
  [...items].sort((a, b) => {
    const ratingDiff = Number(b.rating || 0) - Number(a.rating || 0);
    if (ratingDiff !== 0) return ratingDiff;

    return Number(b.price || 0) - Number(a.price || 0);
  });

export const orderRecentlyViewed = (items, ids) => {
  const itemsById = new Map(items.map((item) => [idOf(item), item]));

  return ids
    .map((id) => itemsById.get(String(id)))
    .filter(Boolean);
};
