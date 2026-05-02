export type UserRole = "user" | "company" | "craftsman" | "admin" | null;

export interface AuthUser {
  id: number;
  name?: string;
  email?: string;
  company_name?: string;
  profile_image?: string | null;
  company_logo?: string | null;
  status?: string;
}

export interface AuthState {
  token: string | null;
  userType: UserRole;
  user: AuthUser | null;
}
