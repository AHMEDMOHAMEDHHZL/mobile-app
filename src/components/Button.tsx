import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { radius, spacing, typography } from "../theme";
import { useTheme } from "../providers/ThemeProvider";

interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "success" | "outline";
  size?: "sm" | "md" | "lg";
  style?: object;
}

export function Button({
  label,
  onPress,
  loading,
  disabled,
  variant = "primary",
  size = "md",
  style,
}: ButtonProps) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const paddingV = size === "sm" ? spacing.sm : size === "lg" ? spacing.xl : spacing.md + 2;

  const BG_MAP = {
    primary: colors.navyDeep,
    secondary: colors.slate100,
    danger: colors.error,
    success: colors.success,
    outline: "transparent",
  };

  const TEXT_MAP = {
    primary: colors.white,
    secondary: colors.navyDeep,
    danger: colors.white,
    success: colors.white,
    outline: colors.navyDeep,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: BG_MAP[variant], paddingVertical: paddingV },
        variant === "outline" && styles.outlined,
        (disabled || loading || pressed) && styles.dimmed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={TEXT_MAP[variant]} size="small" />
      ) : (
        <Text style={[styles.label, { color: TEXT_MAP[variant] }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  base: {
    borderRadius: radius.cardSm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: colors.navyDeep,
  },
  dimmed: { opacity: 0.6 },
  label: {
    fontFamily: typography.bold,
    fontSize: typography.body,
  },
});
