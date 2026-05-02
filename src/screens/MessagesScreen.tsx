import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Screen } from "../components/Screen";
import { EmptyState, ErrorState } from "../components/StateViews";
import { getChatContacts, getChatMessages, getChatWorkers, markChatRead, sendChatMessage, type ChatContact, type ChatMessage } from "../api/chat";
import { useAuth } from "../auth/AuthContext";
import { radius, spacing, typography } from "../theme";
import { useTheme } from "../providers/ThemeProvider";
import { firstMediaUrl, mediaUrl } from "../utils/media";

export function MessagesScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user, userType } = useAuth();
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [workers, setWorkers] = useState<ChatContact[]>([]);
  const [active, setActive] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadContacts = useCallback(async (spinner = true) => {
    if (spinner) setLoading(true);
    try {
      const [chatRows, workerRows] = await Promise.all([
        getChatContacts(userType || undefined),
        userType === "admin" ? Promise.resolve([]) : getChatWorkers(),
      ]);
      setContacts(chatRows);
      setWorkers(workerRows);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "تعذر تحميل المحادثات");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userType]);

  const loadMessages = useCallback(async (contact: ChatContact) => {
    setChatLoading(true);
    try {
      const rows = await getChatMessages(contact.id, contact.type);
      setMessages(rows);
      await markChatRead(contact.id, contact.type);
    } finally {
      setChatLoading(false);
    }
  }, []);

  useEffect(() => { loadContacts(); }, [loadContacts]);
  useEffect(() => {
    if (active) void loadMessages(active);
  }, [active, loadMessages]);

  const mergedContacts = useMemo(() => {
    const map = new Map<string, ChatContact>();
    [...contacts, ...workers].forEach((item) => {
      const key = `${item.type}-${item.id}`;
      if (!map.has(key)) map.set(key, item);
    });
    const rows = Array.from(map.values());
    if (!search.trim()) return rows;
    return rows.filter((item) => item.name?.toLowerCase().includes(search.trim().toLowerCase()));
  }, [contacts, workers, search]);

  const handleSend = async () => {
    if (!active || !user?.id || !userType || !text.trim()) return;
    const message = text.trim();
    setText("");
    setSending(true);
    try {
      const sent = await sendChatMessage({
        sender_id: user.id,
        sender_type: userType,
        receiver_id: active.id,
        receiver_type: active.type,
        message,
      });
      setMessages((current) => [...current, sent]);
      await loadContacts(false);
    } catch {
      setText(message);
    } finally {
      setSending(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={() => loadContacts()} />;

  return (
    <Screen noPadding>
      <View style={styles.header}>
        <Text style={styles.kicker}>الرسائل والمحادثات</Text>
        <Text style={styles.title}>تواصل مع العملاء والصنايعية والإدارة</Text>
      </View>

      <View style={styles.layout}>
        <View style={[styles.contactsPane, active && styles.contactsPaneCompact]}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث عن محادثة..."
            placeholderTextColor={colors.textMuted}
            style={styles.search}
            textAlign="right"
          />
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
          ) : (
            <FlatList
              data={mergedContacts}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadContacts(false); }} />}
              ListEmptyComponent={<EmptyState message="لا توجد محادثات بعد" icon="💬" />}
              renderItem={({ item }) => (
                <Pressable style={[styles.contactCard, active?.id === item.id && active?.type === item.type && styles.contactActive]} onPress={() => setActive(item)}>
                  <View style={styles.avatar}>
                    {contactAvatarUrl(item) ? (
                      <Image source={{ uri: contactAvatarUrl(item)! }} style={styles.avatarImage} resizeMode="cover" />
                    ) : (
                      <Text style={styles.avatarText}>{(item.name || "م").charAt(0)}</Text>
                    )}
                  </View>
                  <View style={styles.contactText}>
                    <Text style={styles.contactName}>{item.name}</Text>
                    <Text style={styles.contactMeta} numberOfLines={1}>{item.last_message || (item.is_admin_support ? "دعم الإدارة" : "ابدأ المحادثة")}</Text>
                  </View>
                  {item.unread_count ? <Text style={styles.unread}>{item.unread_count}</Text> : null}
                </Pressable>
              )}
            />
          )}
        </View>

        <View style={[styles.chatPane, !active && styles.chatPaneEmpty]}>
          {!active ? (
            <EmptyState message="اختر محادثة لعرض الرسائل" icon="💬" />
          ) : (
            <>
              <View style={styles.chatHead}>
                <Pressable style={styles.backBtn} onPress={() => setActive(null)}>
                  <Text style={styles.backText}>رجوع</Text>
                </Pressable>
                <Text style={styles.chatTitle}>{active.name}</Text>
              </View>
              {chatLoading ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
              ) : (
                <FlatList
                  data={messages}
                  keyExtractor={(item) => String(item.id)}
                  contentContainerStyle={styles.messagesList}
                  ListEmptyComponent={<EmptyState message="لا توجد رسائل في هذه المحادثة" icon="💬" />}
                  renderItem={({ item }) => {
                    const mine = isMineMessage(item, user?.id, userType || undefined);
                    const imageUrl = item.message_type === "image" ? mediaUrl(item.media_path) : null;
                    return (
                      <View style={[styles.messageRow, mine ? styles.messageRowMine : styles.messageRowOther]}>
                        {!mine ? (
                          <View style={styles.messageAvatar}>
                            <Text style={styles.messageAvatarText}>{(active.name || "م").charAt(0)}</Text>
                          </View>
                        ) : null}
                        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                          <Text style={[styles.senderLabel, mine ? styles.senderMine : styles.senderOther]}>
                            {mine ? "أنت" : active.name}
                          </Text>
                          {imageUrl ? (
                            <Image source={{ uri: imageUrl }} style={styles.messageImage} resizeMode="cover" />
                          ) : (
                            <Text style={[styles.bubbleText, mine ? styles.bubbleMineText : styles.bubbleOtherText]}>
                              {messageText(item)}
                            </Text>
                          )}
                          <View style={styles.bubbleFooter}>
                            {mine ? <Text style={styles.readState}>{item.is_read ? "مقروءة" : "مرسلة"}</Text> : null}
                            <Text style={[styles.bubbleTime, mine ? styles.bubbleMineTime : styles.bubbleOtherTime]}>{formatDate(item.created_at)}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  }}
                />
              )}
              <View style={styles.inputRow}>
                <Pressable style={[styles.sendBtn, sending && { opacity: 0.6 }]} onPress={handleSend} disabled={sending}>
                  <Text style={styles.sendText}>إرسال</Text>
                </Pressable>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="اكتب رسالتك..."
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  textAlign="right"
                  multiline
                />
              </View>
            </>
          )}
        </View>
      </View>
    </Screen>
  );
}

