// ============================================================
// FILE: server/src/controllers/admin/rolesController.js
// ============================================================

import Role from "../../models/Role.js";
import User from "../../models/User.js";
import { ALL_PERMISSIONS } from "../../constants/permissions.js";
import { invalidateRoleCache } from "../../middleware/permissionMiddleware.js";

// ── GET /api/admin/roles ──────────────────────────────────────
// List all roles with a user count per role
export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().lean();

    // attach user count to each role
    const counts = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));

    const data = roles.map((r) => ({
      ...r,
      userCount: countMap[r.name] || 0,
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error("[Roles] getRoles:", err);
    res.status(500).json({ message: "Failed to fetch roles" });
  }
};

// ── GET /api/admin/roles/permissions ─────────────────────────
// Return the full permission slug list — used by the UI to
// render the permission checkboxes when creating/editing a role
export const getPermissionsList = async (req, res) => {
  res.json({ success: true, data: ALL_PERMISSIONS });
};

// ── POST /api/admin/roles ─────────────────────────────────────
export const createRole = async (req, res) => {
  try {
    const { name, label, description, permissions } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Role name is required" });
    }

    // validate every slug sent
    const invalid = (permissions || []).filter((p) => !ALL_PERMISSIONS.includes(p));
    if (invalid.length) {
      return res.status(400).json({ message: "Invalid permissions", invalid });
    }

    const existing = await Role.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: "A role with that name already exists" });
    }

    const role = await Role.create({
      name: name.trim(),
      label: label?.trim() || name.trim(),
      description: description?.trim() || "",
      permissions: permissions || [],
      isSystem: false,
    });

    res.status(201).json({ success: true, data: role });
  } catch (err) {
    console.error("[Roles] createRole:", err);
    res.status(500).json({ message: "Failed to create role" });
  }
};

// ── PUT /api/admin/roles/:id ──────────────────────────────────
export const updateRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    const { label, description, permissions } = req.body;

    // validate slugs
    if (permissions) {
      const invalid = permissions.filter((p) => !ALL_PERMISSIONS.includes(p));
      if (invalid.length) {
        return res.status(400).json({ message: "Invalid permissions", invalid });
      }
      role.permissions = permissions;
    }

    if (label !== undefined) role.label = label.trim();
    if (description !== undefined) role.description = description.trim();

    await role.save();

    // bust cache so changes take effect immediately
    invalidateRoleCache(role.name);

    res.json({ success: true, data: role });
  } catch (err) {
    console.error("[Roles] updateRole:", err);
    res.status(500).json({ message: "Failed to update role" });
  }
};

// ── DELETE /api/admin/roles/:id ───────────────────────────────
export const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    if (role.isSystem) {
      return res.status(403).json({
        message: `"${role.name}" is a system role and cannot be deleted`,
      });
    }

    // check no users are still on this role
    const usersOnRole = await User.countDocuments({ role: role.name });
    if (usersOnRole > 0) {
      return res.status(400).json({
        message: `Cannot delete — ${usersOnRole} user(s) still have this role. Reassign them first.`,
      });
    }

    await role.deleteOne();
    invalidateRoleCache(role.name);

    res.json({ success: true, message: "Role deleted" });
  } catch (err) {
    console.error("[Roles] deleteRole:", err);
    res.status(500).json({ message: "Failed to delete role" });
  }
};