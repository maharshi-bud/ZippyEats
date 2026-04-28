"use client";

import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";

export default function Navbar() {
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();

  return (
    <div style={{
      background: "#fc8019",
      padding: "12px",
      color: "white",
      display: "flex",
      justifyContent: "space-between"
    }}>
      <h2>ZippyEats</h2>

      <div>
        <Link href="/" style={{ marginRight: "10px", color: "white" }}>
          Home
        </Link>

        <Link href="/cart" style={{ marginRight: "10px", color: "white" }}>
          Cart
        </Link>

        {token ? (
          <button onClick={() => dispatch(logout())}>Logout</button>
        ) : (
          <Link href="/login" style={{ color: "white" }}>
            Login
          </Link>
        )}
      </div>
    </div>
  );
}