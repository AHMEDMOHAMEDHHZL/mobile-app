import { api } from "./client";
import { authStorage } from "../auth/auth.storage";

export interface Transaction {
  id: number;
  amount: number;
  type: "credit" | "debit";
  status: string;
  description: string;
  reference?: string;
  created_at: string;
}

export interface WalletData {
  id: number;
  balance: number;
  currency: string;
}

export interface WalletSummary {
  total_balance: number;
  reserved_balance: number;
  available_balance: number;
  open_withdrawals_count: number;
  processing_withdrawals_count: number;
}

export interface WalletOverview {
  wallet: WalletData;
  recentTransactions: Transaction[];
  summary: WalletSummary;
  user_type?: string;
}

export interface VodafoneCashConfig {
  number: string;
  owner_name: string;
}

export interface VodafoneCashDeposit {
  id: number;
  amount: number;
  sender_number: string;
  receipt_url: string;
  status: "pending" | "approved" | "rejected";
  admin_note?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

const getPrefix = async (role?: string | null) => {
  const r = role ?? (await authStorage.getUserType());
  if (r === "craftsman") return "craft/wallet";
  if (r === "company") return "company/wallet";
  return "wallet";
};

export const getWalletOverview = async (role?: string | null): Promise<WalletOverview> => {
  const prefix = await getPrefix(role);
  const res = await api.get(prefix);
  return res.data?.data || res.data;
};

export const getTransactions = async (role?: string | null, params?: any) => {
  const prefix = await getPrefix(role);
  const res = await api.get(`${prefix}/transactions`, { params });
  return res.data?.data || res.data;
};

export const withdraw = async (
  data: {
    amount: number;
    payout_method: "bank" | "mobile_wallet" | "instapay";
    payout_details: any;
  },
  role?: string | null
) => {
  const prefix = await getPrefix(role);
  const res = await api.post(`${prefix}/withdraw`, data);
  return res.data;
};

export const getMyWithdrawalRequests = async (role?: string | null) => {
  const prefix = await getPrefix(role);
  const res = await api.get(`${prefix}/my-requests`);
  return res.data?.data || res.data;
};

export const getVodafoneCashConfig = async (): Promise<VodafoneCashConfig> => {
  const res = await api.get("/vodafone-cash/config");
  return res.data?.data;
};

export const submitVodafoneCashDeposit = async (formData: FormData, role?: string | null) => {
  const prefix = await getPrefix(role);
  const res = await api.post(`${prefix}/vodafone-deposit`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getMyVodafoneDeposits = async (
  role?: string | null
): Promise<VodafoneCashDeposit[]> => {
  const prefix = await getPrefix(role);
  const res = await api.get(`${prefix}/vodafone-deposit/my-requests`);
  const data = res.data?.data;
  return data?.data ?? data ?? [];
};

export const createWallet = async (role?: string | null) => {
  const prefix = await getPrefix(role);
  const res = await api.post(`${prefix}/create`);
  return res.data?.data || res.data;
};
