// ============================================================
// FILE: server/src/models/Role.js
// ============================================================

import mongoose from "mongoose";
import { OPERATIONS, DEFAULT_PERMISSIONS } from "../constants/permissions.js";

const roleSchema = new mongoose.Schema(
  {
    // ── Identity ─────────────────────────────────────────────
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    label: {
      // Human-readable display name, e.g. "Restaurant Owner"
      type: String,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    // ── Permissions (NEW: Matrix structure) ────────────────────
    // Structure:
    // {
    //   dashboard: { add: false, view: true, edit: false, delete: false },
    //   menu: { add: true, view: true, edit: true, delete: true },
    //   users: { add: false, view: true, edit: false, delete: false },
    //   ... (one entry per resource)
    // }
    permissions: {
      type: Map,
      of: new mongoose.Schema(
        {
          add: { type: Boolean, default: false },
          view: { type: Boolean, default: false },
          edit: { type: Boolean, default: false },
          delete: { type: Boolean, default: false },
        },
        { _id: false }
      ),
      default: () => new Map(),
    },

    // ── Flags ─────────────────────────────────────────────────
    isSystem: {
      // true  → seeded by the app (user / restaurant / admin / super_admin)
      //         these cannot be deleted from the UI
      // false → created by an admin via the roles manager UI
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ── Helpers ───────────────────────────────────────────────────

/**
 * Check whether this role has a specific CRUD operation on a resource.
 * Usage: role.can("menu", "edit")  →  boolean
 */
roleSchema.methods.can = function (resource, operation) {
  if (!this.permissions || !this.permissions.has(resource)) return false;
  const perms = this.permissions.get(resource);
  return perms && perms[operation] === true;
};

/**
 * Check whether this role has ANY permission on a resource.
 * Usage: role.canAny("menu")  →  boolean
 */
roleSchema.methods.canAny = function (resource) {
  if (!this.permissions || !this.permissions.has(resource)) return false;
  const perms = this.permissions.get(resource);
  return Object.values(perms).some((v) => v === true);
};

/**
 * Grant permission for a specific operation on a resource.
 * Usage: role.grant("menu", "edit")
 */
roleSchema.methods.grant = function (resource, operation) {
  if (!this.permissions.has(resource)) {
    this.permissions.set(resource, {
      add: false,
      view: false,
      edit: false,
      delete: false,
    });
  }
  const perms = this.permissions.get(resource);
  perms[operation] = true;
  this.permissions.set(resource, perms);
};

/**
 * Revoke permission for a specific operation on a resource.
 * Usage: role.revoke("menu", "edit")
 */
roleSchema.methods.revoke = function (resource, operation) {
  if (!this.permissions.has(resource)) return;
  const perms = this.permissions.get(resource);
  perms[operation] = false;
  this.permissions.set(resource, perms);
};

// ── Static: seed default roles ────────────────────────────────
roleSchema.statics.seedDefaults = async function () {
  const defaults = [
    {
      name: "user",
      label: "Customer",
      description: "Regular app user — can browse, order, and raise support tickets.",
      permissions: DEFAULT_PERMISSIONS.user,
      isSystem: true,
    },
    {
      name: "restaurant",
      label: "Restaurant Owner",
      description: "Manages their own restaurant menu and incoming orders.",
      permissions: DEFAULT_PERMISSIONS.restaurant,
      isSystem: true,
    },
    {
      name: "admin",
      label: "Admin",
      description: "Full platform management.",
      permissions: DEFAULT_PERMISSIONS.admin,
      isSystem: true,
    },
    {
      name: "super_admin",
      label: "Super Admin",
      description: "Unrestricted access. Can manage roles and users.",
      permissions: DEFAULT_PERMISSIONS.super_admin,
      isSystem: true,
    },
  ];

  for (const role of defaults) {
    const permMap = new Map(Object.entries(role.permissions));
    await this.findOneAndUpdate(
      { name: role.name },
      {
        $set: {
          ...role,
          permissions: permMap,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log("[Role] Default roles seeded ✓");
};

const Role = mongoose.model("Role", roleSchema);

export default Role;