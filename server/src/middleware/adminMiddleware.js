import Role from "../models/Role.js";

// Legacy hard check — use only where truly admin-only
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};

// RBAC-aware permission check
export const requirePermission = (resource, operation) => async (req, res, next) => {
  try {
    const role = await Role.findById(req.user.role);
    if (!role) return res.status(403).json({ message: "Role not found" });

    const perms = role.permissions.get(resource);
    if (!perms?.[operation]) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: "Permission check failed" });
  }
};