// ============================================================
// FILE: server/src/routes/admin/rolesRoutes.js
// ============================================================

import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { requirePermission } from "../../middleware/permissionMiddleware.js";
import {
  getRoles,
  getPermissionsList,
  createRole,
  updateRole,
  deleteRole,
} from "../../controllers/admin/rolesController.js";
import Role from "../../models/Role.js";  // ADD THIS
import {
  getUsersWithRoles,
  assignRole,
} from "../../controllers/admin/userRoleController.js";


// All routes require dashboard access (users resource view permission)
const router = express.Router();
router.use(protect);





// GET /admin/me/permissions — returns current user's own permissions (no extra permission needed)
// GET /admin/me/permissions — self-service, only needs valid token
router.get("/me/permissions", async (req, res) => {
  try {
    const role = await Role.findOne({ 
      name: req.user.role.toLowerCase(), 
      isActive: true 
    })
    .select("permissions name")
    .lean();

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    // Convert Map to plain object if needed
    let permissions = role.permissions;
    if (permissions instanceof Map) {
      permissions = Object.fromEntries(permissions);
    }

    res.json({ success: true, data: { permissions, role: role.name } });
  } catch (err) {
    console.error("[me/permissions] Error:", err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});







// ── Roles ─────────────────────────────────────────────────────
// View roles
router.get(
  "/roles",
  requirePermission("users", "view"),
  getRoles
);

// Get permission resources and operations
router.get(
  "/roles/resources",
  requirePermission("users", "view"),
  getPermissionsList
);

// Create new role
router.post(
  "/roles",
  requirePermission("users", "add"),
  createRole
);

// Update role
router.put(
  "/roles/:id",
  requirePermission("users", "edit"),
  updateRole
);

// Delete role
router.delete(
  "/roles/:id",
  requirePermission("users", "delete"),
  deleteRole
);

// ── Users ─────────────────────────────────────────────────────
// View users with roles
router.get(
  "/users",
  requirePermission("users", "view"),
  getUsersWithRoles
);

// Assign role to user
router.patch(
  "/users/:id/role",
  requirePermission("users", "edit"),
  assignRole
);




export default router;