import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { authStorage } from "./auth.storage";
import type { AuthState, AuthUser, UserRole } from "./auth.types";

interface AuthContextValue extends AuthState {
  isReady: boolean;
  isAuthenticated: boolean;
  login: (params: { token: string; userType: UserRole; user: AuthUser | null }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({
    token: null,
    userType: null,
    user: null,
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    authStorage.hydrate().then((hydrated) => {
      setState(hydrated);
      setIsReady(true);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isReady,
      isAuthenticated: !!state.token,
      async login({ token, userType, user }) {
        await Promise.all([
          authStorage.setToken(token),
          authStorage.setUserType(userType),
          authStorage.setUser(user),
        ]);

        setState({ token, userType, user });
      },
      async logout() {
        await authStorage.clear();
        setState({ token: null, userType: null, user: null });
      },
      async updateUser(user) {
        await authStorage.setUser(user);
        setState((current) => ({ ...current, user }));
      },
    }),
    [isReady, state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
