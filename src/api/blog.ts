import { api } from "./client";

export async function getBlogCategories() {
  const res = await api.get("/blog/categories");
  const raw = res.data?.data ?? res.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

export async function getBlogPosts(params: Record<string, any> = {}) {
  const res = await api.get("/blog/posts", { params });
  const payload = res.data;
  const posts = payload?.data?.data ?? payload?.data ?? payload?.posts ?? [];
  return {
    posts: Array.isArray(posts) ? posts : [],
    featured: Array.isArray(payload?.featured) ? payload.featured : [],
  };
}
