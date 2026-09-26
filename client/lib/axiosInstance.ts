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

// Bắt lỗi 401 hoặc 403 / 4003 (Token hết hạn / Access denied) → xóa token + redirect login
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;
    const hasToken = !!localStorage.getItem("senviet_token");

    if (hasToken && (status === 401 || status === 403 || code === 4003)) {
      localStorage.removeItem("senviet_token");
      localStorage.removeItem("senviet_session");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
