import axios from "axios";

const BE_URL = import.meta.env.DEV ? "" : "http://localhost:8081";

const axiosInstance = axios.create({
  baseURL: BE_URL,
  headers: { "Content-Type": "application/json" },
});

// Tự động đính JWT token vào mọi request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("senviet_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Bắt lỗi 401 → xóa token + redirect login
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("senviet_token");
      localStorage.removeItem("senviet_session");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
