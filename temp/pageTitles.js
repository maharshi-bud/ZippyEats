// ═══════════════════════════════════════════════════════════════════════════
// HOW TO ADD <title> TO EACH PAGE  (Next.js App Router, JS)
//
// Next.js App Router supports a `metadata` export from any SERVER component,
// and a `generateMetadata` function for dynamic pages.
// Because your pages are "use client", you have two clean options:
//
//   OPTION A (recommended) — Add a tiny server wrapper
//   OPTION B              — Use next/head inside the client component
//
// Below are copy-paste snippets for every page in the client app.
// ═══════════════════════════════════════════════════════════════════════════


// ─── OPTION A: Server wrapper pattern ─────────────────────────────────────
// Create a new file called `_meta.js` (or just inline the export) in each
// route folder. Example for client/src/app/cart/_meta.js :

//   export const metadata = { title: "Your Cart — ZippyEats" };

// This works because layout.js wraps a "use client" AppShell, so the
// individual page.js files can still export metadata if they're server
// components. If your page.js needs to stay "use client", use Option B.


// ─── OPTION B: next/head inside "use client" pages ────────────────────────
// Import Head from "next/head" and render it at the top of your JSX:
//
//   import Head from "next/head";
//   export default function CartPage() {
//     return (
//       <>
//         <Head><title>Your Cart — ZippyEats</title></Head>
//         ... rest of page
//       </>
//     );
//   }


// ─── TITLE STRINGS FOR EVERY ROUTE ────────────────────────────────────────
// Paste the corresponding <Head> block at the top of each page's return:

const PAGE_TITLES = {
  // client/src/app/page.js
  home: "ZippyEats — Fast Food Delivery",

  // client/src/app/restaurants/page.js
  restaurants: "All Restaurants — ZippyEats",

  // client/src/app/restaurant/[id]/page.js  (use restaurant name dynamically)
  restaurant: (name) => `${name} — ZippyEats`,

  // client/src/app/cart/page.js
  cart: "Your Cart — ZippyEats",

  // client/src/app/checkout/page.js
  checkout: "Checkout — ZippyEats",

  // client/src/app/orders/[id]/page.js
  orderTracking: "Track Your Order — ZippyEats",

  // client/src/app/profile/page.js
  profile: "My Profile — ZippyEats",

  // client/src/app/login/page.js
  login: "Login — ZippyEats",

  // client/src/app/search/page.js
  search: "Search — ZippyEats",
};

export default PAGE_TITLES;


// ─── EXAMPLE: dynamic restaurant page ─────────────────────────────────────
// In client/src/app/restaurant/[id]/page.js, after you fetch the restaurant:
//
//   import Head from "next/head";
//
//   export default function RestaurantPage({ params }) {
//     const [restaurant, setRestaurant] = useState(null);
//     ...
//     return (
//       <>
//         <Head>
//           <title>{restaurant ? `${restaurant.name} — ZippyEats` : "ZippyEats"}</title>
//         </Head>
//         ... rest of page
//       </>
//     );
//   }
