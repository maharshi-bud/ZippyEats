// ============================================================
// FILE: server/src/middleware/permissionMiddleware.js
// ── Matrix-based CRUD permission checks with parent resolution
// ============================================================
// Usage (must come AFTER protect):
//
//   requirePermission("orders", "view")
//   requirePermission("roles", "edit")    // roles is child of users → checks users.edit
//   requirePermission("menu", ["view", "add"])  // ANY operation
//
// ============================================================

import Role from "../models/Role.js";
import Module from "../models/module.js";
import { PANEL_ACCESS, PANEL_ACCESS_ROLES } from "../constants/permissions.js";

// ── Caches ────────────────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000;

// Role permissions cache: Map<roleName, { permissions, expiresAt }>
const roleCache = new Map();

// Module parent cache: Map<childKey, parentKey | null>
// Populated once on first use, cleared when modules change
const moduleParentCache = new Map();
let moduleParentCacheLoaded = false;

const builtInPanelAccessRoles = new Set(PANEL_ACCESS_ROLES);

// ── Cache invalidation ────────────────────────────────────────
export function invalidateRoleCache(roleName) {
  if (roleName) roleCache.delete(roleName);
  else roleCache.clear();
}

export function invalidateModuleCache() {
  moduleParentCache.clear();
  moduleParentCacheLoaded = false;
}

// ── Internal: load module parent map from DB ──────────────────
async function ensureModuleParentCache() {
  if (moduleParentCacheLoaded) return;

  const modules = await Module.find({ isActive: true }).select("key parentKey").lean();
  for (const mod of modules) {
    moduleParentCache.set(mod.key, mod.parentKey ?? null);
  }
  moduleParentCacheLoaded = true;
}

// ── Internal: resolve resource to the key stored in Role.permissions
// If resource is a child module, returns its parentKey instead.
// Role.permissions only stores parent-level keys.
// Example: "roles" (child of "users") → resolves to "users"
async function resolvePermissionKey(resourceKey) {
  await ensureModuleParentCache();

  const parentKey = moduleParentCache.get(resourceKey);

  if (parentKey === undefined) {
    // Not in module cache — treat as direct resource key
    return resourceKey;
  }

  if (parentKey === null) {
    // It's already a parent module
    return resourceKey;
  }

  // It's a child — return parent key
  return parentKey;
}

// ── Internal: get permissions for a role (with cache) ─────────
async function getPermissionsForRole(roleName) {
  const cached = roleCache.get(roleName);
  if (cached && cached.expiresAt > Date.now()) return cached.permissions;

  const role = await Role.findOne({ name: roleName.toLowerCase(), isActive: true })
    .select("permissions")
    .lean();

  if (!role) return null;

  // Convert Map to plain object if needed
  let permsObj = role.permissions;
  if (permsObj instanceof Map) {
    permsObj = Object.fromEntries(permsObj);
  } else if (typeof permsObj === "object" && !(permsObj instanceof Map)) {
    // Already plain object (from .lean())
    // MongoDB stores Map as object when using .lean()
    permsObj = permsObj;
  }

  roleCache.set(roleName, {
    permissions: permsObj,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return permsObj;
}

// ── Internal: built-in panel access bypass ────────────────────
function hasBuiltInPanelAccess(roleName, checks) {
  return (
    builtInPanelAccessRoles.has(roleName) &&
    checks.some(
      ({ resource, operation }) =>
        resource === PANEL_ACCESS.resource && operation === PANEL_ACCESS.operation
    )
  );
}

// ── requirePermission factory ─────────────────────────────────
// Usage:
//   requirePermission("orders", "view")
//   requirePermission("roles", "edit")        // child → resolves to users.edit
//   requirePermission("menu", ["view", "add"]) // ANY of these operations
//   requirePermission({ resource, operation }) // legacy object style
//
export function requirePermission(resourceOrPermObj, operationOrUndefined) {
  let checks = [];

  if (
    typeof resourceOrPermObj === "object" &&
    resourceOrPermObj !== null &&
    operationOrUndefined === undefined
  ) {
    if (resourceOrPermObj.resource && resourceOrPermObj.operation) {
      checks.push(resourceOrPermObj);
    } else {
      throw new Error("[requirePermission] Invalid permission object format");
    }
  } else if (typeof resourceOrPermObj === "string") {
    const resource = resourceOrPermObj;
    const operations = Array.isArray(operationOrUndefined)
      ? operationOrUndefined
      : [operationOrUndefined];
    checks = operations.map((op) => ({ resource, operation: op }));
  } else {
    throw new Error("[requirePermission] Invalid arguments");
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
        console.warn(`[Permission] Role "${req.user.role}" not found in DB`);
        return res.status(403).json({ message: "Forbidden — role not configured" });
      }

      let hasAny = false;
      const failures = [];

      for (const check of checks) {
        // Resolve child resource to parent key
        const resolvedKey = await resolvePermissionKey(check.resource);
        const resourcePerms = permissions[resolvedKey];

        if (resourcePerms && resourcePerms[check.operation] === true) {
          hasAny = true;
          break;
        } else {
          failures.push({ resource: check.resource, resolvedAs: resolvedKey, operation: check.operation });
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

// ── requireAllPermissions (legacy) ───────────────────────────
export function requireAllPermissions(...requiredPerms) {
  if (!requiredPerms.length) {
    throw new Error("[requireAllPermissions] At least one permission required");
  }

  return async function permissionGuard(req, res, next) {
    try {
      if (!req.user?.role) {
        return res.status(401).json({ message: "Not authorized" });
      }

      const { PERMISSIONS } = await import("../constants/permissions.js");

      let checks = requiredPerms.map((permSlug) => {
        if (typeof permSlug === "object" && permSlug.resource && permSlug.operation) {
          return permSlug;
        }
        const mapped = PERMISSIONS[permSlug];
        if (!mapped) throw new Error(`Unknown permission: ${permSlug}`);
        return mapped;
      });

      if (hasBuiltInPanelAccess(req.user.role, checks)) return next();

      const permissions = await getPermissionsForRole(req.user.role);
      if (!permissions) {
        return res.status(403).json({ message: "Forbidden — role not configured" });
      }

      let allPresent = true;
      const failures = [];

      for (const check of checks) {
        const resolvedKey = await resolvePermissionKey(check.resource);
        const resourcePerms = permissions[resolvedKey];
        if (!resourcePerms || resourcePerms[check.operation] !== true) {
          allPresent = false;
          failures.push(check);
        }
      }

      if (!allPresent) {
        return res.status(403).json({
          message: "Forbidden — insufficient permissions",
          ...(process.env.NODE_ENV !== "production" && { failures }),
        });
      }

      next();
    } catch (err) {
      console.error("[Permission] Middleware error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  };
}