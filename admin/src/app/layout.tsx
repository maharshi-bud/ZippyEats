import type { ReactNode } from "react";

import "./global.css";

export const metadata = {
  title: "ZippyEats Admin",
  description: "ZippyEats operations dashboard",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
