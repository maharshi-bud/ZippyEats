// ============================================================
// FILE: server/src/constants/permissions.js
// ============================================================
// NEW: Matrix-based permission system with CRUD operations
// Each resource has: add (create), view (read), edit (update), delete
// ============================================================

// ── All resources available in the admin panel ──────────────


// ── CRUD operations ─────────────────────────────────────────
export const OPERATIONS = ["add", "view", "edit", "delete"];
export const PANEL_ACCESS = { resource: "dashboard", operation: "view" };
export const PANEL_ACCESS_ROLES = ["admin", "super_admin"]







export const RESOURCES = [
  "dashboard",
  "orders",
  "users",
  "restaurants",
  "menu",
  "banners",
  "queries",
  "bi",
  "roles",
  "staff",
];



// ── Helper: Check if a role has a specific CRUD operation ────
// Usage: hasOperation(role, "menu", "edit")
export function hasOperation(role, resource, operation) {
  if (!role.permissions || !role.permissions[resource]) return false;
  return role.permissions[resource][operation] === true;
}

// ── Helper: Check if a role has permission for any operation on a resource ──
export function hasAnyOperation(role, resource) {
  if (!role.permissions || !role.permissions[resource]) return false;
  const ops = role.permissions[resource];
  return Object.values(ops).some((v) => v === true);
}

export function hasPanelAccess(roleName, permissions = {}) {
  if (PANEL_ACCESS_ROLES.includes(roleName)) return true;

  const resourcePerms = permissions[PANEL_ACCESS.resource];
  return resourcePerms?.[PANEL_ACCESS.operation] === true;
}

// ── Default permissions for seeded roles ───────────────────
// Structure: { resource: { add, view, edit, delete } }

export const DEFAULT_PERMISSIONS = {
  user: {
    dashboard: { add: false, view: true, edit: false, delete: false },
    users: { add: false, view: false, edit: true, delete: false },
    restaurants: { add: false, view: true, edit: false, delete: false },
    menu: { add: false, view: true, edit: false, delete: false },
    banners: { add: false, view: true, edit: false, delete: false },
    orders: { add: true, view: true, edit: false, delete: false },
    queries: { add: false, view: false, edit: false, delete: false },
    bi: { add: false, view: false, edit: false, delete: false },
  },

  restaurant: {
    dashboard: { add: false, view: true, edit: false, delete: false },
    users: { add: false, view: false, edit: false, delete: false },
    restaurants: { add: false, view: true, edit: true, delete: false },
    menu: { add: true, view: true, edit: true, delete: true },
    banners: { add: false, view: true, edit: false, delete: false },
    orders: { add: false, view: true, edit: true, delete: false },
    queries: { add: false, view: false, edit: false, delete: false },
    bi: { add: false, view: false, edit: false, delete: false },
  },

  admin: {
    dashboard: { add: false, view: true, edit: false, delete: false },
    users: { add: true, view: true, edit: true, delete: true },
    restaurants: { add: true, view: true, edit: true, delete: true },
    menu: { add: true, view: true, edit: true, delete: true },
    banners: { add: true, view: true, edit: true, delete: true },
    orders: { add: false, view: true, edit: true, delete: false },
    queries: { add: true, view: true, edit: true, delete: true },
    bi: { add: false, view: true, edit: false, delete: false },
  },

  super_admin: {
    dashboard: { add: true, view: true, edit: true, delete: true },
    users: { add: true, view: true, edit: true, delete: true },
    restaurants: { add: true, view: true, edit: true, delete: true },
    menu: { add: true, view: true, edit: true, delete: true },
    banners: { add: true, view: true, edit: true, delete: true },
    orders: { add: true, view: true, edit: true, delete: true },
    queries: { add: true, view: true, edit: true, delete: true },
    bi: { add: true, view: true, edit: true, delete: true },
  },
};

