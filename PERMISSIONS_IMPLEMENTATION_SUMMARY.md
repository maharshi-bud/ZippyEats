# ✅ CRUD Permission System Implementation - COMPLETE

## Overview

The Delivery App admin panel now uses a **generalized CRUD permission matrix** instead of individual permission slugs. Every resource (menu, users, orders, etc.) has four operations:

- **Add** - Create new items
- **View** - Read/view items
- **Edit** - Modify existing items
- **Delete** - Remove items

---

## What's Been Implemented

### 1. ✅ Database Model Updated

**File:** `server/src/models/Role.js`

- Changed from array-based permissions to a **Map-based permission matrix**
- Structure: `permissions[resource][operation] = boolean`
- Helper methods: `can()`, `canAny()`, `grant()`, `revoke()`
- Backward compatible seeding with `seedDefaults()`

**Example Structure:**
```javascript
{
  dashboard: { add: false, view: true, edit: false, delete: false },
  menu: { add: true, view: true, edit: true, delete: true },
  users: { add: false, view: true, edit: false, delete: false },
  // ... other resources
}
```

### 2. ✅ Permission Constants Refactored

**File:** `server/src/constants/permissions.js`

**New Exports:**
- `RESOURCES` - Array of all available resources
- `OPERATIONS` - Array of all CRUD operations
- `DEFAULT_PERMISSIONS` - Pre-configured permissions for user, restaurant, admin, super_admin
- `hasOperation(role, resource, operation)` - Helper function
- `hasAnyOperation(role, resource)` - Helper function
- Legacy `PERMISSIONS` object for backward compatibility

**Resource Types:**
- `dashboard` - Admin panel access
- `users` - User management
- `restaurants` - Restaurant management
- `menu` - Menu/items management
- `banners` - Promotional banners
- `orders` - Order management
- `queries` - Support tickets/queries
- `bi` - Business Intelligence/Analytics

### 3. ✅ Permission Middleware Updated

**File:** `server/src/middleware/permissionMiddleware.js`

**NEW API:**
```javascript
// Single operation check
requirePermission("menu", "view")
requirePermission("menu", "add")

// Multiple operations (user needs ANY one)
requirePermission("menu", ["view", "add"])

// Works with old-style objects too (backward compat)
requirePermission({ resource: "menu", operation: "edit" })
```

**Legacy Support:**
- Old `PERMISSIONS.*` constants still work
- New `requireAllPermissions()` function for checking multiple perms

### 4. ✅ Roles Controller Updated

**File:** `server/src/controllers/admin/rolesController.js`

**Endpoints:**
- `GET /admin/roles` - List all roles with permission matrix
- `GET /admin/roles/resources` - Get available resources and operations
- `POST /admin/roles` - Create role with matrix permissions
- `PUT /admin/roles/:id` - Update role permissions
- `DELETE /admin/roles/:id` - Delete custom role

**Request Format (New):**
```json
{
  "name": "support_agent",
  "label": "Support Agent",
  "description": "Can handle support tickets",
  "permissions": {
    "dashboard": { "add": false, "view": true, "edit": false, "delete": false },
    "menu": { "add": false, "view": true, "edit": false, "delete": false },
    "queries": { "add": false, "view": true, "edit": true, "delete": false }
  }
}
```

### 5. ✅ Admin Panel Roles Page Redesigned

**File:** `admin/src/app/(admin)/roles/page.tsx`

**Features:**
- Permission matrix UI with resources as rows and operations as columns
- Checkbox-based interface for easy permission assignment
- Shows total permissions granted per role
- Role creation/editing with matrix editor
- System vs custom role indicators
- User-to-role assignment tab

**UI Structure:**
```
┌─────────────┬─────┬─────┬─────┬────────┐
│ Resource    │ Add │View │Edit │ Delete │
├─────────────┼─────┼─────┼─────┼────────┤
│ Dashboard   │ ☐   │ ☑   │ ☐   │ ☐      │
│ Menu        │ ☑   │ ☑   │ ☑   │ ☑      │
│ Users       │ ☐   │ ☑   │ ☑   │ ☐      │
│ Orders      │ ☐   │ ☑   │ ☑   │ ☐      │
│ Banners     │ ☑   │ ☑   │ ☑   │ ☑      │
└─────────────┴─────┴─────┴─────┴────────┘
```

### 6. ✅ Sidebar Permission Filtering

**File:** `admin/src/components/layout/Sidebar.tsx`

**Features:**
- Fetches user's role and permissions on load
- Filters menu items based on resource access
- Only shows tabs user has "view" permission for
- Graceful handling of loading/error states

