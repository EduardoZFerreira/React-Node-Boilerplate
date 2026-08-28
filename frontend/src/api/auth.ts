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
