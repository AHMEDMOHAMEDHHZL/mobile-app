import * as SecureStore from "expo-secure-store";
import type { AuthState, AuthUser, UserRole } from "./auth.types";

const TOKEN_KEY = "sanayei.mobile.token";
const ROLE_KEY = "sanayei.mobile.role";
const USER_KEY = "sanayei.mobile.user";

const isWeb = typeof window !== "undefined";

async function getValue(key: string) {
  if (isWeb) {
    return window.localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function setValue(key: string, value: string | null) {
  if (isWeb) {
    if (value === null) {
      window.localStorage.removeItem(key);
      return;
    }

    window.localStorage.setItem(key, value);
    return;
  }

  if (value === null) {
    await SecureStore.deleteItemAsync(key);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

export const authStorage = {
  async getToken() {
    return getValue(TOKEN_KEY);
  },

  async setToken(token: string | null) {
    await setValue(TOKEN_KEY, token || null);
  },

  async getUserType(): Promise<UserRole> {
    const value = await getValue(ROLE_KEY);
    return (value as UserRole) || null;
  },

  async setUserType(role: UserRole) {
    await setValue(ROLE_KEY, role || null);
  },

  async getUser(): Promise<AuthUser | null> {
    const value = await getValue(USER_KEY);
    if (!value) return null;

    try {
      return JSON.parse(value) as AuthUser;
    } catch {
      return null;
    }
  },

  async setUser(user: AuthUser | null) {
    await setValue(USER_KEY, user ? JSON.stringify(user) : null);
  },

  async clear() {
    await Promise.all([
      setValue(TOKEN_KEY, null),
      setValue(ROLE_KEY, null),
      setValue(USER_KEY, null),
    ]);
  },

  async hydrate(): Promise<AuthState> {
    const [token, userType, user] = await Promise.all([
      this.getToken(),
      this.getUserType(),
      this.getUser(),
    ]);

    return { token, userType, user };
  },
};
