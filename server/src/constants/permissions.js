// ============================================================
// FILE: server/src/constants/permissions.js
// ============================================================
// Single source of truth for every permission slug in the app.
// Import this wherever you need to reference a permission —
// never use raw strings like "orders.view_all" in middleware.
// ============================================================

export const PERMISSIONS = {

  // ── ORDERS ────────────────────────────────────────────────
  ORDERS_VIEW_OWN:    "orders.view_own",    // customer: GET /orders/my, GET /orders/:id
  ORDERS_VIEW_ALL:    "orders.view_all",    // admin:    GET /admin/orders/:id
  ORDERS_CREATE:      "orders.create",      // customer: POST /orders
  ORDERS_EDIT_STATUS: "orders.edit_status", // admin:    PUT /admin/orders/:id/status
                                            // restaurant: PATCH /restaurant-owner/orders/:id/status
  ORDERS_EDIT_ITEMS:  "orders.edit_items",  // admin (via support ticket): PATCH /support/tickets/:id/edit-order

  // ── MENU ITEMS ────────────────────────────────────────────
  MENU_VIEW:   "menu.view",   // public + restaurant owner: GET /menu/*
  MENU_CREATE: "menu.create", // restaurant owner: POST /restaurant-owner/menu
  MENU_EDIT:   "menu.edit",   // restaurant owner: PUT  /restaurant-owner/menu/:itemId
  MENU_DELETE: "menu.delete", // restaurant owner: DELETE /restaurant-owner/menu/:itemId

  // ── RESTAURANTS ───────────────────────────────────────────
  RESTAURANT_VIEW:      "restaurant.view",      // public: GET /restaurants, GET /restaurant/:id
  RESTAURANT_VIEW_DASH: "restaurant.view_dash", // restaurant owner: GET /restaurant-owner/dashboard

  // ── BANNERS ───────────────────────────────────────────────
  BANNERS_VIEW:   "banners.view",   // public: GET /banners
  BANNERS_CREATE: "banners.create", // admin:  POST /admin/banners
  BANNERS_EDIT:   "banners.edit",   // admin:  PUT  /admin/banners/:id
  BANNERS_DELETE: "banners.delete", // admin:  DELETE /admin/banners/:id

  // ── RUSH DEALS ────────────────────────────────────────────
  RUSH_DEALS_VIEW:   "rush_deals.view",   // public: GET /rush-deals
  RUSH_DEALS_CREATE: "rush_deals.create", // admin:  POST /admin/rush-deals
  RUSH_DEALS_EDIT:   "rush_deals.edit",   // admin:  PUT  /admin/rush-deals/:id
  RUSH_DEALS_DELETE: "rush_deals.delete", // admin:  DELETE /admin/rush-deals/:id

  // ── SUPPORT TICKETS ───────────────────────────────────────
  SUPPORT_VIEW_OWN:   "support.view_own",   // any logged-in user: GET /support/tickets (own)
  SUPPORT_VIEW_ALL:   "support.view_all",   // admin: GET /support/tickets (all)
  SUPPORT_REPLY:      "support.reply",      // any logged-in user: POST /support/tickets/:id/message
  SUPPORT_CREATE:     "support.create",     // any logged-in user: POST /support/tickets
  SUPPORT_EDIT_STATUS:"support.edit_status",// admin: PATCH /support/tickets/:id/status
  SUPPORT_RESOLVE:    "support.resolve",    // admin: PATCH /support/tickets/:id/resolve
  SUPPORT_REFUND:     "support.refund",     // admin: POST  /support/tickets/:id/refund
  SUPPORT_ADD_NOTE:   "support.add_note",   // admin: PATCH /support/tickets/:id/note
  SUPPORT_SYS_MSG:    "support.sys_message",// admin: POST  /support/tickets/:id/system-message
  SUPPORT_EDIT_ORDER: "support.edit_order", // admin: PATCH /support/tickets/:id/edit-order

  // ── USERS ─────────────────────────────────────────────────
  USERS_VIEW_OWN:  "users.view_own",  // self: GET /users/me, /users/stats, /users/addresses
  USERS_EDIT_OWN:  "users.edit_own",  // self: PUT /users/addresses/:id, profile pic, etc.
  USERS_VIEW_ALL:  "users.view_all",  // admin: GET /admin/stats/users-list, users-summary
  USERS_COINS_VIEW:"users.coins_view",// self: GET /users/me/coins

  // ── REVIEWS ───────────────────────────────────────────────
  REVIEWS_VIEW:   "reviews.view",   // public: GET /reviews/item/:menuItemId
  REVIEWS_CREATE: "reviews.create", // logged-in: POST /reviews

  // ── ANALYTICS ─────────────────────────────────────────────
  ANALYTICS_VIEW: "analytics.view", // admin: GET /admin/stats/*

  // ── AI QUERY ──────────────────────────────────────────────
  AI_QUERY: "ai.query", // admin: POST /ai/query

  // ── NOTIFICATIONS / FCM ───────────────────────────────────
  FCM_MANAGE_OWN:   "fcm.manage_own",   // self:  POST|DELETE /fcm/token
  FCM_MANAGE_ADMIN: "fcm.manage_admin", // admin: POST /fcm/subscribe-admin


    PANEL_ACCESS: "panel.access", // ← any role with this can log into admin panel (port 3010)

};

