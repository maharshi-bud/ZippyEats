// ============================================================
// FILE: server/src/routes/admin/modulesRoutes.js
// ── POST /api/admin/modules/sync ─────────────────────────────
// Called by the frontend (ModuleSync component) on every app
// load. Adds any new resource keys to all existing roles.
// ============================================================

import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import Role from "../../models/Role.js";

const router = express.Router();

router.post("/modules/sync", protect, async (req, res) => {
  try {
    const { resources } = req.body;

    if (!Array.isArray(resources) || resources.length === 0) {
      return res.status(400).json({ message: "resources array required" });
    }

    const allRoles = await Role.find({});
    let synced = 0;

    for (const role of allRoles) {
      let changed = false;

      for (const resource of resources) {
        if (!role.permissions.has(resource)) {
          // New resource — determine default access level
          const isSuperAdmin = role.name === "super_admin";
          const isAdmin      = role.name === "admin";

          role.permissions.set(resource, {
            add:    isSuperAdmin || isAdmin,
            view:   isSuperAdmin || isAdmin,
            edit:   isSuperAdmin || isAdmin,
            delete: isSuperAdmin,           // only super_admin gets delete by default
          });

          changed = true;
          synced++;
          console.log(`[ModuleSync] Added "${resource}" to role "${role.name}"`);
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

export default router;