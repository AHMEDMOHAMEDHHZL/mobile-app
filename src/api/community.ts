import { api } from "./client";

export async function getCommunityPosts(params: Record<string, any> = {}) {
  const res = await api.get("/community/posts", { params });
  const raw = res.data?.data ?? res.data?.posts ?? res.data ?? [];
  return Array.isArray(raw) ? raw : raw?.data ?? [];
}

export async function getCommunityOffers(postId: number) {
  const res = await api.get(`/community/posts/${postId}/offers`);
  const raw = res.data?.data ?? res.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

export async function submitCommunityOffer(postId: number, payload: {
  price: number;
  description: string;
  delivery_days: number;
}) {
  const res = await api.post(`/community/posts/${postId}/offers`, payload);
  return res.data;
}

export async function acceptCommunityOffer(postId: number, offerId: number) {
  const res = await api.post(`/community/posts/${postId}/offers/${offerId}/accept`);
  return res.data;
}

export async function createCommunityPost(payload: Record<string, any>) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key === "service_id" ? "category" : key, String(value));
    }
  });
  const res = await api.post("/community/posts", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function getMyCommunityPoints() {
  const res = await api.get("/community/my-points");
  return res.data?.data ?? res.data ?? {};
}
