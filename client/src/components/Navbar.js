"use client";

import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { useState, useEffect } from "react";
import logo from "../lib/imgs/logoText.png";

export default function Navbar() {
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();

  const [mounted, setMounted] = useState(false);
  const [location, setLocation] = useState("Ahmedabad");
  const [search, setSearch] = useState("");

  
  const cart = useSelector((state) => state.cart.items);

  // 🔥 total items (not just length)
  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );


  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <nav className="navbar">

      {/* LEFT */}
      <div className="nav-left">
        
<Link href="/" className="nav-header">

  <img src={logo.src} alt="ZippyEats" className="logo-img" />
  
</Link> 
        {/* 📍 LOCATION */}
        <select
          className="location-select"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          <option>Ahmedabad</option>
          <option>Mumbai</option>
          <option>Delhi</option>
          <option>Bangalore</option>
        </select>
      </div>

      {/* 🔍 SEARCH */}
      <div className="nav-search">
        <input
          type="text"
          placeholder="Search restaurants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>


      




      {/* RIGHT */}
      <div className="nav-links">
        <Link href="/">Home</Link>
        {/* <Link href="/cart">Cart</Link> */}

      <Link href="/cart" className="cart-link">
          🛒 Cart

          {totalItems > 0 && (
            <span className="cart-badge">
              {totalItems}
            </span>
          )}
        </Link>



        {token ? (
          <button className="logout-btn" onClick={() => dispatch(logout())}>
            Logout
          </button>
        ) : (
          <Link href="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}