function formatDate(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

function contactAvatarUrl(contact: ChatContact) {
  return firstMediaUrl(
    contact.profile_photo_url,
    contact.profile_photo,
    contact.profile_image_url,
    contact.profile_image,
    contact.avatar
  );
}

function isMineMessage(message: ChatMessage, userId?: number, userType?: string) {
  if (!userId || !userType || Number(message.sender_id) !== Number(userId)) return false;
  return normalizePartyType(message.sender_type) === normalizePartyType(userType);
}

function normalizePartyType(value?: string) {
  const raw = String(value || "").toLowerCase();
  if (raw.includes("craftsman") || raw === "worker") return "craftsman";
  if (raw.includes("company")) return "company";
  if (raw.includes("admin")) return "admin";
  if (raw.includes("user") || raw === "sanctum") return "user";
  return raw;
}

function messageText(message: ChatMessage) {
  if (message.message) return message.message;
  if (message.message_type === "audio") return "مقطع صوتي";
  if (message.message_type === "image") return "صورة";
  return "رسالة";
}

const getStyles = (colors: any) => StyleSheet.create({
  header: { backgroundColor: colors.navyDeep, padding: spacing.lg, gap: spacing.xs },
  kicker: { fontFamily: typography.semiBold, color: colors.primary, textAlign: "right", fontSize: typography.small },
  title: { fontFamily: typography.bold, color: colors.white, textAlign: "right", fontSize: 20 },
  layout: { flex: 1, backgroundColor: colors.bgSection },
  contactsPane: { flex: 1, padding: spacing.md, gap: spacing.md },
  contactsPaneCompact: { display: "none" },
  chatPane: { flex: 1, backgroundColor: colors.bgApp },
  chatPaneEmpty: { alignItems: "center", justifyContent: "center" },
  search: { backgroundColor: colors.bgApp, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.borderLight, color: colors.textBase, fontFamily: typography.regular },
  contactCard: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.md, backgroundColor: colors.bgApp, borderRadius: radius.card, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.borderLight },
  contactActive: { borderColor: colors.primary, backgroundColor: "rgba(95,168,211,0.10)" },
  avatar: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImage: { width: "100%", height: "100%" },
  avatarText: { fontFamily: typography.bold, color: colors.white, fontSize: 18 },
  contactText: { flex: 1, alignItems: "flex-end" },
  contactName: { fontFamily: typography.bold, color: colors.textHeading, fontSize: typography.body },
  contactMeta: { fontFamily: typography.regular, color: colors.textMuted, fontSize: typography.small },
  unread: { minWidth: 22, height: 22, borderRadius: radius.full, backgroundColor: colors.error, color: colors.white, textAlign: "center", fontFamily: typography.bold, fontSize: typography.tiny, paddingTop: 3 },
  chatHead: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  backBtn: { backgroundColor: colors.bgSection, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full },
  backText: { fontFamily: typography.bold, color: colors.primary, fontSize: typography.small },
  chatTitle: { flex: 1, textAlign: "right", fontFamily: typography.bold, color: colors.textHeading, fontSize: typography.h4 },
  messagesList: { padding: spacing.md, gap: spacing.sm, flexGrow: 1, justifyContent: "flex-end" },
  messageRow: { width: "100%", flexDirection: "row", alignItems: "flex-end", gap: spacing.xs, marginBottom: spacing.sm },
  messageRowMine: { justifyContent: "flex-end" },
  messageRowOther: { justifyContent: "flex-start" },
  messageAvatar: { width: 30, height: 30, borderRadius: radius.full, backgroundColor: colors.bgSection, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.borderLight },
  messageAvatarText: { fontFamily: typography.bold, color: colors.primary, fontSize: typography.small },
  bubble: { maxWidth: "78%", borderRadius: radius.card, padding: spacing.md, gap: 5, borderWidth: 1 },
  bubbleMine: { backgroundColor: colors.primary, borderColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.bgSection, borderColor: colors.borderLight, borderBottomLeftRadius: 4 },
  senderLabel: { fontFamily: typography.bold, fontSize: typography.tiny, textAlign: "right" },
  senderMine: { color: "rgba(255,255,255,0.84)" },
  senderOther: { color: colors.primary },
  bubbleText: { fontFamily: typography.regular, textAlign: "right", lineHeight: 22, fontSize: typography.body },
  bubbleMineText: { color: colors.white },
  bubbleOtherText: { color: colors.textHeading },
  messageImage: { width: 210, height: 150, borderRadius: radius.cardSm, backgroundColor: colors.borderLight },
  bubbleFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  readState: { fontFamily: typography.regular, fontSize: typography.tiny, color: "rgba(255,255,255,0.72)" },
  bubbleTime: { fontFamily: typography.regular, fontSize: typography.tiny, textAlign: "left" },
  bubbleMineTime: { color: "rgba(255,255,255,0.72)" },
  bubbleOtherTime: { color: colors.textMuted },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  input: { flex: 1, minHeight: 44, maxHeight: 110, borderRadius: radius.card, backgroundColor: colors.bgSection, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.textBase, fontFamily: typography.regular },
  sendBtn: { backgroundColor: colors.primary, borderRadius: radius.card, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  sendText: { color: colors.white, fontFamily: typography.bold, fontSize: typography.body },
});
