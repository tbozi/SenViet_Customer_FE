import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AuthUser {
  userId?: number;
  accountId?: number;
  name: string;
  email: string;
  phone?: string;
  birthDate?: string;
  identityNumber?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
}

const initialState: AuthState = {
  token: localStorage.getItem("senviet_token"),
  user: (() => {
    try {
      const storedUser = localStorage.getItem("senviet_session");
      return storedUser ? (JSON.parse(storedUser) as AuthUser) : null;
    } catch {
      return null;
    }
  })(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: AuthUser }>,
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem("senviet_token", action.payload.token);
      localStorage.setItem("senviet_session", JSON.stringify(action.payload.user));
    },
    setUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload;
      if (action.payload) {
        localStorage.setItem("senviet_session", JSON.stringify(action.payload));
      }
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem("senviet_token");
      localStorage.removeItem("senviet_session");
    },
  },
});

export const { setCredentials, setUser, logout } = authSlice.actions;
export default authSlice.reducer;