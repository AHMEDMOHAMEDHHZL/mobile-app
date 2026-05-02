import { View, Text, StyleSheet, TextInput, TextInputProps } from "react-native";
import { radius, spacing, typography } from "../theme";
import { useTheme } from "../providers/ThemeProvider";

interface InputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function InputField({ label, error, style, ...props }: InputFieldProps) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        textAlign="right"
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          error ? styles.inputError : null,
          style,
        ]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: {
    fontFamily: typography.semiBold,
    fontSize: typography.small,
    color: colors.textHeading,
    textAlign: "right",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderMedium,
    backgroundColor: colors.bgSection,
    borderRadius: radius.cardSm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.textBase,
    fontFamily: typography.regular,
    fontSize: typography.body,
  },
  inputError: { borderColor: colors.error },
  error: {
    fontFamily: typography.regular,
    fontSize: typography.small,
    color: colors.error,
    textAlign: "right",
  },
});