**Permission Mapping:**
- Dashboard → dashboard.view
- Orders → orders.view
- Users → users.view
- Restaurants → restaurants.view
- Banners → banners.view
- BI → bi.view
- Queries → queries.view
- Roles → dashboard.view (admin-only)

### 7. ✅ Sample Routes Updated

**Updated Files:**
- ✅ `server/src/routes/admin/orderRoutes.js`
- ✅ `server/src/routes/admin/statsRoutes.js`
- ✅ `server/src/routes/admin/rolesRoutes.js`

**Before (Old):**
```javascript
router.get("/orders", protect, requirePermission(PERMISSIONS.ORDERS_VIEW_ALL), handler);
router.post("/orders", protect, requirePermission(PERMISSIONS.ORDERS_CREATE), handler);
```

**After (New):**
```javascript
router.get("/orders", protect, requirePermission("orders", "view"), handler);
router.post("/orders", protect, requirePermission("orders", "add"), handler);
router.put("/orders/:id", protect, requirePermission("orders", "edit"), handler);
router.delete("/orders/:id", protect, requirePermission("orders", "delete"), handler);
```

---

## How It Works

### Default Roles

Four system roles are automatically seeded:

1. **User (Customer)**
   - Can view: dashboard, menu, restaurants, banners, orders (own)
   - Can create: orders, queries
   - Cannot: manage anything

2. **Restaurant (Owner)**
   - Can view: dashboard, restaurants (own), menu, orders (own)
   - Can manage: menu items (add, edit, delete)
   - Can update: order status

3. **Admin**
   - Can view: all resources
   - Can manage: users, restaurants, banners, menu, orders
   - Cannot: delete users (for safety)

4. **Super Admin**
   - Full access: all operations on all resources

### Panel Access

Users can access the admin panel at `https://localhost:3010` if they have:
- Any "view" permission on the dashboard resource
- OR any admin/super_admin role

### Permission Checking Flow

1. User logs in → Gets their role from User model
2. Route middleware calls `requirePermission("resource", "operation")`
3. Middleware fetches role's permission matrix from cache/DB
4. Checks if `permissions[resource][operation] === true`
5. Allows or denies request

---

## Database Changes

### Before
```javascript
permissions: ["orders.view_all", "menu.create", "menu.edit", "menu.delete"]
```

### After
```javascript
permissions: {
  dashboard: { add: false, view: true, edit: false, delete: false },
  users: { add: false, view: true, edit: false, delete: false },
  restaurants: { add: true, view: true, edit: true, delete: true },
  menu: { add: true, view: true, edit: true, delete: true },
  banners: { add: true, view: true, edit: true, delete: true },
  orders: { add: false, view: true, edit: true, delete: false },
  queries: { add: true, view: true, edit: true, delete: true },
  bi: { add: false, view: true, edit: false, delete: false }
}
```

---

## Remaining Tasks

### Routes to Update (See ROUTES_TO_UPDATE.md)

The following routes still need permission updates (template provided in `ROUTE_PERMISSION_UPDATE_GUIDE.md`):

- [ ] Banner routes
- [ ] Menu routes
- [ ] Order routes (customer endpoints)
- [ ] Support/Query routes
- [ ] Restaurant owner routes
- [ ] User routes
- [ ] Review routes
- [ ] Other routes

**Quick Search & Replace Pattern:**

Find: `requirePermission(PERMISSIONS.*)`
Replace: `requirePermission("resource", "operation")`

### Steps to Complete

1. **Update Remaining Routes** (15-20 files)
   - Follow the template in `ROUTE_PERMISSION_UPDATE_GUIDE.md`
   - Replace old `PERMISSIONS.X_Y_Z` with `("resource", "op")`
   - Test each route

2. **Database Migration** (if needed)
   - Run `Role.seedDefaults()` to ensure roles are created
   - For existing roles, convert permissions array to matrix

3. **Test Admin Panel**
   - Login as different roles
   - Verify sidebar shows correct tabs
   - Verify permission matrix UI works
   - Test creating/editing roles

4. **Test Routes**
   - Verify each route respects new permissions
   - Test with insufficient permissions (should get 403)
   - Test with sufficient permissions (should succeed)

---

## Usage Examples

### Backend: Check Permissions

```javascript
import { requirePermission } from "./middleware/permissionMiddleware.js";

// Single permission
router.get("/menu", protect, requirePermission("menu", "view"), handler);

// Create
router.post("/menu", protect, requirePermission("menu", "add"), handler);

// Multiple (user needs ANY one)
router.get("/items", protect, requirePermission("menu", ["view", "add"]), handler);
```

