import { ScrollView, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../providers/ThemeProvider";

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: object;
  noPadding?: boolean;
}

export function Screen({ children, scrollable, style, noPadding }: ScreenProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const content = scrollable ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[!noPadding && styles.scrollContent, style]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, !noPadding && styles.content, style]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      {content}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  fill: { flex: 1 },
  content: { flex: 1 },
  scrollContent: { flexGrow: 1 },
});
