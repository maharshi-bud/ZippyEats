"use client";

import { Provider } from "react-redux";
import { store } from "../store/store";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Provider store={store}>{children}</Provider>
      </body>
    </html>
  );
}