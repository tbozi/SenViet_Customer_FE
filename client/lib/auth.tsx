import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";

// ============================================================
// Types
// ============================================================
export interface AuthUser {
  userId: number;
  accountId: number;
  name: string;
  email: string;
  phone?: string;
  birthDate?: string;
  identityNumber?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<{ ok: boolean; error?: string }>;
  verifyRegistration: (email: string, otp: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<AuthUser>) => Promise<{ ok: boolean; error?: string }>;
}

const SESSION_KEY = "senviet_session";
const TOKEN_KEY = "senviet_token";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================
// Provider
// ============================================================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Khôi phục session khi reload trang
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(SESSION_KEY);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // bỏ qua nếu parse lỗi
    }
  }, []);

  const persistSession = (nextUser: AuthUser | null, nextToken: string | null) => {
    setUser(nextUser);
    setToken(nextToken);
    if (nextUser && nextToken) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
      localStorage.setItem(TOKEN_KEY, nextToken);
    } else {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  // ============================================================
  // Login — gọi POST /auth/login
  // ============================================================
  const login: AuthContextValue["login"] = async (email, password) => {
    try {
      const res = await axiosInstance.post("/auth/login", { email, password });
      const data = res.data.result;

      const jwtToken: string = data.token;
      const loggedUser: AuthUser = {
        userId: 0, // sẽ load từ /users/me/profile sau
        accountId: 0,
        name: data.fullName,
        email: data.email,
        phone: data.phone,
      };

      persistSession(loggedUser, jwtToken);

      // Lấy thêm thông tin profile đầy đủ (userId, cccd, dateOfBirth...)
      try {
        const profileRes = await axiosInstance.get("/users/me/profile");
        const profile = profileRes.data.result;
        const fullUser: AuthUser = {
          userId: profile.userId,
          accountId: profile.accountId,
          name: profile.fullName,
          email: profile.email,
          phone: profile.phone,
          birthDate: profile.dateOfBirth,
          identityNumber: profile.cccd,
        };
        persistSession(fullUser, jwtToken);
      } catch {
        // profile load thất bại cũng không sao, vẫn login được
      }

      return { ok: true };
    } catch (err: any) {
      const message = err.response?.data?.message || "";
      if (err.response?.status === 401 || message.toLowerCase().includes("mật khẩu")) {
        return { ok: false, error: "invalid" };
      }
      return { ok: false, error: message || "Không thể đăng nhập" };
    }
  };

  // ============================================================
  // Register — gọi POST /auth/register-request (gửi OTP)
  // ============================================================
  const register: AuthContextValue["register"] = async (name, email, password, phone) => {
    try {
      await axiosInstance.post("/auth/register-request", {
        fullName: name,
        email,
        password,
        phone,
      });
      return { ok: true };
    } catch (err: any) {
      const message = err.response?.data?.message || "";
      const errorCode = String(err.response?.data?.code || err.response?.data?.errorCode || "").toUpperCase();
      if (["EMAIL_EXISTED", "PHONE_EXISTED", "CCCD_EXISTED"].some((code) => errorCode.includes(code))) {
        return { ok: false, error: "account_exists" };
      }
      const normalizedMessage = message.toLowerCase();
      if (normalizedMessage.includes("email đã tồn tại") || normalizedMessage.includes("số điện thoại đã tồn tại") || normalizedMessage.includes("cccd đã tồn tại")) {
        return { ok: false, error: "account_exists" };
      }
      if (message.toLowerCase().includes("email")) return { ok: false, error: "exists" };
      if (message.toLowerCase().includes("điện thoại")) return { ok: false, error: "phone_exists" };
      return { ok: false, error: message || "Không thể tạo tài khoản" };
    }
  };

  // ============================================================
  // Verify OTP — gọi POST /auth/verify-otp
  // ============================================================
  const verifyRegistration: AuthContextValue["verifyRegistration"] = async (email, otp) => {
    try {
      await axiosInstance.post("/auth/verify-otp", { email, otp });
      return { ok: true };
    } catch (err: any) {
      const message = err.response?.data?.message || "";
      if (message.toLowerCase().includes("invalid") || message.toLowerCase().includes("không hợp lệ")) {
        return { ok: false, error: "invalid_code" };
      }
      if (message.toLowerCase().includes("expired") || message.toLowerCase().includes("hết hạn")) {
        return { ok: false, error: "expired" };
      }
      return { ok: false, error: message || "Không thể xác thực" };
    }
  };

  // ============================================================
  // Logout
  // ============================================================
  const logout = () => persistSession(null, null);

  // ============================================================
  // Update Profile — gọi PUT /users/me/profile
  // ============================================================
  const updateProfile: AuthContextValue["updateProfile"] = async (data) => {
    try {
      const res = await axiosInstance.put("/users/me/profile", {
        fullName: data.name,
        phone: data.phone,
        cccd: data.identityNumber,
        dateOfBirth: data.birthDate,
      });
      const profile = res.data.result;
      const updated: AuthUser = {
        ...user!,
        name: profile.fullName,
        phone: profile.phone,
        identityNumber: profile.cccd,
        birthDate: profile.dateOfBirth,
      };
      persistSession(updated, token);
      return { ok: true };
    } catch (err: any) {
      const message = err.response?.data?.message || "Không thể cập nhật hồ sơ";
      return { ok: false, error: message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, verifyRegistration, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
