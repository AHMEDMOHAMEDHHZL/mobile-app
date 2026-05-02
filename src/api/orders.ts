import { api } from "./client";
import { authStorage } from "../auth/auth.storage";
import type { UserRole } from "../auth/auth.types";

const handleError = (error: any) => {
  if (error.response) {
    return {
      message: error.response.data?.message || "حدث خطأ أثناء العملية",
      status: error.response.status,
    };
  }
  return { message: error.message || "حدث خطأ غير متوقع", status: 0 };
};

const getClientPath = async (role?: UserRole) => {
  const r = role ?? (await authStorage.getUserType());
  return r === "company" ? "/company/service-requests" : "/user/service-requests";
};

export const getMyServiceRequests = async () => {
  const res = await api.get("/user/service-requests");
  return res.data;
};

export const getCompanyServiceRequests = async () => {
  const res = await api.get("/company/service-requests");
  return res.data;
};

export const getIncomingServiceRequests = async () => {
  const res = await api.get("/craftsmen/service-requests");
  return res.data;
};

export const updateServiceRequestStatus = async (
  requestId: number,
  status: "accepted" | "rejected"
) => {
  const res = await api.post(`/craftsmen/service-requests/${requestId}/status`, { status });
  return res.data;
};

export const cancelServiceRequest = async (requestId: number) => {
  const path = await getClientPath();
  const res = await api.post(`${path}/${requestId}/cancel`, {});
  return res.data;
};

export const completeServiceRequest = async (requestId: number) => {
  const path = await getClientPath();
  const res = await api.post(`${path}/${requestId}/complete`, { user_confirmation: "confirmed" });
  return res.data;
};

export const payFinalAmount = async (requestId: number) => {
  const path = await getClientPath();
  const res = await api.post(`${path}/${requestId}/pay-final`, {});
  return res.data;
};

export const payDeposit = async (requestId: number) => {
  const path = await getClientPath();
  const res = await api.post(`${path}/${requestId}/pay-deposit`, {});
  return res.data;
};

export const sendOffer = async (
  requestId: number,
  payload: { price: number; duration: string }
) => {
  try {
    const res = await api.post(`/craftsmen/service-requests/${requestId}/offer`, payload);
    return res.data;
  } catch (err) {
    throw handleError(err);
  }
};

export const acceptOffer = async (requestId: number) => {
  const path = await getClientPath();
  const res = await api.post(`${path}/${requestId}/accept-offer`, {});
  return res.data;
};

export const createServiceRequest = async (payload: any) => {
  const path = await getClientPath();
  const config: any = {};
  if (payload instanceof FormData) {
    config.headers = { "Content-Type": "multipart/form-data" };
  }
  try {
    const res = await api.post(path, payload, config);
    return res.data;
  } catch (err) {
    throw handleError(err);
  }
};

export const fetchOrdersForRole = async (role: UserRole) => {
  try {
    let result: any;
    if (role === "craftsman") {
      result = await getIncomingServiceRequests();
    } else if (role === "company") {
      result = await getCompanyServiceRequests();
    } else {
      result = await getMyServiceRequests();
    }
    const raw = Array.isArray(result) ? result : result?.data || result?.orders || [];
    return Array.isArray(raw) ? raw : raw?.data || [];
  } catch (err: any) {
    throw handleError(err);
  }
};
