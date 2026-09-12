import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.DEV ? "" : import.meta.env.VITE_API_URL || "http://localhost:8081",
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("senviet_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axiosClient;