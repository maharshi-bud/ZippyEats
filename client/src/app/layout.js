"use client";

import "./global.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Provider } from "react-redux";
import { store } from "../store/store";
import {cart} from "../components/CartDrawer"
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Provider store={store}>
          <Navbar />
          <div className="container">{children}</div>
          < cart/>
          <Footer/>

        </Provider>
      </body>
    </html>
  );
}