// admin/src/app/login/page.tsx

"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import api from "../../../../client/src/lib/api";


export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); 
    setError("");

    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const token = res.data.token;

      // store token
      localStorage.setItem("token", token);

      // decode role
      const payload = JSON.parse(atob(token.split(".")[1]));

      if (payload.role !== "admin") {
        alert("Access denied (not admin)");
        localStorage.removeItem("token");
        return;
      }

      router.push("/");
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;

      setError(message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 text-zinc-950 " >

  <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-5 py-10 scale-100">

<main className="
  grid w-full max-w-4xl overflow-hidden
  rounded-2xl border border-zinc-200
  bg-white/80 backdrop-blur-md
  md:grid-cols-[1fr_380px]
  transition-all duration-300
  scale-120
  shadow-[0_20px_60px_rgba(0,0,0,0.12),0_8px_20px_rgba(0,0,0,0.08)]
">
      {/* LEFT PANEL */}
      <section className="hidden bg-gradient-to-br from-zinc-950 to-zinc-800 p-8 text-white md:flex md:flex-col md:justify-between">
        
        <div>
          <div className="mb-10 flex h-10 w-10 items-center justify-center rounded-md bg-white text-sm font-bold text-zinc-950 shadow">
            ZE
          </div>

          <h1 className="max-w-xs text-3xl font-semibold leading-tight tracking-tight">
            ZippyEats command center
          </h1>

          <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-400">
            Manage orders, restaurants, users, and operations in one powerful dashboard.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-5 text-xs">
          <div>
            <div className="font-semibold text-white">Live</div>
            <div className="mt-1 text-zinc-500">Orders</div>
          </div>
          <div>
            <div className="font-semibold text-white">Admin</div>
            <div className="mt-1 text-zinc-500">Access</div>
          </div>
          <div>
            <div className="font-semibold text-white">Secure</div>
            <div className="mt-1 text-zinc-500">Session</div>
          </div>
        </div>

      </section>

      {/* RIGHT PANEL */}
      <section className="px-6 py-8 sm:px-10">

        <div className="mb-8 md:hidden">
          <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-zinc-950 text-sm font-bold text-white">
            ZE
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            ZippyEats Admin
          </h1>
        </div>

        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Admin Login
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Welcome back 👋
          </h2>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>

          {/* EMAIL */}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">
              Email
            </span>
            <input
              type="email"
              value={email}
              required
              placeholder="admin@zippyeats.com"
              className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          {/* PASSWORD */}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">
              Password
            </span>
            <input
              type="password"
              value={password}
              required
              placeholder="Enter password"
              className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {/* ERROR */}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-green-600 px-4 text-sm font-semibold text-white transition hover:bg-green-700 active:scale-95 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Authorized team access only
        </p>

      </section>

    </main>

  </div>
</div>
  );
}
