const BASE_URL = "http://localhost:5010";
const FALLBACK_IMAGE = "https://via.placeholder.com/300x200?text=No+Image";

export const getFoodImageUrl = (restaurantId, itemName) => {
  if (!restaurantId || !itemName) return FALLBACK_IMAGE;
  
  // Convert spaces to underscores: "Vada Pav" → "Vada_Pav"
  const formattedName = itemName.replace(/\s+/g, "_");
  
  // Return: http://localhost:5010/images/r8_Vada_Pav.jpg
  return `${BASE_URL}/images/r${restaurantId}_${formattedName}.jpg`;
  
};

export const getRestaurantCoverImage = (menuItems) => {
  if (!menuItems || menuItems.length === 0) return FALLBACK_IMAGE;

  // try up to 5 times to get valid random
  for (let i = 0; i < 5; i++) {
    const randomItem =
      menuItems[Math.floor(Math.random() * menuItems.length)];

    if (randomItem?.name && randomItem?.restaurant_id) {
      return getFoodImageUrl(
        randomItem.restaurant_id,
        randomItem.name
      );
    }
  }

  // fallback to first valid item
  const first = menuItems.find(
    (i) => i.name && i.restaurant_id
  );

  console.log(first
    ? getFoodImageUrl(first.restaurant_id, first.name)
    : FALLBACK_IMAGE);
  return first
    ? getFoodImageUrl(first.restaurant_id, first.name)
    : FALLBACK_IMAGE;
};

export { FALLBACK_IMAGE };
