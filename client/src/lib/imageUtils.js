const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5010";
// const FALLBACK_IMAGE = "/fallback.png";
const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8'%3ENo Image%3C/text%3E%3C/svg%3E";

export const getFoodImageUrl = (restaurantId, itemName) => {
  if (!restaurantId || !itemName) return FALLBACK_IMAGE;
  const formattedName = itemName.trim().replace(/\s+/g, "_");
  return `${BASE_URL}/images/${restaurantId}_${formattedName}.jpg`;
};

export const getRestaurantCoverImage = (menuItems) => {
  if (!menuItems?.length) return FALLBACK_IMAGE;

  for (let i = 0; i < 5; i++) {
    const randomItem = menuItems[Math.floor(Math.random() * menuItems.length)];
    if (randomItem?.name && randomItem?.restaurant_id) {
      return getFoodImageUrl(randomItem.restaurant_id, randomItem.name);
    }
  }

  const first = menuItems.find((i) => i.name && i.restaurant_id);
  return first
    ? getFoodImageUrl(first.restaurant_id, first.name)
    : FALLBACK_IMAGE;
};

export const resolveItemImage = (item) => {
  if (!item) return FALLBACK_IMAGE;
  if (item.image) return item.image;
  return getFoodImageUrl(item.restaurant_id, item.name);
};

export const handleImgError = (e) => {
  e.target.onerror = null;
  e.target.src = FALLBACK_IMAGE;
};
export { FALLBACK_IMAGE };