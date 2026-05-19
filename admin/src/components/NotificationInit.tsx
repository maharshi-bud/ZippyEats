"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useNotifications } from "../hooks/useNotifications";

export default function NotificationInit() {

  const router = useRouter();

  // existing FCM hook
  useNotifications();

  useEffect(() => {

    const handleMessage = (event: MessageEvent) => {

      console.log(
        "[APP] SW Message:",
        event.data
      );

      // notification click redirect
      if (
        event.data?.type ===
        "navigate"
      ) {

        const url =
          event.data.url; 

        if (url) {

          console.log(
            "[APP] Navigating to:",
            url
          );

          router.push(url);
        }
      }
    };

    navigator.serviceWorker?.addEventListener(
      "message",
      handleMessage
    );

    return () => {

      navigator.serviceWorker?.removeEventListener(
        "message",
        handleMessage
      );
    };

  }, [router]);

  return null;
}