// ── Legacy: PERMISSIONS object for backward compatibility ────
// Maps old permission slugs to (resource, operation) pairs
export const PERMISSIONS = {
  // ORDERS
  ORDERS_VIEW_OWN: { resource: "orders", operation: "view" },
  ORDERS_VIEW_ALL: { resource: "orders", operation: "view" },
  ORDERS_CREATE: { resource: "orders", operation: "add" },
  ORDERS_EDIT_STATUS: { resource: "orders", operation: "edit" },
  ORDERS_EDIT_ITEMS: { resource: "orders", operation: "edit" },

  // MENU
  MENU_VIEW: { resource: "menu", operation: "view" },
  MENU_CREATE: { resource: "menu", operation: "add" },
  MENU_EDIT: { resource: "menu", operation: "edit" },
  MENU_DELETE: { resource: "menu", operation: "delete" },

  // RESTAURANTS
  RESTAURANT_VIEW: { resource: "restaurants", operation: "view" },
  RESTAURANT_VIEW_DASH: { resource: "restaurants", operation: "view" },

  // BANNERS
  BANNERS_VIEW: { resource: "banners", operation: "view" },
  BANNERS_CREATE: { resource: "banners", operation: "add" },
  BANNERS_EDIT: { resource: "banners", operation: "edit" },
  BANNERS_DELETE: { resource: "banners", operation: "delete" },

  // RUSH DEALS (mapped to queries)
  RUSH_DEALS_VIEW: { resource: "queries", operation: "view" },
  RUSH_DEALS_CREATE: { resource: "queries", operation: "add" },
  RUSH_DEALS_EDIT: { resource: "queries", operation: "edit" },
  RUSH_DEALS_DELETE: { resource: "queries", operation: "delete" },

  // SUPPORT (mapped to queries)
  SUPPORT_VIEW_OWN: { resource: "queries", operation: "view" },
  SUPPORT_VIEW_ALL: { resource: "queries", operation: "view" },
  SUPPORT_CREATE: { resource: "queries", operation: "add" },
  SUPPORT_REPLY: { resource: "queries", operation: "edit" },
  SUPPORT_EDIT_STATUS: { resource: "queries", operation: "edit" },
  SUPPORT_RESOLVE: { resource: "queries", operation: "edit" },
  SUPPORT_REFUND: { resource: "queries", operation: "edit" },
  SUPPORT_ADD_NOTE: { resource: "queries", operation: "edit" },
  SUPPORT_SYS_MSG: { resource: "queries", operation: "add" },
  SUPPORT_EDIT_ORDER: { resource: "queries", operation: "edit" },

  // USERS
  USERS_VIEW_OWN: { resource: "users", operation: "view" },
  USERS_EDIT_OWN: { resource: "users", operation: "edit" },
  USERS_VIEW_ALL: { resource: "users", operation: "view" },
  USERS_COINS_VIEW: { resource: "users", operation: "view" },

  // REVIEWS (mapped to menu)
  REVIEWS_VIEW: { resource: "menu", operation: "view" },
  REVIEWS_CREATE: { resource: "menu", operation: "add" },

  // ANALYTICS
  ANALYTICS_VIEW: { resource: "bi", operation: "view" },

  // AI QUERY
  AI_QUERY: { resource: "bi", operation: "add" },

  // FCM / NOTIFICATIONS
  FCM_MANAGE_OWN: { resource: "users", operation: "edit" },
  FCM_MANAGE_ADMIN: { resource: "users", operation: "edit" },

  // PANEL ACCESS
  PANEL_ACCESS,
};

// ── For backward compatibility: get all permission slugs
export const ALL_PERMISSIONS = Object.keys(PERMISSIONS);

export const ROLE_PERMISSIONS = {
  user: DEFAULT_PERMISSIONS.user,
  restaurant: DEFAULT_PERMISSIONS.restaurant,
  admin: DEFAULT_PERMISSIONS.admin,
  super_admin: DEFAULT_PERMISSIONS.super_admin,
};

