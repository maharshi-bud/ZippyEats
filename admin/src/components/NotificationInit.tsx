// admin/src/app/components/NotificationInit.tsx  ← NEW FILE
"use client";

import { useNotifications } from "../hooks/useNotifications";

export default function NotificationInit() {
  useNotifications(); // ✅ inside component, client component
  return null;        // renders nothing
}