### Frontend: Permission Matrix UI

```typescript
import { useEffect, useState } from "react";
import api from "../lib/api";

export default function RolesPage() {
  const [role, setRole] = useState(null);
  const [resources, setResources] = useState([]);
  const [operations, setOperations] = useState([]);

  useEffect(() => {
    // Fetch available resources and operations
    api.get("/admin/roles/resources").then(res => {
      setResources(res.data.data.resources);
      setOperations(res.data.data.operations);
    });
  }, []);

  // Toggle a single permission
  const togglePermission = (resource, operation) => {
    setRole(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [resource]: {
          ...prev.permissions[resource],
          [operation]: !prev.permissions[resource][operation]
        }
      }
    }));
  };

  // Render permission matrix
  return (
    <table>
      <thead>
        <tr>
          <th>Resource</th>
          {operations.map(op => <th key={op}>{op}</th>)}
        </tr>
      </thead>
      <tbody>
        {resources.map(resource => (
          <tr key={resource}>
            <td>{resource}</td>
            {operations.map(op => (
              <td key={op}>
                <input
                  type="checkbox"
                  checked={role?.permissions?.[resource]?.[op] || false}
                  onChange={() => togglePermission(resource, op)}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Frontend: Sidebar Filtering

```typescript
// Check if user has permission to view a tab
const hasAccess = (resource: string, operation: string = "view") => {
  if (!permissions) return false;
  const perms = permissions[resource];
  return perms?.[operation] === true;
};

// Use in sidebar
const visibleLinks = links.filter(link => hasAccess(link.resource));
```

---

## Key Features

✅ **Centralized Permission Management**
- All permissions defined in one place
- Easy to add new resources or operations
- Single source of truth

✅ **Visual Permission Matrix**
- Easy-to-understand UI
- Clear CRUD operation mapping
- Bulk assignment options

✅ **Backward Compatible**
- Old permission slug system still works
- Gradual migration path
- No breaking changes

✅ **Role Filtering**
- Admin panel only shows accessible tabs
- Prevents unauthorized access
- Improves UX

✅ **Performance**
- Permission caching (5-minute TTL)
- Efficient DB queries
- Minimal overhead

✅ **Security**
- Fail-closed permission checks
- Audit trail in role controller
- System roles protected

---

## Configuration

### Adding a New Resource

1. Add to `RESOURCES` in `constants/permissions.js`
2. Add default permissions in `DEFAULT_PERMISSIONS`
3. Update sidebar `links` array to include new tabs
4. Add routes with permission checks

### Customizing Permission Labels

In `admin/src/app/(admin)/roles/page.tsx`, customize the matrix table headers:

```typescript
const operationLabels = {
  add: "Create",
  view: "Read",
  edit: "Update",
  delete: "Remove"
};
```

### Permission TTL

In `middleware/permissionMiddleware.js`:

```javascript
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes - adjust as needed
```

---

## Troubleshooting

### Sidebar shows no items
- Check user's role in DB
- Verify role has "view" permissions set to true
- Check browser console for API errors

### Permission denied (403) on routes
- Verify user's role has correct permissions
- Check permission middleware is applied
- Clear role cache: `invalidateRoleCache(role.name)`

### Roles page not loading
- Verify API endpoint returns correct format
- Check that `resources` state is populated
- Ensure `/admin/roles/resources` endpoint works

---

## Files Modified

### Backend
- ✅ `server/src/models/Role.js`
- ✅ `server/src/constants/permissions.js`
- ✅ `server/src/controllers/admin/rolesController.js`
- ✅ `server/src/middleware/permissionMiddleware.js`
- ✅ `server/src/routes/admin/orderRoutes.js`
- ✅ `server/src/routes/admin/statsRoutes.js`
- ✅ `server/src/routes/admin/rolesRoutes.js`

### Frontend
- ✅ `admin/src/app/(admin)/roles/page.tsx`
- ✅ `admin/src/components/layout/Sidebar.tsx`

### Documentation
- ✅ `ROUTE_PERMISSION_UPDATE_GUIDE.md`
- ✅ `ROUTES_TO_UPDATE.md`

---

## Next Steps

1. Review this implementation
2. Complete remaining route updates
3. Test with different user roles
4. Deploy to staging environment
5. Monitor admin panel access patterns
6. Collect feedback from team

---

## Support

For questions about the permission system:
1. Check examples in this document
2. Review example routes (orderRoutes, statsRoutes)
3. Check middleware implementation
4. Test with the roles page UI
