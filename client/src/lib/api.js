import axios from "axios";

const baseURL = `${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5010"}/api`;

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
