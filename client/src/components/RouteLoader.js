"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import AppLoader from "./AppLoader";

export default function RouteLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const prevPathname = useRef(pathname);

  const show = () => setLoading(true);

  const hide = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setLoading(false), 300);
  };

  // ✅ Listen for manual triggers (router.push buttons)
  useEffect(() => {
    window.addEventListener("zippy-route-loading", show);
    return () => window.removeEventListener("zippy-route-loading", show);
  }, []);

  // ✅ Listen for <Link> / <a> clicks
  useEffect(() => {
    const handleClick = (event) => {
      const anchor = event.target.closest?.("a[href]");
      if (!anchor) return;

      // ignore external / new tab / modified click
      if (anchor.target && anchor.target !== "_self") return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const url = new URL(anchor.href, window.location.href);
      const current = `${window.location.pathname}${window.location.search}`;
      const next = `${url.pathname}${url.search}`;

      // only show if same origin and path actually changes
      if (url.origin === window.location.origin && next !== current) {
        show();
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  // ✅ Listen for browser back / forward button
  useEffect(() => {
    const handlePopState = () => show();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // ✅ Hide loader when pathname actually changes
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      hide();
    }
  }, [pathname]);

  // ✅ Safety fallback — always hide after 3s max
  useEffect(() => {
    if (!loading) return;
    const fallback = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(fallback);
  }, [loading]);

  // cleanup on unmount
  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  if (!loading) return null;

  return <AppLoader fullScreen label="Loading" />;
}