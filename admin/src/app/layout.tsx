import type { ReactNode } from "react";
  // import { useNotifications } from "../hooks/useNotifications";
import NotificationInit from "../components/NotificationInit";

import "./global.css";

export const metadata = {
  title: "ZippyEats Admin",
  description: "ZippyEats operations dashboard",
};

  // useNotifications();


export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
                <NotificationInit /> {/* ✅ client component handles the hook */}

        {children}</body>
    </html>
  );
}
