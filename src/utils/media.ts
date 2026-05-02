import { env } from "../config/env";

const apiRoot = env.apiBaseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");

export function mediaUrl(value?: string | null): string | null {
  if (!value) return null;

  const raw = String(value).trim();
  if (!raw) return null;
  if (/^(https?:|data:|file:|blob:)/i.test(raw)) return raw;

  const normalized = raw.replace(/^\/+/, "");

  if (normalized.startsWith("storage/")) return `${apiRoot}/${normalized}`;
  if (normalized.startsWith("images/")) return `${apiRoot}/${normalized}`;
  if (normalized.startsWith("public/")) return `${apiRoot}/${normalized.replace(/^public\//, "")}`;

  return `${apiRoot}/storage/app/public/${normalized}`;
}

export function firstMediaUrl(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const resolved = mediaUrl(value);
    if (resolved) return resolved;
  }

  return null;
}
