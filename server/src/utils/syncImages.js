import MenuItem from "../models/MenuItem.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || "http://localhost:5010";
const IMAGE_DIR = path.resolve(__dirname, "../../../food_images");

const getImageUrlSafe = (restaurantId, foodName) => {
  const formattedName = foodName.replace(/\s+/g, "_");
  const fileName = `${restaurantId}_${formattedName}.jpg`;
  const filePath = path.join(IMAGE_DIR, fileName);

  console.log(`🔍 Looking for: ${filePath}`);  // <-- ADD THIS

  if (fs.existsSync(filePath)) {
    return `${BASE_URL}/images/${fileName}`;
  }

  return null;
};

export const syncMenuImages = async () => {
  const items = await MenuItem.find();
  console.log(`📦 Total menu items: ${items.length}`);  // <-- ADD THIS

  // Log first few items to inspect structure
  items.slice(0, 3).forEach(item => {
    console.log(`  Item: "${item.name}" | restaurant_id: ${item.restaurant_id} | image: ${item.image}`);
  });

  // Log what files actually exist in food_images
  const existingFiles = fs.readdirSync(IMAGE_DIR);
  console.log(`🗂️ Files in food_images (first 5): ${existingFiles.slice(0, 5).join(", ")}`);

  let updated = 0;
  let skippedHasImage = 0;
  let skippedNoFile = 0;

  for (const item of items) {
    if (item.image) {
      skippedHasImage++;
      continue;
    }

    const image = getImageUrlSafe(item.restaurant_id.toString(), item.name);

    if (!image) {
      skippedNoFile++;
      continue;
    }

    await MenuItem.findByIdAndUpdate(item._id, { image });
    updated++;
  }

  console.log(`✅ Images synced: ${updated}`);
  console.log(`⏭️ Skipped (already had image): ${skippedHasImage}`);
  console.log(`❌ Skipped (no matching file): ${skippedNoFile}`);
};