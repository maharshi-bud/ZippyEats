// ============================================================
// FILE: server/src/models/Module.js
// ── Single source of truth for all permission resources ───────
// Adding a new module here = it gets synced into all roles in DB
// on next server start via Module.seedDefaults()
// ============================================================

import mongoose from "mongoose";
export const DEFAULT_MODULES = [
  // ── Top-level panel modules ───────────────────────────────
  {
    key: "dashboard",
    name: "Dashboard",
    parentKey: null,
    index: 1,
    icon: "layout-dashboard",
    description: "Overview and analytics dashboard",
    platform: "web",
  },
  {
  key: "coupons",
  name: "Coupons",
  parentKey: null,
  index: 8,
  icon: "ticket-percent",
  description: "Manage coupon campaigns and discounts",
  platform: "web",
},
  {
    key: "orders",
    name: "Orders",
    parentKey: null,
    index: 2,
    icon: "shopping-bag",
    description: "Manage customer orders",
    platform: "web",
  },
  {
    key: "users",
    name: "Users & Staff",
    parentKey: null,
    index: 3,
    icon: "users",
    description: "Manage users, staff, and roles",
    platform: "web",
  },
  // ── Users children ────────────────────────────────────────
  {
    key: "staff",
    name: "Staff",
    parentKey: "users",
    index: 1,
    icon: "user-check",
    description: "Manage admin panel staff accounts",
    platform: "web",
  },

  {
    key: "roles",
    name: "Roles & Permissions",
    parentKey: "users",
    index: 2,
    icon: "shield",
    description: "Manage RBAC roles and permissions",
    platform: "web",
  },
  // ── More top-level modules ────────────────────────────────
  {
    key: "restaurants",
    name: "Restaurants",
    parentKey: null,
    index: 4,
    icon: "store",
    description: "Manage restaurant listings",
    platform: "web",
  },
  {
    key: "banners",
    name: "Banners",
    parentKey: null,
    index: 5,
    icon: "image",
    description: "Manage promotional banners",
    platform: "web",
  },
  {
    key: "bi",
    name: "BI",
    parentKey: null,
    index: 6,
    icon: "bar-chart",
    description: "Business intelligence and reports",
    platform: "web",
  },
  {
    key: "queries",
    name: "Queries",
    parentKey: null,
    index: 7,
    icon: "message-circle",
    description: "Customer support queries and tickets",
    platform: "web",
  },
];
const moduleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    parentKey: {
      type: String,
      default: null, // null = top-level resource
    },
    index: {
      type: Number,
      default: 0, // sort order in permissions matrix
    },
    icon: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    platform: {
      type: String,
      enum: ["mobile", "web", "both"],
      default: "web",
    },
  },
  { timestamps: true }
);

// ── Static: seed default modules ──────────────────────────────
// Upserts by key — safe to run on every server start
moduleSchema.statics.seedDefaults = async function () {
  for (const mod of DEFAULT_MODULES) {
    await this.findOneAndUpdate(
      { key: mod.key },
      { $setOnInsert: mod }, // only set on first insert, don't overwrite edits
      { upsert: true, new: true }
    );
  }
  console.log("[Module] Default modules seeded ✓");
};

// ============================================================
// ADD this static to Module.js (inside moduleSchema.statics):
// ============================================================

moduleSchema.statics.syncToRoles = async function () {
  const Role = (await import("./Role.js")).default;
  const parentKeys = await this.getParentKeys();
 
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
      }
    }
    if (changed) await role.save();
  }
 
  if (synced > 0) console.log(`[Module] Synced ${synced} new resource(s) into roles ✓`);
};


// ── Static: get all parent resource keys (for role sync) ──────
moduleSchema.statics.getParentKeys = async function () {
  const parents = await this.find({ parentKey: null, isActive: true }).lean();
  return parents.map((m) => m.key);
};

// ── Static: get full tree (parents with children) ─────────────
moduleSchema.statics.getTree = async function (platform = "web") {
  const query = {
    isActive: true,
    ...(platform !== "all" && { platform: { $in: [platform, "both"] } }),
  };

  const all = await this.find(query).sort({ index: 1 }).lean();

  const parents = all.filter((m) => !m.parentKey);
  const children = all.filter((m) => m.parentKey);

  return parents.map((parent) => ({
    ...parent,
    children: children
      .filter((c) => c.parentKey === parent.key)
      .sort((a, b) => a.index - b.index),
  }));
};



const Module = mongoose.model("Module", moduleSchema);

// ── Default modules for ZippyEats admin panel ─────────────────
// platform: "web"  = admin panel (port 3010) only
// platform: "both" = shared
// To add a new module: add an entry here and restart the server.
// Role permissions will be auto-synced on startup.






export default Module;