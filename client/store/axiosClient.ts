import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8081",
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use((config) => {
  if (config.url?.startsWith("/ai") || config.url?.startsWith("/api/admin-ai")) {
    config.baseURL = "";
  }
  const token = localStorage.getItem("senviet_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axiosClient;
