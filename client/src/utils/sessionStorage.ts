import type { UserProfile } from '../contexts/AuthContext';

interface StoredSession {
  token: string;
  expiresAt: number;
}

const AUTH_TOKEN_KEY = 'auth_session';
const USER_PROFILE_KEY = 'user_profile';

const hasStorage = (): boolean => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readJson = <T>(key: string): T | null => {
  if (!hasStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
};

const writeJson = (key: string, value: unknown): void => {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

export const readStoredSession = (): StoredSession | null => {
  const session = readJson<StoredSession>(AUTH_TOKEN_KEY);
  if (!session || typeof session.token !== 'string' || typeof session.expiresAt !== 'number') {
    return null;
  }

  if (session.expiresAt <= Date.now()) {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    return null;
  }

  return session;
};

export const writeStoredSession = (token: string, ttlMs: number): void => {
  writeJson(AUTH_TOKEN_KEY, {
    token,
    expiresAt: Date.now() + ttlMs,
  });
};

export const clearStoredSession = (): void => {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
};

const isUserProfile = (value: unknown): value is UserProfile => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const profile = value as Record<string, unknown>;
  return (
    typeof profile.name === 'string' &&
    (profile.preferredLanguage === 'en' || profile.preferredLanguage === 'es' || profile.preferredLanguage === 'fr') &&
    (profile.accessibilityPreference === 'none' || profile.accessibilityPreference === 'step-free' || profile.accessibilityPreference === 'visual-assistance') &&
    typeof profile.ticketSection === 'string' &&
    typeof profile.seatNumber === 'string'
  );
};

export const readStoredProfile = (fallback: UserProfile): UserProfile => {
  const storedProfile = readJson<unknown>(USER_PROFILE_KEY);
  return isUserProfile(storedProfile) ? storedProfile : fallback;
};

export const writeStoredProfile = (profile: UserProfile): void => {
  writeJson(USER_PROFILE_KEY, profile);
};