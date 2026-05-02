import { api } from "./client";

export interface Service {
  id: number;
  name: string;
  icon?: string;
  description?: string;
}

export const getServices = async (): Promise<Service[]> => {
  const res = await api.get("/services");
  const payload = res.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.services)) return payload.services;
  return [];
};
