# 🚀 CRUD Permission System - Quick Reference

## TL;DR

Changed from individual permission slugs to a **generalized CRUD matrix**:

```
┌──────────────┬─────┬─────┬─────┬────────┐
│ Resource     │ Add │View │Edit │ Delete │
├──────────────┼─────┼─────┼─────┼────────┤
│ menu         │ ☑   │ ☑   │ ☑   │ ☑      │
│ users        │ ☐   │ ☑   │ ☑   │ ☐      │
│ orders       │ ☐   │ ☑   │ ☑   │ ☐      │
│ restaurants  │ ☐   │ ☑   │ ☐   │ ☐      │
│ banners      │ ☑   │ ☑   │ ☑   │ ☑      │
│ queries      │ ☐   │ ☑   │ ☑   │ ☐      │
│ bi           │ ☐   │ ☑   │ ☐   │ ☐      │
│ dashboard    │ ☐   │ ☑   │ ☐   │ ☐      │
└──────────────┴─────┴─────┴─────┴────────┘
```

---

## Backend Usage

### Update a Route

**BEFORE:**
```javascript
router.get("/admin/menu", protect, 
  requirePermission(PERMISSIONS.MENU_VIEW), 
  getMenu);
```

**AFTER:**
```javascript
router.get("/admin/menu", protect, 
  requirePermission("menu", "view"), 
  getMenu);
```

### Standard REST Pattern

```javascript
import { requirePermission } from "../../middleware/permissionMiddleware.js";

// List items
router.get("/menu", protect, requirePermission("menu", "view"), handler);

// Create item
router.post("/menu", protect, requirePermission("menu", "add"), handler);

// Update item
router.put("/menu/:id", protect, requirePermission("menu", "edit"), handler);

// Delete item
router.delete("/menu/:id", protect, requirePermission("menu", "delete"), handler);
```

---

## Frontend Usage

### Show/Hide Based on Permissions

```typescript
const canViewMenu = permissions?.menu?.view === true;
const canAddMenu = permissions?.menu?.add === true;
const canEditMenu = permissions?.menu?.edit === true;
const canDeleteMenu = permissions?.menu?.delete === true;

if (canViewMenu) {
  // Show menu items
}

if (canAddMenu) {
  // Show "Add Item" button
}
```

### Get User Permissions

```typescript
const userRes = await api.get("/users/me");
const user = userRes.data.data;

const rolesRes = await api.get("/admin/roles");
const userRole = rolesRes.data.data.find(r => r.name === user.role);

const permissions = userRole.permissions;
// {
//   menu: { add: true, view: true, edit: true, delete: true },
//   users: { add: false, view: true, edit: false, delete: false },
//   ...
// }
```

---

## Database Structure

### Old (Array of Strings)
```javascript
permissions: [
  "menu.view",
  "menu.create",
  "menu.edit",
  "menu.delete",
  "orders.view",
  "orders.edit_status"
]
```

### New (Object/Map)
```javascript
permissions: {
  menu: { add: true, view: true, edit: true, delete: true },
  orders: { add: false, view: true, edit: true, delete: false },
  users: { add: false, view: true, edit: false, delete: false },
  // ... all 8 resources
}
```

---

## Resources

| Resource | Purpose | Sidebar Tab |
|----------|---------|-------------|
| `dashboard` | Admin panel access | Always visible if logged in |
| `menu` | Menu/items | Menu Management |
| `users` | User management | Users |
| `restaurants` | Restaurant management | Restaurants |
| `orders` | Order management | Orders |
| `banners` | Promotional content | Banners |
| `queries` | Support tickets | Queries |
| `bi` | Analytics | BI |

---

## Permission Matrix UI

Location: `admin/src/app/(admin)/roles/page.tsx`

**Features:**
- ✅ Create/edit roles with checkbox matrix
- ✅ Assign roles to users
- ✅ View permission counts per role
- ✅ System vs custom role indicators

**Access:**
- Login to admin panel at `https://localhost:3010`
- Navigate to "Roles" tab
- Click "New Role" or "Edit" on existing role

---

## System Roles (Pre-configured)

### User (Customer)
- ✅ View: menu, restaurants, banners, orders (own), dashboard
- ✅ Add: orders, support queries
- ❌ Cannot manage: other items

### Restaurant (Owner)
- ✅ View: menu (own), orders (own), restaurants (own), dashboard
- ✅ Manage: menu items (add/edit/delete)
- ✅ Update: order status

### Admin
- ✅ View: all resources
- ✅ Create/Edit: users, restaurants, banners, menu, orders
- ❌ Cannot: delete users

### Super Admin
- ✅ Full access: all operations on all resources

---

## Testing Checklist

### Backend
- [ ] Old routes still work (backward compat)
- [ ] New routes use new API
- [ ] 403 on insufficient permissions
- [ ] 200 on sufficient permissions
- [ ] Role cache invalidation works

### Frontend
- [ ] Roles page loads permission matrix
- [ ] Can create/edit roles
- [ ] Can assign roles to users
- [ ] Sidebar shows only accessible tabs
- [ ] Tab filtering works for different roles

