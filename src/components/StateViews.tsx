import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { spacing, typography } from "../theme";
import { useTheme } from "../providers/ThemeProvider";

interface EmptyStateProps {
  message?: string;
  icon?: string;
}

interface LoadingProps {
  message?: string;
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function LoadingState({ message = "جاري التحميل..." }: LoadingProps) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.msg}>{message}</Text>
    </View>
  );
}

export function EmptyState({ message = "لا توجد بيانات بعد", icon = "📭" }: EmptyStateProps) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.center}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.msg}>{message}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.center}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={[styles.msg, { color: colors.error }]}>{message}</Text>
      {onRetry && (
        <Text style={styles.retryText} onPress={onRetry}>
          اضغط للمحاولة مرة أخرى
        </Text>
      )}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
    gap: spacing.md,
  },
  icon: { fontSize: 40 },
  msg: {
    fontFamily: typography.regular,
    fontSize: typography.body,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 24,
  },
  retryText: {
    fontFamily: typography.semiBold,
    fontSize: typography.body,
    color: colors.primary,
    marginTop: spacing.sm,
  },
});
