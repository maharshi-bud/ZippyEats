"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import "./global.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Provider } from "react-redux";
import { store } from "../store/store";
import CartDrawer from "../components/CartDrawer";
import { useDispatch } from "react-redux";
import { replaceCart } from "../store/slices/cartSlice";

const PUBLIC_ROUTES = ["/login", "/"];

// ─────────────────────────────────────────────
// Separate inner component so it's INSIDE Provider
// and can safely use useDispatch
// ─────────────────────────────────────────────
function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();

  // ── Auth guard ──────────────────────────────
  useEffect(() => {
    if (PUBLIC_ROUTES.includes(pathname)) return;

    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        router.push("/login");
      }
    } catch {
      router.push("/login");
    }
  }, [pathname, router]);

  // ── Cross-tab cart sync ──────────────────────
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "cart") {
        try {
          const parsed = event.newValue 
            ? JSON.parse(event.newValue) 
            : { items: [] };
          
          // ✅ Extract items array from object shape { items: [...] }
          const items = Array.isArray(parsed.items) ? parsed.items : [];
          
          dispatch(replaceCart(items));
        } catch (error) {
          console.error("Failed to sync cart from storage event:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [dispatch]);

  return (
    <>
      <Navbar />
      <div className="container">{children}</div>
      <CartDrawer />
      <Footer />
    </>
  );
}

// ─────────────────────────────────────────────
// Root layout just wraps with Provider
// ─────────────────────────────────────────────
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Provider store={store}>
          <AppShell>{children}</AppShell>
        </Provider>
      </body>
    </html>
  );
}