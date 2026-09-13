import { baseApi, type ApiResponse } from "./baseApi";

interface LoginRequest {
  email: string;
  password: string;
}

interface VerifyOtpRequest {
  email: string;
  otp: string;
}

interface ResendOtpRequest {
  email: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthenticationResult {
  token: string;
  email: string;
  fullName: string;
  phone?: string;
}

interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  cccd: string;
  password: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthenticationResult, LoginRequest>({
      query: (body) => ({ url: "/auth/login", method: "POST", data: body }),
      transformResponse: (response: ApiResponse<AuthenticationResult>) =>
        response.result,
    }),
    registerRequest: builder.mutation<void, RegisterRequest>({
      query: (body) => ({
        url: "/auth/register-request",
        method: "POST",
        data: body,
      }),
    }),
    verifyOtp: builder.mutation<void, VerifyOtpRequest>({
      query: (body) => ({ url: "/auth/verify-otp", method: "POST", data: body }),
    }),
    resendOtp: builder.mutation<void, ResendOtpRequest>({
      query: (body) => ({ url: "/auth/resend-otp", method: "POST", data: body }),
    }),
    getMyProfile: builder.query<Record<string, unknown>, void>({
      query: () => ({ url: "/users/me/profile", method: "GET" }),
      transformResponse: (response: ApiResponse<Record<string, unknown>>) =>
        response.result,
      providesTags: ["User"],
    }),
    changePassword: builder.mutation<void, ChangePasswordRequest>({
      query: (body) => ({ url: "/users/me/change-password", method: "PATCH", data: body }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterRequestMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useGetMyProfileQuery,
  useChangePasswordMutation,
} = authApi;
