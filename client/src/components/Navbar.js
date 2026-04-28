"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <div className="navbar">
      <h2>🍔 FoodApp</h2>
      <div>
        <Link href="/">Home</Link>
        <Link href="/cart">Cart</Link>
      </div>
    </div>
  );
}