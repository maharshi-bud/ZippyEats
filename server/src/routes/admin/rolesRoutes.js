// ============================================================
// FILE: server/src/routes/admin/rolesRoutes.js
// ============================================================

import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { requirePermission } from "../../middleware/permissionMiddleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";
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

// All routes here require being logged in + having USERS_VIEW_ALL
// (the minimum to even open the roles manager section).
// Write operations add a stricter permission on top.
router.use(protect);

// ── Roles ─────────────────────────────────────────────────────
router.get(
  "/roles",
  requirePermission(PERMISSIONS.USERS_VIEW_ALL),
  getRoles
);

router.get(
  "/roles/permissions",
  requirePermission(PERMISSIONS.USERS_VIEW_ALL),
  getPermissionsList
);

router.post(
  "/roles",
  requirePermission(PERMISSIONS.USERS_VIEW_ALL),
  createRole
);

router.put(
  "/roles/:id",
  requirePermission(PERMISSIONS.USERS_VIEW_ALL),
  updateRole
);

router.delete(
  "/roles/:id",
  requirePermission(PERMISSIONS.USERS_VIEW_ALL),
  deleteRole
);

// ── Users ─────────────────────────────────────────────────────
router.get(
  "/users",
  requirePermission(PERMISSIONS.USERS_VIEW_ALL),
  getUsersWithRoles
);

router.patch(
  "/users/:id/role",
  requirePermission(PERMISSIONS.USERS_VIEW_ALL),
  assignRole
);

export default router;