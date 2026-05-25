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
import {
  getUsersWithRoles,
  assignRole,
} from "../../controllers/admin/userRoleController.js";

const router = express.Router();

// All routes require dashboard access (users resource view permission)
router.use(protect);

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