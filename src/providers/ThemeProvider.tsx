import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform, useColorScheme as useDeviceColorScheme } from 'react-native';
import * as SecureStore from "expo-secure-store";
import { lightColors, darkColors, ColorsType } from '../theme/colors';

type ThemeContextType = {
  isDark: boolean;
  colors: ColorsType;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  themePreference: 'light' | 'dark' | 'system';
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: lightColors,
  setTheme: () => {},
  themePreference: 'system',
});

export const useTheme = () => useContext(ThemeContext);

const THEME_KEY = "sanayei_theme";

async function getStoredTheme() {
  if (Platform.OS === "web") {
    return window.localStorage.getItem(THEME_KEY);
  }

  return SecureStore.getItemAsync(THEME_KEY);
}

async function setStoredTheme(theme: 'light' | 'dark' | 'system') {
  if (Platform.OS === "web") {
    window.localStorage.setItem(THEME_KEY, theme);
    return;
  }

  await SecureStore.setItemAsync(THEME_KEY, theme);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceTheme = useDeviceColorScheme();
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system');
  const [isDark, setIsDark] = useState(deviceTheme === 'dark');

  useEffect(() => {
    getStoredTheme().then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setThemePreference(stored);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (themePreference === 'system') {
      setIsDark(deviceTheme === 'dark');
    } else {
      setIsDark(themePreference === 'dark');
    }
  }, [deviceTheme, themePreference]);

  const colors = isDark ? darkColors : lightColors;
  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    setThemePreference(theme);
    setStoredTheme(theme).catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ isDark, colors, setTheme, themePreference }}>
      {children}
    </ThemeContext.Provider>
  );
};
