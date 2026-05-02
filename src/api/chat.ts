import { api } from "./client";

export interface ChatContact {
  id: number;
  name: string;
  type: string;
  profile_photo_url?: string | null;
  profile_photo?: string | null;
  profile_image_url?: string | null;
  profile_image?: string | null;
  avatar?: string | null;
  unread_count?: number;
  last_message?: string;
  updated_at?: string;
  is_admin_support?: boolean;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  sender_type: string;
  sender_name?: string;
  receiver_id: number;
  receiver_type: string;
  receiver_name?: string;
  message?: string;
  message_type?: "text" | "image" | "audio";
  media_path?: string | null;
  is_read?: boolean;
  created_at: string;
}

export async function getChatContacts(role?: string) {
  const endpoint = role === "craftsman" ? "/chat/worker-chats" : "/chat/user-chats";
  const res = await api.get(endpoint);
  const raw = res.data?.data ?? res.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

export async function getChatWorkers() {
  const res = await api.get("/chat/workers");
  const raw = res.data?.data ?? res.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

export async function getChatMessages(contactId: number, contactType: string) {
  const res = await api.get("/chat/messages", {
    params: {
      worker_id: contactId,
      contact_type: contactType === "craftsman" ? "worker" : contactType,
    },
  });
  const raw = res.data?.messages ?? res.data?.data ?? res.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

export async function sendChatMessage(payload: {
  sender_id: number;
  sender_type: string;
  receiver_id: number;
  receiver_type: string;
  message: string;
}) {
  const res = await api.post("/chat/messages/send", {
    ...payload,
    sender_type: payload.sender_type === "craftsman" ? "worker" : payload.sender_type,
    receiver_type: payload.receiver_type === "craftsman" ? "worker" : payload.receiver_type,
  });
  return res.data;
}

export async function markChatRead(id: number, type: string) {
  const res = await api.post("/chat/messages/mark-read", {
    id,
    type: type === "craftsman" ? "worker" : type,
  });
  return res.data;
}
