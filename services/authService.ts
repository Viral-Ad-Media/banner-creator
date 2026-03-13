import { apiFetch } from './apiClient';
import { supabase } from './supabaseClient';

export type UserPlan = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  plan: UserPlan;
}

type MeResponse = {
  user: AuthUser;
};

const getAuthRedirectUrl = (path = '/auth', search = '') => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return `${window.location.origin}${path}${search}`;
};

const fetchCurrentProfile = async (): Promise<AuthUser> => {
  const response = await apiFetch<MeResponse>('/auth/me');
  return response.user;
};

export const registerUser = async (payload: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthUser> => {
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        name: payload.name,
      },
      emailRedirectTo: getAuthRedirectUrl(),
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session) {
    throw new Error('Sign-up created. Confirm your email before logging in.');
  }

  return fetchCurrentProfile();
};

export const loginUser = async (payload: {
  email: string;
  password: string;
}): Promise<AuthUser> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (error || !data.session) {
    throw new Error(error?.message || 'Unable to sign in.');
  }

  return fetchCurrentProfile();
};

export const sendPasswordResetEmail = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthRedirectUrl('/auth', '?mode=reset'),
  });

  if (error) {
    throw new Error(error.message);
  }
};

export const resetPassword = async (password: string): Promise<AuthUser | null> => {
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    throw new Error(error.message);
  }

  try {
    return await fetchCurrentProfile();
  } catch {
    return null;
  }
};

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    return null;
  }

  try {
    return await fetchCurrentProfile();
  } catch {
    await supabase.auth.signOut();
    return null;
  }
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
};
