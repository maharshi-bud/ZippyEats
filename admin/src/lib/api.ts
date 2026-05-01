// admin/src/lib/api.ts

import axios from "../../../client/src/lib/axios";

const api = axios.create({
  baseURL: "http://localhost:5010/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
