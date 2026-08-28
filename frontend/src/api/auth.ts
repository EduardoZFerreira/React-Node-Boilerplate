import { apiClient } from "./client";
import type { ApiEnvelope } from "../types/api";
import type { AuthUser } from "../types/auth";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  surname: string;
  email: string;
  password: string;
}

interface LoginResponse extends ApiEnvelope {
  userId: string;
}

interface RegisterResponse extends ApiEnvelope {
  id: string;
}

interface MeResponse extends ApiEnvelope {
  user: AuthUser;
}

export async function login(input: LoginInput): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/login", input);
  return data;
}

export async function register(input: RegisterInput): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>("/user", input);
  return data;
}

export async function me(): Promise<AuthUser> {
  const { data } = await apiClient.get<MeResponse>("/me");
  return data.user;
}

export async function logout(): Promise<void> {
  await apiClient.post("/logout");
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await apiClient.post("/auth/change-password", input);
}

export interface ForgotPasswordInput {
  email: string;
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  await apiClient.post("/auth/forgot-password", input);
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  await apiClient.post("/auth/reset-password", input);
}
