// admin/src/lib/api.ts

import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5010/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log("Request to:",
      `${config.baseURL ?? ""}${config.url ?? ""}`
    );
  console.log("Authorization header:", config.headers.Authorization ? "✓ Present" : "✗ Missing");
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      message: error.response?.data?.message,
    });
    return Promise.reject(error);
  }
);

export default api;
