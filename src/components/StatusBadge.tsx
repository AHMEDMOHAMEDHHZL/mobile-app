import { View, Text, StyleSheet, Pressable } from "react-native";
import { radius, spacing, typography } from "../theme";
import { useTheme } from "../providers/ThemeProvider";

interface StatusBadgeProps {
  status: string;
}

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  pending:               { label: "قيد الانتظار",          bg: "#FFF8E1", text: "#F59E0B" },
  accepted:              { label: "تم القبول",             bg: "#E8F5E9", text: "#4CAF50" },
  pending_negotiation:   { label: "بانتظار عرض جديد ↩️",   bg: "#E3F2FD", text: "#2196F3" },
  offer_sent:            { label: "عرض مُرسل ⏳",           bg: "#E3F2FD", text: "#2196F3" },
  awaiting_deposit:      { label: "بانتظار العربون 💳",     bg: "#FFF3E0", text: "#FF9800" },
  in_progress:           { label: "قيد التنفيذ 🔧",         bg: "#E8EAF6", text: "#3F51B5" },
  awaiting_final_payment:{ label: "فاضل دفع الباقي 💰",     bg: "#FFF8E1", text: "#F59E0B" },
  completed:             { label: "مكتملة ✨",              bg: "#E8F5E9", text: "#4CAF50" },
  rejected:              { label: "تم الرفض",              bg: "#FFEBEE", text: "#F44336" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const cfg = STATUS_MAP[status] || { label: status, bg: colors.slate100, text: colors.slate700 };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

export function getStatusLabel(status: string): string {
  return STATUS_MAP[status]?.label ?? status;
}

const getStyles = (colors: any) => StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: typography.semiBold,
    fontSize: typography.small,
  },
});
