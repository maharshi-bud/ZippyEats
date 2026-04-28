import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5010/api",
  withCredentials: false
});

// 🔐 Request interceptor
instance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        // ensure headers exist
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ❌ Response interceptor (important)
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized globally
    if (error.response?.status === 401) {
      console.warn("Unauthorized - token may be invalid");

      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default instance;