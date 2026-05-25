// ============================================================
// FILE: server/src/models/Role.js
// ============================================================

import mongoose from "mongoose";
import { ALL_PERMISSIONS, ROLE_PERMISSIONS } from "../constants/permissions.js";

const roleSchema = new mongoose.Schema(
  {
    // ── Identity ─────────────────────────────────────────────
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // Matches the existing User.role enum values + super_admin.
      // Custom roles (created from the UI) can be any unique string.
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

    // ── Permissions ───────────────────────────────────────────
    permissions: {
      type: [String],
      enum: ALL_PERMISSIONS, // enforces only known slugs are stored
      default: [],
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
 * Check whether this role has a specific permission.
 * Usage: role.hasPermission(PERMISSIONS.ORDERS_VIEW_ALL)
 */
roleSchema.methods.hasPermission = function (slug) {
  return this.permissions.includes(slug);
};

/**
 * Check whether this role has ALL of the given permissions.
 * Usage: role.hasAll([PERMISSIONS.SUPPORT_REFUND, PERMISSIONS.ORDERS_EDIT_ITEMS])
 */
roleSchema.methods.hasAll = function (slugs) {
  return slugs.every((s) => this.permissions.includes(s));
};

/**
 * Check whether this role has ANY of the given permissions.
 */
roleSchema.methods.hasAny = function (slugs) {
  return slugs.some((s) => this.permissions.includes(s));
};

// ── Static: seed default roles ────────────────────────────────
/**
 * Call once at server startup (after DB connect) to ensure the
 * four system roles exist.  Safe to call on every boot — it uses
 * upsert so existing documents are only updated if permissions
 * have changed.
 *
 * Usage in server/src/index.js:
 *   import Role from "./models/Role.js";
 *   await Role.seedDefaults();
 */
roleSchema.statics.seedDefaults = async function () {
  const defaults = [
    {
      name: "user",
      label: "Customer",
      description: "Regular app user — can browse, order, and raise support tickets.",
      permissions: ROLE_PERMISSIONS.user,
      isSystem: true,
    },
    {
      name: "restaurant",
      label: "Restaurant Owner",
      description: "Manages their own restaurant menu and incoming orders.",
      permissions: ROLE_PERMISSIONS.restaurant,
      isSystem: true,
    },
    {
      name: "admin",
      label: "Admin",
      description: "Full platform management except role assignment and user deletion.",
      permissions: ROLE_PERMISSIONS.admin,
      isSystem: true,
    },
    {
      name: "super_admin",
      label: "Super Admin",
      description: "Unrestricted access. Can manage roles and users.",
      permissions: ROLE_PERMISSIONS.super_admin,
      isSystem: true,
    },
  ];

  for (const role of defaults) {
    await Role.findOneAndUpdate(
      { name: role.name },
      { $set: role },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log("[Role] Default roles seeded ✓");
};

const Role = mongoose.model("Role", roleSchema);

export default Role;