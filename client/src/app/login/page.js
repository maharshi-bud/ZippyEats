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

  // ✅ redirect after login
  useEffect(() => {
    if (token) {
      router.push("/");
    }
  }, [token, router]);

  return (
    <div className="card">
      <h2>{isLogin ? "Login" : "Register"}</h2>

      {!isLogin && (
        <input
          placeholder="Name"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      )}

      <input
        placeholder="Email"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />

      <button className="btn" onClick={handleSubmit}>
        {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <p
        onClick={() => setIsLogin(!isLogin)}
        style={{ cursor: "pointer" }}
      >
        {isLogin ? "New user? Register" : "Already have account? Login"}
      </p>
    </div>
  );
}