# ZippyEats

**ZippyEats** is a full-stack food delivery platform with a customer-facing ordering experience, an admin command center, a restaurant-owner workspace, real-time order/support workflows, coupons/rewards, reviews, notifications, and analytics.

## Live Links

| App | URL |
|---|---|
| Client / Customer App | https://zippy-eats-p4to.vercel.app/ |
| Admin Panel | https://zippy-eats.vercel.app/ |

---

## Table of Contents

- [Project Overview](#project-overview)
- [Core Apps](#core-apps)
- [Key Features](#key-features)
- [User Flow](#user-flow)
- [Admin Flow](#admin-flow)
- [Restaurant Owner Flow](#restaurant-owner-flow)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Major Pages and Modules](#major-pages-and-modules)
- [Backend API Areas](#backend-api-areas)
- [Real-Time Features](#real-time-features)
- [Coupons, Rewards, and ZipCoins](#coupons-rewards-and-zipcoins)
- [Notifications](#notifications)
- [Design System](#design-system)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Deployment Notes](#deployment-notes)
- [Known Notes / Development Guardrails](#known-notes--development-guardrails)

---

## Project Overview

ZippyEats is designed as a Swiggy/Zomato-style food ordering system with three main working areas:

1. **Client App** — customers browse restaurants, search dishes, add items to cart, checkout, track orders, manage profile, addresses, reviews, and rewards.
2. **Admin Panel** — administrators monitor analytics, orders, users, restaurants, banners, coupons, support queries, roles, staff, and BI/AI assistance.
3. **Restaurant Owner Panel** — restaurant owners manage menus and orders from their own workspace.

The platform is backed by a Node.js/Express API, MongoDB models, Socket.IO real-time events, Firebase notifications, coupon/reward engines, and role-based admin permissions.

---

## Core Apps

### 1. Customer Client

Located in:

```txt
/client
```

Live:

```txt
https://zippy-eats-p4to.vercel.app/
```

Main responsibilities:

- Restaurant discovery
- Menu browsing
- Cart drawer flow
- Checkout
- Order tracking
- Search
- Profile and saved addresses
- Reviews
- ZipCoins rewards
- Notifications

### 2. Admin Panel

Located in:

```txt
/admin
```

Live:

```txt
https://zippy-eats.vercel.app/
```

Main responsibilities:

- Platform analytics dashboard
- Order management
- User management
- Restaurant management
- Banner management
- Coupon management
- Support/queries
- RBAC roles and staff
- BI assistant

### 3. Server API

Located in:

```txt
/server
```

Main responsibilities:

- Authentication
- Restaurants and menus
- Orders and live order engine
- Coupons and rewards
- User profile/address management
- Admin analytics
- Restaurant-owner APIs
- Reviews
- Support chat/tickets
- Firebase push notifications
- Socket.IO real-time communication

---

## Key Features

## Customer Features

### Restaurant Discovery

- Home page with curated sections.
- Restaurant listing page.
- Search page showing both matching restaurants and matching dishes/menu items.
- Restaurant cards use menu-derived food images.
- Cuisine/category display.
- Rating and delivery-time display.

### Search

- Navbar search integration.
- Dedicated search results page.
- Shows:
  - restaurant matches
  - dish/menu item matches
- Clicking a restaurant opens the restaurant menu.
- Clicking a dish opens the associated restaurant.

### Restaurant Menu Page

- Restaurant details header.
- Ratings, price-for-two, cuisines, location, and delivery time.
- Deals carousel.
- Veg/non-veg filters.
- Search within menu.
- Accordion grouping by cuisine.
- Add-to-cart and quantity stepper controls.
- Smooth GSAP accordion transitions.
- Premium animated background and frosted layout.

### Cart Drawer

- Drawer-based cart flow instead of a standalone cart page.
- Quantity increase/decrease controls.
- Cart item images.
- Cart total.
- Login-to-proceed / checkout CTA.
- Scroll containment so page scroll does not conflict with drawer scroll.

### Checkout

- Saved address selection.
- Custom delivery address form.
- Save address for future orders checkbox.
- ZipCoins redemption.
- Coupon application.
- BXGY/free reward item handling.
- Coupon remove cleanup.
- Order summary and final payment action in one card.
- Premium grid/glass UI with page-load animations.

### Orders

- Order tracking page.
- Order status timeline.
- Order item summary.
- Sequenced GSAP reveal animations.

### Profile

- Profile summary and avatar upload/remove.
- Stats:
  - total orders
  - most bought item
  - favorite restaurant
  - ZipCoins balance
- Saved addresses via AddressManager.
- Review prompt for reviewable items.
- Order history cards.
- Polished grid/glass UI.

### Reviews

- Reviewable items fetched from API.
- Review modal available from profile.
- Customers can rate/review eligible items.

### ZipCoins

- ZipCoins balance visible in profile.
- ZipCoins can be used at checkout.
- 1 ZipCoin = ₹1 discount.
- Order summary reflects coin discounts.

---

## Admin Features

### Admin Dashboard

Located at:

```txt
/admin/src/app/(admin)/page.tsx
```

Features:

- Revenue summary.
- Orders summary.
- New users summary.
- Average order value.
- Animated stat counters after page reveal.
- Revenue chart.
- Orders over time chart.
- Order status distribution chart.
- Top restaurants chart.
- Top items chart.
- User growth chart.
- Light executive dashboard UI.

### Orders Management

Located at:

```txt
/admin/src/app/(admin)/orders/page.tsx
```

Features:

- Order stats.
- Status filters.
- Sorting.
- Pagination.
- Order list/table.
- Status management hooks.
- Navigation to detailed order pages.

### Users Management

Located at:

```txt
/admin/src/app/(admin)/users/page.tsx
```

Features:

- View/manage users.
- Works with admin permissions.

### Restaurants Management

Located at:

```txt
/admin/src/app/(admin)/restaurants/page.tsx
```

Features:

- Manage restaurants.
- Restaurant data integration with backend.

### Banners Management

Located at:

```txt
/admin/src/app/(admin)/banners/page.jsx or page.tsx equivalent
```

Features:

- Manage promotional banners.
- Banner routes and controller exist in backend.

### Coupons Management

Located at:

```txt
/admin/src/app/(admin)/coupons/page.tsx
/admin/src/app/(admin)/coupons/new/page.tsx
/admin/src/components/coupons
```

Features:

- Coupon list/table.
- New coupon form.
- Coupon status badge.
- Coupon usage card.
- Backend coupon engine and usage tracking.

### BI Assistant

Located at:

```txt
/admin/src/app/(admin)/BI/page.jsx
```

Features:

- Conversational BI-style assistant page.
- Dark premium assistant UI.
- Floating gradient orbs.
- Real-time hover spotlight styling.

### Queries / Support

Located at:

```txt
/admin/src/app/(admin)/queries/page.tsx
/admin/src/components/support
```

Features:

- Admin support panel.
- Order edit support panel.
- Support ticket/message backend models.
- Socket.IO support integration.

### RBAC / Roles / Staff

Located at:

```txt
/admin/src/app/(admin)/roles
/admin/src/app/(admin)/staff/page.tsx
/admin/src/components/PermissionGuard.tsx
/admin/src/components/ModuleSync.tsx
```

Features:

- Role creation/editing.
- Staff management.
- Permission guards.
- Module sync.
- Sidebar resources mapped to permissions.

---

## Restaurant Owner Features

Located in:

```txt
/admin/src/app/(restaurant)/restaurant
```

Features:

- Restaurant owner dashboard.
- Restaurant menu management.
- Restaurant order management.
- Dedicated restaurant navbar/sidebar.
- Restaurant-specific chart components.

Relevant files:

```txt
/admin/src/app/(restaurant)/restaurant/page.tsx
/admin/src/app/(restaurant)/restaurant/menu/page.tsx
/admin/src/app/(restaurant)/restaurant/orders/page.tsx
/admin/src/components/Restaurant/RestaurantNavbar.tsx
/admin/src/components/Restaurant/RestaurantSidebar.tsx
```

---

## User Flow

Typical customer journey:

```txt
Home
  ↓
Search / All Restaurants
  ↓
Restaurant Menu
  ↓
Cart Drawer
  ↓
Checkout
  ↓
Order Tracking
  ↓
Profile / Order History / Reviews
```

---

## Admin Flow

Typical admin journey:

```txt
Admin Login
  ↓
Dashboard
  ↓
Orders / Users / Restaurants / Coupons / Banners
  ↓
Support Queries / BI Assistant
  ↓
RBAC Roles and Staff Management
```

---

## Restaurant Owner Flow

Typical restaurant owner journey:

```txt
Restaurant Owner Login
  ↓
Restaurant Dashboard
  ↓
Manage Menu
  ↓
Manage Restaurant Orders
```

---

## Tech Stack

### Client

- Next.js 14
- React 18
- Redux Toolkit
- React Redux
- Axios
- Tailwind CSS
- GSAP
- Lenis smooth scrolling
- Firebase client SDK
- Socket.IO client

### Admin

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Axios
- Recharts
- GSAP
- Firebase client SDK
- Socket.IO / Socket.IO client
- Lucide React

### Server

- Node.js
- Express
- MongoDB
- Mongoose
- JWT authentication
- bcrypt
- Socket.IO
- Firebase Admin SDK
- Multer
- Cloudinary
- OpenAI package integration
- Zod
- NanoID

---

## Project Structure

```txt
ZippyEats/
├── client/                 # Customer-facing Next.js app
│   └── src/
│       ├── app/            # App routes/pages
│       ├── components/     # Customer UI components
│       ├── hooks/          # Client hooks
│       ├── lib/            # Axios, images, Firebase helpers
│       └── store/          # Redux slices/store
│
├── admin/                  # Admin + restaurant-owner Next.js app
│   └── src/
│       ├── app/            # Admin and restaurant-owner routes
│       ├── components/     # Admin layout, charts, coupons, support, UI
│       ├── hooks/          # Admin hooks
│       └── lib/            # API and chart config
│
├── server/                 # Express API server
│   └── src/
│       ├── config/         # DB and upload config
│       ├── controllers/    # Route controllers
│       ├── middleware/     # Auth, admin, permissions, errors
│       ├── models/         # Mongoose models
│       ├── routes/         # API routes
│       ├── services/       # Order, coupons, Firebase, support services
│       ├── socket/         # Socket support handlers
│       └── utils/          # Seeds, sync scripts, helpers
│
├── food_images/            # Local/static food image assets
└── ZippyEats.menuitems.json
```

---

## Major Pages and Modules

### Client Pages

```txt
/client/src/app/page.js                         # Home
/client/src/app/restaurants/page.js             # All restaurants
/client/src/app/search/page.js                  # Search results
/client/src/app/restaurant/[id]/page.js         # Restaurant menu
/client/src/app/checkout/page.js                # Checkout
/client/src/app/orders/[id]/page.js             # Order tracking
/client/src/app/profile/page.js                 # User profile
/client/src/app/login/page.js                   # Login/auth
```

### Client Components

```txt
/client/src/components/Navbar.js
/client/src/components/CartDrawer.js
/client/src/components/AddressManager.js
/client/src/components/ReviewModal.js
/client/src/components/RouteLoader.js
/client/src/components/CuisineBar.js
/client/src/components/PromoCarousel.js
/client/src/components/PopularBar.js
/client/src/components/TopRated.js
/client/src/components/QuickBites.js
/client/src/components/Recently.js
/client/src/components/RushDeals.js
```

### Admin Pages

```txt
/admin/src/app/(admin)/page.tsx                 # Admin dashboard
/admin/src/app/(admin)/orders/page.tsx          # Orders management
/admin/src/app/(admin)/users/page.tsx           # Users
/admin/src/app/(admin)/restaurants/page.tsx     # Restaurants
/admin/src/app/(admin)/banners/page.jsx|tsx     # Banners
/admin/src/app/(admin)/coupons/page.tsx         # Coupons
/admin/src/app/(admin)/coupons/new/page.tsx     # New coupon
/admin/src/app/(admin)/queries/page.tsx         # Queries/support
/admin/src/app/(admin)/BI/page.jsx              # BI Assistant
/admin/src/app/(admin)/roles/page.tsx           # Roles
/admin/src/app/(admin)/staff/page.tsx           # Staff
/admin/src/app/login/page.tsx                   # Admin login
```

### Restaurant Owner Pages

```txt
/admin/src/app/(restaurant)/restaurant/page.tsx
/admin/src/app/(restaurant)/restaurant/menu/page.tsx
/admin/src/app/(restaurant)/restaurant/orders/page.tsx
```

---

## Backend API Areas

The server mounts the major APIs under `/api`.

### Core API Areas

```txt
/api/auth                 # Auth/login/register
/api/restaurants          # Restaurants
/api/restaurant/:id       # Restaurant details
/api/menu                 # Menu items
/api/orders               # Customer orders
/api/search               # Search restaurants/menu items
/api/users                # User profile, addresses, coins, profile picture
/api/reviews              # Reviews and reviewable items
/api/coupons              # Customer coupon apply/remove logic
/api/fcm                  # Firebase notification registration
/api/support              # Support tickets/messages
/api/ai                   # AI/BI assistant endpoints
```

### Admin API Areas

```txt
/api/admin/stats          # Dashboard analytics
/api/admin/orders         # Admin order management
/api/admin/coupons        # Admin coupon management
/api/admin/roles          # Roles/RBAC
/api/admin/modules        # Module sync/permissions
```

### Restaurant Owner API Area

```txt
/api/restaurant-owner     # Restaurant-owner menu/order/dashboard APIs
```

---

## Real-Time Features

Socket.IO is initialized on the backend:

```txt
/server/src/lib/socket.js
/server/src/socket/supportSocket.js
```

Used for:

- Live order related communication
- Support chat/tickets
- Real-time admin/customer interactions where applicable

The server reloads active orders on startup through:

```txt
/server/src/services/orderEngine.js
```

---

## Coupons, Rewards, and ZipCoins

### Coupons

Backend coupon logic is handled through:

```txt
/server/src/services/couponEngine.js
/server/src/services/couponUsageService.js
/server/src/utils/couponValidation.js
/server/src/controllers/couponController.js
```

Coupon-related features:

- Apply coupon at checkout.
- Display discount in order summary.
- Remove coupon.
- Track coupon usage.
- Admin coupon creation and management.
- BXGY reward support.

### BXGY Rewards

The cart supports BXGY/free reward items.

Important behavior:

- Reward items are added as separate free/reward lines.
- Removing coupon cleans reward items.
- Backward cleanup also handles older merged reward quantities.

### ZipCoins

ZipCoins are a customer reward wallet.

Features:

- Balance shown in profile.
- Can be redeemed at checkout.
- 1 ZipCoin = ₹1 discount.
- Order summary shows ZipCoins discount.

---

## Notifications

Firebase is used for push notifications.

Relevant files:

```txt
/client/src/lib/firebase.js
/admin/src/lib/firebase.js
/server/src/services/fcmService.js
/server/src/routes/fcmRoutes.js
```

Features:

- Firebase service worker registration.
- FCM token registration.
- Backend notification service.
- Notification click navigation support in layout.

---

## Design System

ZippyEats uses a premium modern food-tech interface.

### Client Design Direction

- Mint-sage background: `#f0f3f1`
- Emerald green brand accents
- Soft glassmorphism cards
- Coordinate-grid backgrounds
- Ambient peach/mint/honey light lenses
- GSAP reveals and micro-interactions
- Lenis smooth scrolling
- Frosted white cards and panels

### Admin Design Direction

- Clean light executive dashboard surface
- Slate text and white glass panels
- Subtle emerald/cyan/violet/amber accents
- Recharts analytics panels
- GSAP page-load reveal animations
- Minimal operational UI; avoids overdone neon effects

---

## Local Setup

### Prerequisites

Install:

- Node.js
- npm
- MongoDB connection string
- Firebase project credentials if using notifications

Clone repository:

```bash
git clone https://github.com/maharshi-bud/ZippyEats.git
cd ZippyEats
```

---

## Server Setup

```bash
cd server
npm install
npm run dev
```

Default server port:

```txt
5010
```

Health check:

```txt
GET http://localhost:5010/api/health
```

---

## Client Setup

```bash
cd client
npm install
npm run dev
```

Default client URL:

```txt
http://localhost:3000
```

---

## Admin Setup

```bash
cd admin
npm install
npm run dev
```

Default admin URL:

```txt
http://localhost:3010
```

---

## Environment Variables

### Server `.env`

Example variables:

```env
PORT=5010
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CORS_ORIGINS=http://localhost:3000,http://localhost:3010,https://zippy-eats-p4to.vercel.app,https://zippy-eats.vercel.app

# Firebase Admin / FCM
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key

# Optional integrations
OPENAI_API_KEY=your_openai_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### Client `.env.local`

```env
NEXT_PUBLIC_API_BASE=http://localhost:5010
NEXT_PUBLIC_SERVER_URL=http://localhost:5010
```

For production, use the deployed API URL.

### Admin `.env.local`

```env
NEXT_PUBLIC_API_BASE=http://localhost:5010
NEXT_PUBLIC_SERVER_URL=http://localhost:5010
```

For production, use the deployed API URL.

---

## Available Scripts

### Root

The root package is minimal and only contains shared dependencies.

### Server

```bash
cd server
npm run dev       # Start backend with nodemon
npm start         # Start backend with node
npm run seed:admin
```

### Client

```bash
cd client
npm run dev
npm run build
npm start
```

### Admin

```bash
cd admin
npm run dev
npm run build
npm start
npm run lint
```

---

## Deployment Notes

### Client

Deployed at:

```txt
https://zippy-eats-p4to.vercel.app/
```

### Admin

Deployed at:

```txt
https://zippy-eats.vercel.app/
```

### Server

Server should be deployed separately and configured through environment variables.

Important production setup:

- Set `CORS_ORIGINS` to include deployed client/admin URLs.
- Set correct MongoDB URI.
- Set JWT secret.
- Set Firebase credentials if push notifications are enabled.
- Set Cloudinary credentials if profile/menu uploads require Cloudinary.

---

## Known Notes / Development Guardrails

### GSAP Animation Guardrails

- Do not animate the same properties with both Tailwind transitions and GSAP.
- Avoid `transition-all` on elements controlled by GSAP transforms/opacity.
- For accordions, let GSAP control height/opacity instead of React inline height toggles.
- After expanding dynamic content, set height back to `auto` for responsiveness.

### Fixed/Backdrop Layout Guardrails

- Avoid placing `position: fixed` elements inside transformed/backdrop-filtered parents.
- Keep fixed ambient backgrounds as siblings of content shells where possible.

### Lenis Scroll Guardrails

- Lenis is used in the client for smooth scrolling.
- GSAP ScrollTrigger should be synchronized carefully when used.
- Always guard browser-only logic with:

```js
if (typeof window !== "undefined") {
  // browser-only code
}
```

### Cart/Coupon Guardrails

- BXGY/free reward items must be flagged separately:

```js
isFree: true
isRewardItem: true
reward_type: "bxgy"
```

- Coupon removal should remove reward items and clean older merged reward quantities.

---

## Summary

ZippyEats is a complete food delivery platform with customer ordering, admin analytics, restaurant-owner tools, coupons, rewards, reviews, notifications, and real-time support/order workflows.

Live apps:

```txt
Client: https://zippy-eats-p4to.vercel.app/
Admin:  https://zippy-eats.vercel.app/
```
