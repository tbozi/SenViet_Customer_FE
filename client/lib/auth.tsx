import { createContext, ReactNode, useContext, useEffect, useState } from "react";

export interface AuthUser {
  name: string;
  email: string;
  phone?: string;
  birthDate?: string;
  identityNumber?: string;
  preferredHotel?: string;
  roomPreference?: string;
  dietaryPreference?: string;
}

interface StoredUser extends AuthUser {
  password: string;
  verified?: boolean;
  verificationCode?: string;
  verificationExpiresAt?: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<{ ok: boolean; error?: string }>;
  verifyRegistration: (email: string, code: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<AuthUser>) => void;
}

const USERS_KEY = "senviet_users";
const SESSION_KEY = "senviet_session";
const DEMO_VERIFICATION_CODE = "123456";
const VERIFICATION_WINDOW = 10 * 60 * 1000;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {
      return;
    }
  }, []);

  const persistSession = (nextUser: AuthUser | null) => {
    setUser(nextUser);
    if (nextUser) localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
    else localStorage.removeItem(SESSION_KEY);
  };

  const login: AuthContextValue["login"] = async (email, password) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const match = readUsers().find((candidate) => candidate.email.toLowerCase() === email.toLowerCase() && candidate.password === password);
    if (!match) return { ok: false, error: "invalid" };
    if (match.verified === false) return { ok: false, error: "unverified" };
    persistSession({ name: match.name, email: match.email, phone: match.phone });
    return { ok: true };
  };

  const register: AuthContextValue["register"] = async (name, email, password, phone) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const users = readUsers();
    if (users.some((candidate) => candidate.email.toLowerCase() === email.toLowerCase())) return { ok: false, error: "exists" };
    writeUsers([...users, { name, email, password, phone, verified: false, verificationCode: DEMO_VERIFICATION_CODE, verificationExpiresAt: Date.now() + VERIFICATION_WINDOW }]);
    return { ok: true };
  };

  const verifyRegistration: AuthContextValue["verifyRegistration"] = async (email, code) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const users = readUsers();
    const index = users.findIndex((candidate) => candidate.email.toLowerCase() === email.toLowerCase());
    if (index < 0) return { ok: false, error: "not_found" };
    const pending = users[index];
    if (pending.verified !== false) {
      persistSession({ name: pending.name, email: pending.email, phone: pending.phone });
      return { ok: true };
    }
    if (pending.verificationExpiresAt && pending.verificationExpiresAt < Date.now()) return { ok: false, error: "expired" };
    if (pending.verificationCode !== code) return { ok: false, error: "invalid_code" };
    const verified = { ...pending, verified: true, verificationCode: undefined, verificationExpiresAt: undefined };
    users[index] = verified;
    writeUsers(users);
    persistSession({ name: verified.name, email: verified.email, phone: verified.phone });
    return { ok: true };
  };

  const logout = () => persistSession(null);

  const updateProfile = (data: Partial<AuthUser>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    persistSession(updated);
    const users = readUsers();
    const index = users.findIndex((candidate) => candidate.email === user.email);
    if (index >= 0) {
      users[index] = { ...users[index], ...data };
      writeUsers(users);
    }
  };

  return <AuthContext.Provider value={{ user, login, register, verifyRegistration, logout, updateProfile }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
