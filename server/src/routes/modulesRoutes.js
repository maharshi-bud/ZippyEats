// ============================================================
// FILE: server/src/routes/admin/modulesRoutes.js
// ── Module management + role resource sync ────────────────────
// ============================================================

import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { requirePermission, invalidateModuleCache } from "../../middleware/permissionMiddleware.js";
import Role from "../../models/Role.js";
import Module from "../../models/Module.js";

const router = express.Router();

// ── GET /admin/modules ────────────────────────────────────────
// Returns full module tree (parents + children) for web platform
// Used by: frontend permissions matrix, RoleForm
router.get("/modules", protect, async (req, res) => {
  try {
    const tree = await Module.getTree("web");
    res.json({ success: true, data: tree });
  } catch (err) {
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

// ── POST /admin/modules/sync ──────────────────────────────────
// Called by frontend ModuleSync on every app load.
// Syncs PARENT module keys into Role.permissions for all roles.
// Children inherit from parent — no separate child entries in Role.
router.post("/modules/sync", protect, async (req, res) => {
  try {
    const parentKeys = await Module.getParentKeys();
    if (!parentKeys.length) return res.json({ success: true, synced: 0 });

    const allRoles = await Role.find({});
    let synced = 0;

    for (const role of allRoles) {
      let changed = false;
      for (const key of parentKeys) {
        if (!role.permissions.has(key)) {
          const isSuperAdmin = role.name === "super_admin";
          const isAdmin = role.name === "admin";
          role.permissions.set(key, {
            add:    isSuperAdmin || isAdmin,
            view:   isSuperAdmin || isAdmin,
            edit:   isSuperAdmin || isAdmin,
            delete: isSuperAdmin,
          });
          changed = true;
          synced++;
          console.log(`[ModuleSync] Added "${key}" to role "${role.name}"`);
        }
      }
      if (changed) await role.save();
    }

    res.json({ success: true, synced });
  } catch (err) {
    console.error("[modules/sync] Error:", err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

// ── POST /admin/modules ───────────────────────────────────────
router.post("/modules", protect, requirePermission("users", "edit"), async (req, res) => {
  try {
    const { key, name, parentKey, index, icon, description, platform } = req.body;
    if (!key || !name) return res.status(400).json({ message: "key and name are required" });

    const existing = await Module.findOne({ key });
    if (existing) return res.status(409).json({ message: `Module "${key}" already exists` });

    const mod = await Module.create({
      key: key.toLowerCase().trim(),
      name, parentKey: parentKey || null,
      index: index ?? 0, icon: icon || null,
      description: description || null,
      platform: platform || "web",
    });

    // If parent module, auto-add to all roles
    if (!mod.parentKey) {
      const allRoles = await Role.find({});
      for (const role of allRoles) {
        if (!role.permissions.has(mod.key)) {
          const isSuperAdmin = role.name === "super_admin";
          const isAdmin = role.name === "admin";
          role.permissions.set(mod.key, {
            add: isSuperAdmin || isAdmin, view: isSuperAdmin || isAdmin,
            edit: isSuperAdmin || isAdmin, delete: isSuperAdmin,
          });
          await role.save();
        }
      }
    }

    invalidateModuleCache();
    res.status(201).json({ success: true, data: mod });
  } catch (err) {
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

// ── PUT /admin/modules/:key ───────────────────────────────────
router.put("/modules/:key", protect, requirePermission("users", "edit"), async (req, res) => {
  try {
    const mod = await Module.findOne({ key: req.params.key });
    if (!mod) return res.status(404).json({ message: "Module not found" });

    const { name, icon, description, index, platform, isActive } = req.body;
    if (name !== undefined) mod.name = name;
    if (icon !== undefined) mod.icon = icon;
    if (description !== undefined) mod.description = description;
    if (index !== undefined) mod.index = index;
    if (platform !== undefined) mod.platform = platform;
    if (isActive !== undefined) mod.isActive = isActive;

    await mod.save();
    invalidateModuleCache();
    res.json({ success: true, data: mod });
  } catch (err) {
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

// ── DELETE /admin/modules/:key — soft delete ──────────────────
router.delete("/modules/:key", protect, requirePermission("users", "edit"), async (req, res) => {
  try {
    const mod = await Module.findOne({ key: req.params.key });
    if (!mod) return res.status(404).json({ message: "Module not found" });

    mod.isActive = false;
    await mod.save();
    invalidateModuleCache();
    res.json({ success: true, message: `Module "${req.params.key}" deactivated` });
  } catch (err) {
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

export default router;