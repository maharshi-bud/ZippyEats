"use client";

import "./global.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Provider } from "react-redux";
import { store } from "../store/store";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Provider store={store}>
          <Navbar />
          <div className="container">{children}</div>
          <Footer/>
        </Provider>
      </body>
    </html>
  );
}