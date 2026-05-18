import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API = "http://localhost:5010/api/auth";
const SERVER = "http://localhost:5010";

// ✅ Safe getter
const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

// ── FCM helpers ──────────────────────────────────────────
async function registerFCMToken(jwtToken) {
  try {
    const { requestNotificationPermission } = await import("../../lib/firebase");
    const fcmToken = await requestNotificationPermission(jwtToken);
    if (!fcmToken) return;

    sessionStorage.setItem("fcm_init", "true");
    Object.keys(sessionStorage)
      .filter(k => k.startsWith("fcm_init_"))
      .forEach(k => sessionStorage.removeItem(k));

    console.log("[FCM] Token registered on login");
  } catch (err) {
    console.error("[FCM] Login token registration failed:", err);
  }
}

async function clearFCMToken(jwtToken) {
  try {
    await fetch(`${SERVER}/api/fcm/token`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwtToken}` },
    });

    sessionStorage.removeItem("fcm_init");
    Object.keys(sessionStorage)
      .filter(k => k.startsWith("fcm_init_"))
      .forEach(k => sessionStorage.removeItem(k));

    console.log("[FCM] Token cleared on logout");
  } catch (err) {
    console.error("[FCM] Logout token clear failed:", err);
  }
}

// 🔹 Register
export const registerUser = createAsyncThunk(
  "auth/register",
  async (data, thunkAPI) => {
    try {
      const res = await axios.post(`${API}/register`, data);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Register failed"
      );
    }
  }
);

// 🔹 Login
export const loginUser = createAsyncThunk(
  "auth/login",
  async (data, thunkAPI) => {
    try {
      const res = await axios.post(`${API}/login`, data);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Login failed"
      );
    }
  }
);

const initialState = {
  token: getToken(),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (token) clearFCMToken(token); // ✅ clear FCM token on logout
        localStorage.removeItem("token");
      }
      state.token = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 🔹 REGISTER
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        if (typeof window !== "undefined") {
          localStorage.setItem("token", action.payload.token);
          registerFCMToken(action.payload.token); // ✅ register FCM on signup too
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // 🔹 LOGIN
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        if (typeof window !== "undefined") {
          localStorage.setItem("token", action.payload.token);
          registerFCMToken(action.payload.token); // ✅ register FCM on login
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
