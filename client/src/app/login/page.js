"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, registerUser } from "../../store/slices/authSlice";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const dispatch = useDispatch();
  const router = useRouter();

  const { token, loading, error } = useSelector((state) => state.auth);

  const handleSubmit = () => {
    if (isLogin) {
      dispatch(loginUser(form));
    } else {
      dispatch(registerUser(form));
    }
  };

  useEffect(() => {
    if (token) router.push("/");
  }, [token, router]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 ml-[33vw]">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border">

        {/* TITLE */}
        <h2 className="text-2xl font-bold text-center mb-6">
          {isLogin ? "Welcome Back 👋" : "Create Account 🚀"}
        </h2>

        {/* FORM */}
        <div className="space-y-4">

          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
          )}

          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />

        </div>

        {/* BUTTON */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition active:scale-95 disabled:opacity-60"
        >
          {loading
            ? "Please wait..."
            : isLogin
            ? "Login"
            : "Register"}
        </button>

        {/* ERROR */}
        {error && (
          <p className="text-red-500 text-sm mt-3 text-center">
            {error}
          </p>
        )}

        {/* SWITCH */}
        <p
          onClick={() => setIsLogin(!isLogin)}
          className="mt-6 text-center text-sm text-slate-600 cursor-pointer hover:text-green-600 transition"
        >
          {isLogin
            ? "New user? Register"
            : "Already have an account? Login"}
        </p>
      </div>
    </div>
  );
}