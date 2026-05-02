export type UserRole = "user" | "company" | "craftsman" | "admin" | null;

export interface AuthUser {
  id: number;
  name?: string;
  email?: string;
  company_name?: string;
  profile_image?: string | null;
  profile_photo?: string | null;
  profile_photo_url?: string | null;
  company_logo?: string | null;
  company_logo_url?: string | null;
  status?: string;
}

export interface AuthState {
  token: string | null;
  userType: UserRole;
  user: AuthUser | null;
}
