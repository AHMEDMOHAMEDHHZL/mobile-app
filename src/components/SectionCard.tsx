import { View, StyleSheet } from "react-native";
import { radius, spacing } from "../theme";
import { useTheme } from "../providers/ThemeProvider";

interface SectionCardProps {
  children: React.ReactNode;
  style?: object;
  noPadding?: boolean;
}

export function SectionCard({ children, style, noPadding }: SectionCardProps) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={[styles.card, noPadding && styles.noPad, style]}>
      {children}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
    boxShadow: "0 2px 8px rgba(11,30,51,0.06)",
    elevation: 3,
  },
  noPad: { padding: 0 },
});
