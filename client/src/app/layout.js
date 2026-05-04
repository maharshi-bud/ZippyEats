"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import "./global.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Provider } from "react-redux";
import { store } from "../store/store";
import CartDrawer from "../components/CartDrawer";

const PUBLIC_ROUTES = ["/login", "/"];

export default function RootLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Allow public routes without token
    if (PUBLIC_ROUTES.includes(pathname)) return;

    // Redirect to login if no token
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      // Validate token expiry
      const payload = JSON.parse(atob(token.split(".")[1]));

      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }
    } catch {
      router.push("/login");
    }
  }, [pathname, router]);

  return (
    <html lang="en">
      <body>
        <Provider store={store}>
          <Navbar />
          <div className="container">{children}</div>
          <CartDrawer />
          <Footer />
        </Provider>
      </body>
    </html>
  );
}