import { apiClient } from "@/lib/api-client";
import { AuthTokens, AuthUser, LoginResponse } from "@/types";
import { LoginFormValues } from "@/schemas/auth.schema";

export async function loginRequest(
  credentials: LoginFormValues
): Promise<LoginResponse> {
  const response = await apiClient<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  return response.data!;
}

export async function logoutRequest(token: string): Promise<void> {
  await apiClient("/api/auth/logout", {
    method: "POST",
    token,
  });
}

export async function refreshTokenRequest(
  refreshToken: string
): Promise<AuthTokens> {
  const response = await apiClient<{ tokens: AuthTokens }>("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
  return response.data!.tokens;
}

export async function getMeRequest(token: string): Promise<AuthUser> {
  const response = await apiClient<{ user: AuthUser }>("/api/auth/me", {
    token,
  });
  return response.data!.user;
}
