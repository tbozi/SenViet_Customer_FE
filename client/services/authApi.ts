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

export interface CustomerCheckRequest {
  fullName: string;
  phone: string;
  cccd: string;
}

export interface CustomerCheckResponse {
  status: "NEW_CUSTOMER" | "WALK_IN_CUSTOMER_NEEDS_ACCOUNT" | "ALREADY_REGISTERED";
  email?: string;
  message?: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthenticationResult, LoginRequest>({
      query: (body) => ({ url: "/auth/login", method: "POST", data: body }),
      transformResponse: (response: ApiResponse<AuthenticationResult>) =>
        response.result,
    }),
    checkCustomerRegistration: builder.mutation<ApiResponse<CustomerCheckResponse>, CustomerCheckRequest>({
      query: (body) => ({
        url: "/customer/check-registration",
        method: "POST",
        data: body,
      }),
    }),
    registerRequest: builder.mutation<void, RegisterRequest>({
      query: (body) => ({
        url: "/customer/register-request",
        method: "POST",
        data: body,
      }),
    }),
    verifyOtp: builder.mutation<void, VerifyOtpRequest>({
      query: (body) => ({ url: "/customer/verify-register", method: "POST", data: body }),
    }),
    resendOtp: builder.mutation<void, ResendOtpRequest>({
      query: (body) => ({ url: "/auth/resend-otp", method: "POST", data: body }),
    }),
    getMyProfile: builder.query<Record<string, unknown>, void>({
      query: () => ({ url: "/customer/me/profile", method: "GET" }),
      transformResponse: (response: ApiResponse<Record<string, unknown>>) =>
        response.result,
      providesTags: ["User"],
    }),
    changePassword: builder.mutation<void, ChangePasswordRequest>({
      query: (body) => ({ url: "/customer/me/change-password", method: "PATCH", data: body }),
    }),
  }),
});

export const {
  useLoginMutation,
  useCheckCustomerRegistrationMutation,
  useRegisterRequestMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useGetMyProfileQuery,
  useChangePasswordMutation,
} = authApi;