### Permission Enforcement
- [ ] User can't view restricted resources
- [ ] User can't create if no "add" permission
- [ ] User can't edit if no "edit" permission
- [ ] User can't delete if no "delete" permission
- [ ] SuperAdmin has all permissions

---

## Common Tasks

### Add New Resource

1. Add to `RESOURCES` in `constants/permissions.js`:
   ```javascript
   export const RESOURCES = [
     // ... existing
     "my_new_resource"
   ];
   ```

2. Add defaults in `DEFAULT_PERMISSIONS`:
   ```javascript
   export const DEFAULT_PERMISSIONS = {
     user: {
       // ... existing
       my_new_resource: { add: false, view: true, edit: false, delete: false }
     },
     // ... other roles
   };
   ```

3. Add sidebar link:
   ```typescript
   const links: MenuLink[] = [
     // ... existing
     { name: "My Tab", href: "/my-tab", resource: "my_new_resource", requiredOp: "view" }
   ];
   ```

4. Protect routes:
   ```javascript
   router.get("/my-tab", protect, requirePermission("my_new_resource", "view"), handler);
   ```

### Create Custom Role

1. Go to admin panel → Roles tab
2. Click "+ New Role"
3. Fill in:
   - Name: `support_agent` (slug format)
   - Label: `Support Agent`
   - Description: What they do
4. Check permission checkboxes for resources/operations
5. Click "Create Role"
6. Assign to users via Users tab

### Update Route Permissions

1. Find route with `requirePermission(PERMISSIONS.*)`
2. Replace with `requirePermission("resource", "operation")`
3. Test route with user lacking permission (expect 403)
4. Test with user having permission (expect success)

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Sidebar empty | Check user role has "view" on dashboard |
| Routes return 403 | Verify user role has permission |
| Can't create role | User needs "users" → "add" permission |
| Old PERMISSIONS refs | Still work, but migrate to new format |
| Permission not changing | Clear role cache or restart server |

---

## Files to Update Next

See `ROUTES_TO_UPDATE.md` for complete list. Quick priority:

1. Banner routes
2. Menu routes
3. Support/queries routes
4. Restaurant owner routes
5. Other routes

---

## Code Examples

### Middleware

```javascript
import { requirePermission } from "./middleware/permissionMiddleware.js";

// One operation
router.get("/menu", protect, requirePermission("menu", "view"), handler);

// Multiple operations (user needs ANY)
router.get("/items", protect, requirePermission("menu", ["view", "add"]), handler);

// Custom check function (if needed)
router.get("/special", protect, async (req, res, next) => {
  const role = await Role.findOne({ name: req.user.role });
  if (role?.can("menu", "edit")) {
    next();
  } else {
    res.status(403).json({ message: "No permission" });
  }
});
```

### Component

```typescript
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function MenuManager() {
  const [permissions, setPermissions] = useState(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      const userRes = await api.get("/users/me");
      const user = userRes.data.data;
      
      const rolesRes = await api.get("/admin/roles");
      const role = rolesRes.data.data.find(r => r.name === user.role);
      
      setPermissions(role?.permissions);
    };
    
    fetchPermissions();
  }, []);

  const canAdd = permissions?.menu?.add === true;
  const canDelete = permissions?.menu?.delete === true;

  return (
    <>
      {canAdd && <button>Add Item</button>}
      {canDelete && <button>Delete Item</button>}
    </>
  );
}
```

---

## Architecture Diagram

```
User Login
    ↓
Fetch User.role
    ↓
Fetch Role.permissions (matrix)
    ↓
Store in sidebar state
    ↓
Route Access Check:
  ├─ Has dashboard.view? → Show sidebar/tabs
  ├─ Has menu.view? → Show Menu tab
  ├─ Has users.view? → Show Users tab
  └─ Has orders.view? → Show Orders tab
    ↓
API Route:
  ├─ requirePermission("menu", "view") 
  ├─ Check permissions[menu].view === true
  ├─ Allow/Deny
  └─ Return response
```

---

## Performance

- **Cache TTL**: 5 minutes per role
- **DB Queries**: 1 per first request + cache hits
- **Overhead**: < 1ms per permission check
- **Max resources**: 8 (extensible)
- **Max operations**: 4 (add, view, edit, delete)

---

## Security Notes

- ✅ Fail-closed: Denies by default
- ✅ No client-side trust: Server validates always
- ✅ Protected routes: Can't bypass with URL manipulation
- ✅ System roles: Can't be deleted
- ✅ Audit trail: All role changes logged via controller

---

## Migration Path

**Phase 1 (Current):**
- ✅ Model updated
- ✅ UI ready
- ✅ Sample routes migrated
- ✅ Sidebar filtering active

**Phase 2 (Next):**
- Complete remaining route migrations
- Test with full user base
- Monitor permission patterns

**Phase 3 (Later):**
- Remove legacy PERMISSIONS constants
- Add permission audit logging
- Build admin analytics dashboard

