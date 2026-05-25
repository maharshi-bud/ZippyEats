# Routes That Need Permission Updates

The following routes still need to be updated from the old permission slug system to the new CRUD-based system.

## Admin Routes (Priority 1)

- [ ] `/server/src/routes/admin/index.js` - Main admin router aggregator
- [ ] **Other admin routes** (check if any exist)

## Banner Routes

- [ ] `/server/src/routes/bannerRoutes.js`
  - GET /banners → requirePermission("banners", "view")
  - POST /banners → requirePermission("banners", "add")
  - PUT /banners/:id → requirePermission("banners", "edit")
  - DELETE /banners/:id → requirePermission("banners", "delete")

## Menu Routes

- [ ] `/server/src/routes/menuRoutes.js`
  - GET /menu → requirePermission("menu", "view")
  - POST /menu → requirePermission("menu", "add")
  - PUT /menu/:id → requirePermission("menu", "edit")
  - DELETE /menu/:id → requirePermission("menu", "delete")

## Order Routes

- [ ] `/server/src/routes/orderRoutes.js`
  - GET /orders → requirePermission("orders", "view")
  - POST /orders → requirePermission("orders", "add")
  - PUT /orders/:id → requirePermission("orders", "edit")

## Support/Queries Routes

- [ ] `/server/src/routes/Supportroutes.js`
  - GET /support/tickets → requirePermission("queries", "view")
  - POST /support/tickets → requirePermission("queries", "add")
  - PATCH /support/tickets/:id → requirePermission("queries", "edit")

## Restaurant Routes

- [ ] `/server/src/routes/restaurantOwnerRoutes.js`
  - GET /restaurant-owner/dashboard → requirePermission("restaurants", "view")
  - POST /restaurant-owner/menu → requirePermission("menu", "add")
  - PUT /restaurant-owner/menu/:id → requirePermission("menu", "edit")
  - DELETE /restaurant-owner/menu/:id → requirePermission("menu", "delete")

## User Routes

- [ ] `/server/src/routes/userRoutes.js`
  - GET /users/me → requirePermission("users", "view")
  - PUT /users/:id → requirePermission("users", "edit")

## Review Routes

- [ ] `/server/src/routes/reviewRoutes.js`
  - GET /reviews → requirePermission("menu", "view")
  - POST /reviews → requirePermission("menu", "add")

## Other Routes

- [ ] `/server/src/routes/searchRoutes.js`
- [ ] `/server/src/routes/fcmRoutes.js`
- [ ] `/server/src/routes/restaurantRoutes.js`
- [ ] `/server/src/routes/authRoutes.js`

## ✅ Already Updated

- ✅ `/server/src/routes/admin/orderRoutes.js`
- ✅ `/server/src/routes/admin/statsRoutes.js`
- ✅ `/server/src/routes/admin/rolesRoutes.js`

## Mapping Reference

- `dashboard` → Admin panel general access
- `users` → User management
- `restaurants` → Restaurant management
- `menu` → Menu/items
- `banners` → Promotional banners
- `orders` → Order management
- `queries` → Support tickets
- `bi` → Business Intelligence/Analytics

## Update Template

```javascript
import { requirePermission } from "../../middleware/permissionMiddleware.js";

// OLD:
router.get("/items", protect, requirePermission(PERMISSIONS.MENU_VIEW), handler);

// NEW:
router.get("/items", protect, requirePermission("menu", "view"), handler);
```
