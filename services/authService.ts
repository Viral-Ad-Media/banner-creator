import { apiFetch, HttpError } from "./apiClient";
import { authClient } from "./authClient";
export type UserPlan = "FREE" | "PRO" | "ENTERPRISE";
export interface AuthUser { id: string; name: string; email: string; plan: UserPlan; }
const fetchCurrentProfile = async (): Promise<AuthUser> => (await apiFetch<{ user: AuthUser }>("/auth/me")).user;
export const registerUser = async (payload: { name: string; email: string; password: string }): Promise<AuthUser> => {
  const { error } = await authClient.signUp.email(payload);
  if (error) throw new Error(error.message || "Could not create account.");
  return fetchCurrentProfile();
};
export const loginUser = async (payload: { email: string; password: string }): Promise<AuthUser> => {
  const { error } = await authClient.signIn.email(payload);
  if (error) throw new Error(error.message || "Unable to sign in.");
  return fetchCurrentProfile();
};
export const sendPasswordResetEmail = async (email: string) => {
  const { error } = await authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/auth?mode=reset` });
  if (error) throw new Error(error.message || "Could not request password reset.");
};
export const resetPassword = async (password: string): Promise<AuthUser | null> => {
  const token = new URLSearchParams(window.location.search).get("token");
  if (!token) throw new Error("Password reset link is missing or expired. Request a new link.");
  const { error } = await authClient.resetPassword({ newPassword: password, token });
  if (error) throw new Error(error.message || "Could not reset password.");
  window.history.replaceState(null, "", "/auth");
  return null;
};
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try { return await fetchCurrentProfile(); }
  catch (error) { if (error instanceof HttpError && error.status === 401) return null; throw error; }
};
export const logoutUser = async () => {
  const { error } = await authClient.signOut({});
  if (error) throw new Error(error.message || "Could not sign out.");
};
export const updateProfile = async (payload: { name: string }): Promise<AuthUser> =>
  (await apiFetch<{ user: AuthUser }>("/auth/me", { method: "PATCH", body: JSON.stringify(payload) })).user;
