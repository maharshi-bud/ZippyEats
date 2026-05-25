// ============================================================
// FILE: server/src/middleware/permissionMiddleware.js
// ============================================================
// Usage (must come AFTER protect):
//
//   import { requirePermission } from "../middleware/permissionMiddleware.js";
//   import { PERMISSIONS } from "../constants/permissions.js";
//
//   // single permission
//   router.get("/admin/orders/:id", protect, requirePermission(PERMISSIONS.ORDERS_VIEW_ALL), getOrderById);
//
//   // multiple — user must have ALL of them
//   router.post("/refund", protect, requirePermission(PERMISSIONS.SUPPORT_REFUND, PERMISSIONS.ORDERS_EDIT_ITEMS), handler);
// ============================================================

import Role from "../models/Role.js";

// ── In-process role cache ─────────────────────────────────────
// Avoids a DB round-trip on every request for the same role name.
// TTL: 5 minutes — short enough to pick up live role edits from the UI.
const CACHE_TTL_MS = 5 * 60 * 1000;

const roleCache = new Map(); // Map<roleName, { permissions: string[], expiresAt: number }>

async function getPermissionsForRole(roleName) {
  const cached = roleCache.get(roleName);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.permissions;
  }

  const role = await Role.findOne({ name: roleName, isActive: true })
    .select("permissions")
    .lean();

  if (!role) return null; // role not found in DB

  roleCache.set(roleName, {
    permissions: role.permissions,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return role.permissions;
}

// ── Cache invalidation ────────────────────────────────────────
// Call this from the roles controller after any role update
// so the cache doesn't serve stale permissions.
//
//   import { invalidateRoleCache } from "../middleware/permissionMiddleware.js";
//   await Role.findByIdAndUpdate(id, { permissions: [...] });
//   invalidateRoleCache(roleName);
//
export function invalidateRoleCache(roleName) {
  if (roleName) {
    roleCache.delete(roleName);
  } else {
    roleCache.clear(); // no arg → flush everything
  }
}

// ── requirePermission factory ─────────────────────────────────
// Accepts one or more permission slugs.
// If multiple are passed the user must have ALL of them.
//
export function requirePermission(...requiredSlugs) {
  if (!requiredSlugs.length) {
    throw new Error("[requirePermission] At least one permission slug is required.");
  }

  return async function permissionGuard(req, res, next) {
    try {
      // protect() must run first
      if (!req.user?.role) {
        return res.status(401).json({ message: "Not authorized" });
      }

      const permissions = await getPermissionsForRole(req.user.role);

      // Role doesn't exist in the Role collection yet
      // (e.g. legacy "admin" row not seeded) — fail closed
      if (!permissions) {
        console.warn(
          `[Permission] Role "${req.user.role}" not found in DB. ` +
          `Did you run Role.seedDefaults()?`
        );
        return res.status(403).json({
          message: "Forbidden — role not configured",
        });
      }

      const missing = requiredSlugs.filter((s) => !permissions.includes(s));

      if (missing.length > 0) {
        return res.status(403).json({
          message: "Forbidden — insufficient permissions",
          // only expose in non-production to aid debugging
          ...(process.env.NODE_ENV !== "production" && {
            required: requiredSlugs,
            missing,
            role: req.user.role,
          }),
        });
      }

      next();
    } catch (err) {
      console.error("[Permission] Middleware error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  };
}