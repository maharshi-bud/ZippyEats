// ============================================================
// FILE: server/src/middleware/permissionMiddleware.js
// NEW: Handles matrix-based (CRUD) permission checks
// ============================================================
// Usage (must come AFTER protect):
//
// NEW API:
//   import { requirePermission } from "../middleware/permissionMiddleware.js";
//   router.get("/admin/menu", protect, requirePermission("menu", "view"), getMenu);
//   router.post("/admin/menu", protect, requirePermission("menu", "add"), createMenu);
//   router.put("/admin/menu/:id", protect, requirePermission("menu", "edit"), updateMenu);
//   router.delete("/admin/menu/:id", protect, requirePermission("menu", "delete"), deleteMenu);
//
// Multiple operations (user must have ANY):
//   router.get("/admin/items", protect, requirePermission("menu", ["view", "add"]), handler);
//
// ============================================================

import Role from "../models/Role.js";
import { PANEL_ACCESS, PANEL_ACCESS_ROLES, PERMISSIONS } from "../constants/permissions.js";

// ── In-process role cache ─────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000;
const roleCache = new Map(); // Map<roleName, { permissions: Map, expiresAt: number }>
const builtInPanelAccessRoles = new Set(PANEL_ACCESS_ROLES);

function hasBuiltInPanelAccess(roleName, checks) {
  return (
    builtInPanelAccessRoles.has(roleName) &&
    checks.some(
      ({ resource, operation }) =>
        resource === PANEL_ACCESS.resource && operation === PANEL_ACCESS.operation
    )
  );
}

async function getPermissionsForRole(roleName) {
  const cached = roleCache.get(roleName);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.permissions;
  }

  const role = await Role.findOne({ name: roleName.toLowerCase(), isActive: true })
    .select("permissions")
    .lean();

    
 console.log("[Permission] Looking for role:", roleName.toLowerCase(), "→ found:", role ? role._id : "NULL");  // ADD THIS
  if (role) console.log("[Permission] queries perms:", role.permissions?.queries ?? role.permissions?.get?.("queries")); // ADD THIS
  if (!role) return null;

  // Convert permissions Map to plain object if needed
  let permsObj = role.permissions;
  if (permsObj instanceof Map) {
    permsObj = Object.fromEntries(permsObj);
  }

  roleCache.set(roleName, {
    permissions: permsObj,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return permsObj;
}

// ── Cache invalidation ────────────────────────────────────────
export function invalidateRoleCache(roleName) {
  if (roleName) {
    roleCache.delete(roleName);
  } else {
    roleCache.clear();
  }
}

// ── NEW: requirePermission factory for CRUD operations ────────
// Usage:
//   requirePermission("menu", "view")       // single operation
//   requirePermission("menu", ["view", "add"]) // ANY operation
//   requirePermission({resource, operation}) // old object style for backward compat
//
export function requirePermission(resourceOrPermObj, operationOrUndefined) {
  let checks = [];

  // Handle legacy object style (backward compat with old PERMISSIONS object)
  if (typeof resourceOrPermObj === "object" && resourceOrPermObj !== null && operationOrUndefined === undefined) {
    if (resourceOrPermObj.resource && resourceOrPermObj.operation) {
      checks.push(resourceOrPermObj);
    } else {
      throw new Error("[requirePermission] Invalid permission object format");
    }
  } else if (typeof resourceOrPermObj === "string") {
    // NEW: (resource, operation) format
    const resource = resourceOrPermObj;
    const operations = Array.isArray(operationOrUndefined)
      ? operationOrUndefined
      : [operationOrUndefined];

    checks = operations.map((op) => ({ resource, operation: op }));
  } else {
    throw new Error("[requirePermission] Invalid arguments. Use (resource, operation) or (resource, [operations])");
  }

  if (!checks.length) {
    throw new Error("[requirePermission] At least one permission check required");
  }

  return async function permissionGuard(req, res, next) {
    try {
      if (!req.user?.role) {
        return res.status(401).json({ message: "Not authorized" });
      }

      if (hasBuiltInPanelAccess(req.user.role, checks)) {
        return next();
      }

      const permissions = await getPermissionsForRole(req.user.role);

      if (!permissions) {
        console.warn(
          `[Permission] Role "${req.user.role}" not found in DB. Did you run Role.seedDefaults()?`
        );
        return res.status(403).json({
          message: "Forbidden — role not configured",
        });
      }

      // Check each required permission
      let hasAny = false;
      const failures = [];

      for (const check of checks) {
        const { resource, operation } = check;
        const resourcePerms = permissions[resource];

        if (resourcePerms && resourcePerms[operation] === true) {
          hasAny = true;
          break; // user has at least one required permission
        } else {
          failures.push({ resource, operation });
        }
      }

      if (!hasAny) {
        return res.status(403).json({
          message: "Forbidden — insufficient permissions",
          ...(process.env.NODE_ENV !== "production" && {
            required: checks,
            failures,
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

// ── Legacy: REQUIRE ALL permissions for backward compat ─────
// For code that calls requirePermission(PERMISSIONS.X, PERMISSIONS.Y, ...)
// and expects ALL to be required
//
export function requireAllPermissions(...requiredPerms) {
  if (!requiredPerms.length) {
    throw new Error("[requireAllPermissions] At least one permission required");
  }

  return async function permissionGuard(req, res, next) {
    try {
      if (!req.user?.role) {
        return res.status(401).json({ message: "Not authorized" });
      }

      let checks = requiredPerms.map((permSlug) => {
        if (typeof permSlug === "object" && permSlug.resource && permSlug.operation) {
          return permSlug;
        }
        const mapped = PERMISSIONS[permSlug];
        if (!mapped) {
          throw new Error(`Unknown permission: ${permSlug}`);
        }
        return mapped;
      });

      if (hasBuiltInPanelAccess(req.user.role, checks)) {
        return next();
      }

      const permissions = await getPermissionsForRole(req.user.role);

      if (!permissions) {
        console.warn(
          `[Permission] Role "${req.user.role}" not found in DB. Did you run Role.seedDefaults()?`
        );
        return res.status(403).json({
          message: "Forbidden — role not configured",
        });
      }

      // ALL must be present
      let allPresent = true;
      const failures = [];

      for (const check of checks) {
        const { resource, operation } = check;
        const resourcePerms = permissions[resource];

        if (!resourcePerms || resourcePerms[operation] !== true) {
          allPresent = false;
          failures.push({ resource, operation });
        }
      }

      if (!allPresent) {
        return res.status(403).json({
          message: "Forbidden — insufficient permissions",
          ...(process.env.NODE_ENV !== "production" && {
            required: checks,
            failures,
            role: req.user.role,
          }),
        });
      }

      next();
    } catch (err) {
      console.error("[Permission] Middleware error:", err);
      return res.status(500).json({ message: "Server error 12" });
    }
  };
}
