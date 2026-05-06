"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AppLoader from "./AppLoader";

export default function RouteLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const show = () => setLoading(true);

    const handleClick = (event) => {
      const anchor = event.target.closest?.("a[href]");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const url = new URL(anchor.href, window.location.href);
      const current = `${window.location.pathname}${window.location.search}`;
      const next = `${url.pathname}${url.search}`;

      if (url.origin === window.location.origin && next !== current) {
        show();
      }
    };

    window.addEventListener("zippy-route-loading", show);
    document.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener("zippy-route-loading", show);
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  useEffect(() => {
    if (!loading) return undefined;

    const timer = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, [loading, pathname]);

  return loading ? <AppLoader fullScreen label="Loading" /> : null;
}
