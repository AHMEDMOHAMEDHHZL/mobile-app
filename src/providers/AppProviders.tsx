import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../auth/AuthContext";
import { ThemeProvider, useTheme } from "./ThemeProvider";
import { PushNotificationsProvider } from "./PushNotificationsProvider";

const queryClient = new QueryClient();

function NavigationProvider({ children }: PropsWithChildren) {
  const { colors, isDark } = useTheme();

  const navigationTheme = {
    ...DefaultTheme,
    dark: isDark,
    colors: {
      ...DefaultTheme.colors,
      background: colors.bgApp,
      card: colors.bgApp,
      primary: colors.primary,
      text: colors.textBase,
      border: colors.borderMedium,
      notification: colors.warning,
    },
  };

  return <NavigationContainer theme={navigationTheme}>{children}</NavigationContainer>;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <PushNotificationsProvider>
              <NavigationProvider>{children}</NavigationProvider>
            </PushNotificationsProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
