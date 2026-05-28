// ============================================================
// FILE: server/src/controllers/admin/rolesController.js
// NEW: Handles the matrix-based (CRUD) permission system
// ============================================================

import Role from "../../models/Role.js";
import User from "../../models/User.js";
import {  OPERATIONS, DEFAULT_PERMISSIONS } from "../../constants/permissions.js";
import { invalidateRoleCache } from "../../middleware/permissionMiddleware.js";
import Module from "../../models/module.js";

// ── GET /api/admin/roles ──────────────────────────────────────
// List all roles with a user count and formatted permissions
export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().lean();

    // attach user count to each role
    const counts = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));

    const data = roles.map((r) => {
      // Convert Map to plain object for JSON response
      const permsObj = {};
      if (r.permissions && typeof r.permissions === 'object') {
        for (const [key, value] of Object.entries(r.permissions)) {
          permsObj[key] = value;
        }
      }

      return {
        ...r,
        permissions: permsObj,
        userCount: countMap[r.name] || 0,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error("[Roles] getRoles:", err);
    res.status(500).json({ message: "Failed to fetch roles" });
  }
};

// ── GET /api/admin/roles/resources ───────────────────────────
// Return available resources and operations for the UI
export async function getPermissionsList(req, res) {
  try {
    const tree = await Module.getTree("web");
    const parentKeys = tree.map((m) => m.key);

    res.json({
      success: true,
      data: {
        tree,
        resources: parentKeys,
        operations: ["add", "view", "edit", "delete"],
      },
    });
  } catch (err) {
    console.error("[getPermissionsList] Error:", err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
}

// ── POST /api/admin/roles ─────────────────────────────────────
// Create a new custom role with matrix permissions
export const createRole = async (req, res) => {
  try {
    const { name, label, description, permissions } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Role name is required" });
    }

    // Validate permissions structure
    if (permissions && typeof permissions === 'object') {
      for (const [resource, ops] of Object.entries(permissions)) {
        if (!RESOURCES.includes(resource)) {
          return res.status(400).json({
            message: `Invalid resource: ${resource}`,
          });
        }
        if (typeof ops !== 'object') {
          return res.status(400).json({
            message: `Permissions for ${resource} must be an object`,
          });
        }
        for (const [op, val] of Object.entries(ops)) {
          if (!OPERATIONS.includes(op)) {
            return res.status(400).json({
              message: `Invalid operation: ${op}`,
            });
          }
          if (typeof val !== 'boolean') {
            return res.status(400).json({
              message: `${resource}.${op} must be a boolean`,
            });
          }
        }
      }
    }

    const existing = await Role.findOne({ name: name.trim().toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "A role with that name already exists" });
    }

    // Build permissions map from request
    const permissionsMap = new Map();
    if (permissions) {
      for (const [resource, ops] of Object.entries(permissions)) {
        permissionsMap.set(resource, {
          add: ops.add || false,
          view: ops.view || false,
          edit: ops.edit || false,
          delete: ops.delete || false,
        });
      }
    }

    // Ensure all resources are present
    for (const resource of RESOURCES) {
      if (!permissionsMap.has(resource)) {
        permissionsMap.set(resource, {
          add: false,
          view: false,
          edit: false,
          delete: false,
        });
      }
    }

    const role = await Role.create({
      name: name.trim().toLowerCase(),
      label: label?.trim() || name.trim(),
      description: description?.trim() || "",
      permissions: permissionsMap,
      isSystem: false,
    });

    res.status(201).json({ success: true, data: role });
  } catch (err) {
    console.error("[Roles] createRole:", err);
    res.status(500).json({ message: "Failed to create role" });
  }
};

// ── PUT /api/admin/roles/:id ──────────────────────────────────
// Update role name, description, and permissions
export async function updateRole(req, res) {
  try {
    const { label, description, permissions } = req.body;
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });
 
    if (label !== undefined) role.label = label;
    if (description !== undefined) role.description = description;
 
    if (permissions) {
      // Only update parent-level keys (children inherit)
      const parentKeys = await Module.getParentKeys();
      for (const key of parentKeys) {
        if (permissions[key]) {
          role.permissions.set(key, {
            add:    permissions[key].add    ?? false,
            view:   permissions[key].view   ?? false,
            edit:   permissions[key].edit   ?? false,
            delete: permissions[key].delete ?? false,
          });
        }
      }
    }
 
    await role.save();
    invalidateRoleCache(role.name); // clear cache so changes take effect immediately
 
    res.json({ success: true, data: role });
  } catch (err) {
    res.status(500).json({ message: "Server error", detail: err.message });
  }
}
 


// ── DELETE /api/admin/roles/:id ───────────────────────────────
// Delete a custom role (cannot delete system roles)
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