// ── Convenience: all slugs as a flat array ─────────────────
// Useful for Mongoose enum validation on the Role model.
export const ALL_PERMISSIONS = Object.values(PERMISSIONS);


// ── Role → permission mapping ──────────────────────────────
// Used by the role seeder and as a reference for the UI.
// Keys match the existing User.role enum: "user", "admin", "restaurant"
// Plus "super_admin" which we're adding.

export const ROLE_PERMISSIONS = {

  user: [
    PERMISSIONS.ORDERS_VIEW_OWN,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.MENU_VIEW,
    PERMISSIONS.RESTAURANT_VIEW,
    PERMISSIONS.BANNERS_VIEW,
    PERMISSIONS.RUSH_DEALS_VIEW,
    PERMISSIONS.SUPPORT_VIEW_OWN,
    PERMISSIONS.SUPPORT_CREATE,
    PERMISSIONS.SUPPORT_REPLY,
    PERMISSIONS.USERS_VIEW_OWN,
    PERMISSIONS.USERS_EDIT_OWN,
    PERMISSIONS.USERS_COINS_VIEW,
    PERMISSIONS.REVIEWS_VIEW,
    PERMISSIONS.REVIEWS_CREATE,
    PERMISSIONS.FCM_MANAGE_OWN,

  ],

  restaurant: [
    PERMISSIONS.ORDERS_VIEW_OWN,
    PERMISSIONS.ORDERS_EDIT_STATUS,
    PERMISSIONS.MENU_VIEW,
    PERMISSIONS.MENU_CREATE,
    PERMISSIONS.MENU_EDIT,
    PERMISSIONS.MENU_DELETE,
    PERMISSIONS.RESTAURANT_VIEW,
    PERMISSIONS.RESTAURANT_VIEW_DASH,
    PERMISSIONS.BANNERS_VIEW,
    PERMISSIONS.RUSH_DEALS_VIEW,
    PERMISSIONS.SUPPORT_VIEW_OWN,
    PERMISSIONS.SUPPORT_CREATE,
    PERMISSIONS.SUPPORT_REPLY,
    PERMISSIONS.USERS_VIEW_OWN,
    PERMISSIONS.USERS_EDIT_OWN,
    PERMISSIONS.REVIEWS_VIEW,
    PERMISSIONS.FCM_MANAGE_OWN,
  ],

  admin: [
    // Orders
    PERMISSIONS.ORDERS_VIEW_OWN,
    PERMISSIONS.ORDERS_VIEW_ALL,
    PERMISSIONS.ORDERS_EDIT_STATUS,
    PERMISSIONS.ORDERS_EDIT_ITEMS,
    // Menu
    PERMISSIONS.MENU_VIEW,
    PERMISSIONS.MENU_CREATE,
    PERMISSIONS.MENU_EDIT,
    PERMISSIONS.MENU_DELETE,
    // Restaurants
    PERMISSIONS.RESTAURANT_VIEW,
    PERMISSIONS.RESTAURANT_VIEW_DASH,
    // Banners
    PERMISSIONS.BANNERS_VIEW,
    PERMISSIONS.BANNERS_CREATE,
    PERMISSIONS.BANNERS_EDIT,
    PERMISSIONS.BANNERS_DELETE,
    // Rush deals
    PERMISSIONS.RUSH_DEALS_VIEW,
    PERMISSIONS.RUSH_DEALS_CREATE,
    PERMISSIONS.RUSH_DEALS_EDIT,
    PERMISSIONS.RUSH_DEALS_DELETE,
    // Support
    PERMISSIONS.SUPPORT_VIEW_OWN,
    PERMISSIONS.SUPPORT_VIEW_ALL,
    PERMISSIONS.SUPPORT_CREATE,
    PERMISSIONS.SUPPORT_REPLY,
    PERMISSIONS.SUPPORT_EDIT_STATUS,
    PERMISSIONS.SUPPORT_RESOLVE,
    PERMISSIONS.SUPPORT_REFUND,
    PERMISSIONS.SUPPORT_ADD_NOTE,
    PERMISSIONS.SUPPORT_SYS_MSG,
    PERMISSIONS.SUPPORT_EDIT_ORDER,
    // Users
    PERMISSIONS.USERS_VIEW_OWN,
    PERMISSIONS.USERS_EDIT_OWN,
    PERMISSIONS.USERS_VIEW_ALL,
    PERMISSIONS.USERS_COINS_VIEW,
    // Reviews
    PERMISSIONS.REVIEWS_VIEW,
    PERMISSIONS.REVIEWS_CREATE,
    // Analytics + AI
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.AI_QUERY,
    // FCM
    PERMISSIONS.FCM_MANAGE_OWN,
    PERMISSIONS.FCM_MANAGE_ADMIN,
    //Panel
       PERMISSIONS.PANEL_ACCESS,
  ],

  
  // super_admin gets everything — computed dynamically so it
  // automatically picks up any new permissions added above.
  super_admin: ALL_PERMISSIONS,

};