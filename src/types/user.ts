export type UserRole = "ADMIN" | "PROVIDER" | "CLIENT";
export type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "VERIFIED";

export interface User {
  id: string;
  supabaseId: string;
  email: string;
  name?: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderProfile {
  id: string;
  userId: string;
  bio?: string;
  hourlyRate: number;
  categories: string[];
  location?: string;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  slug: string;
}

export interface ClientProfile {
  id: string;
  userId: string;
  address?: string;
  notes?: string;
}
