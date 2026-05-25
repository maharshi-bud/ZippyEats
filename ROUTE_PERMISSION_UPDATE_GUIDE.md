// ============================================================
// ROUTE PERMISSION UPDATE GUIDE
// ============================================================
// BEFORE (old string-based permissions):
//   router.get("/admin/orders", protect, requirePermission(PERMISSIONS.ORDERS_VIEW_ALL), handler);
//
// AFTER (new CRUD-based permissions):
//   router.get("/admin/orders", protect, requirePermission("orders", "view"), handler);
//   router.post("/admin/orders", protect, requirePermission("orders", "add"), handler);
//   router.put("/admin/orders/:id", protect, requirePermission("orders", "edit"), handler);
//   router.delete("/admin/orders/:id", protect, requirePermission("orders", "delete"), handler);
//
// MULTIPLE OPERATIONS (user needs at least one):
//   router.get("/admin/items", protect, requirePermission("menu", ["view", "add"]), handler);
//
// ============================================================

// RESOURCE MAPPING:
// dashboard    → Admin panel access
// users        → User management
// restaurants  → Restaurant management
// menu         → Menu/items management
// banners      → Banners management
// orders       → Orders management
// queries      → Support tickets / queries
// bi           → Business Intelligence / Analytics

// ============================================================
// EXAMPLE: Update /server/src/routes/admin/menuRoutes.js
// ============================================================

import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { requirePermission } from "../../middleware/permissionMiddleware.js";
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../../controllers/admin/menuController.js";

const router = express.Router();

// View menu items (requires view permission)
router.get("/", protect, requirePermission("menu", "view"), getMenuItems);

// Create menu item (requires add permission)
router.post("/", protect, requirePermission("menu", "add"), createMenuItem);

// Update menu item (requires edit permission)
router.put("/:id", protect, requirePermission("menu", "edit"), updateMenuItem);

// Delete menu item (requires delete permission)
router.delete("/:id", protect, requirePermission("menu", "delete"), deleteMenuItem);

export default router;

// ============================================================
// MIGRATION CHECKLIST FOR ALL ROUTES:
// ============================================================
// 1. Find all requirePermission() calls
// 2. Replace PERMISSIONS.X with ("resource", "operation")
// 3. Test with new permission system
// 4. Verify dashboard sidebar shows only accessible items
// 5. Verify /admin/roles page works with permission matrix
