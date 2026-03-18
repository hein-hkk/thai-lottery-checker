export type SupportedLocale = "en" | "th" | "my";

export const adminRoles = ["super_admin", "editor"] as const;
export type AdminRole = (typeof adminRoles)[number];

export const adminPermissions = ["manage_results", "manage_blogs"] as const;
export type AdminPermission = (typeof adminPermissions)[number];

export interface ServiceStatus {
  name: string;
  status: "up" | "down";
}

export interface AdminSessionPayload {
  adminId: string;
  email: string;
  role: AdminRole;
  passwordUpdatedAt: string | null;
}

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
  effectivePermissions: AdminPermission[];
}

export interface AdminAuthResponse {
  admin: AuthenticatedAdmin;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export const prizeTypes = [
  "FIRST_PRIZE",
  "NEAR_FIRST_PRIZE",
  "SECOND_PRIZE",
  "THIRD_PRIZE",
  "FOURTH_PRIZE",
  "FIFTH_PRIZE",
  "FRONT_THREE",
  "LAST_THREE",
  "LAST_TWO"
] as const;

export type PrizeType = (typeof prizeTypes)[number];

export interface PrizeGroup {
  type: PrizeType;
  numbers: string[];
}

export interface PrizeTypeMetadata {
  type: PrizeType;
  digitLength: number;
  expectedCount: number;
  order: number;
  labelKey: string;
}

export interface GroupableLotteryResult {
  prizeType: PrizeType;
  prizeIndex: number;
  number: string;
}

export interface ResultDetailResponse {
  drawDate: string;
  drawCode: string | null;
  publishedAt: string;
  prizeGroups: PrizeGroup[];
}

export interface ResultHistoryItem {
  drawDate: string;
  drawCode: string | null;
  firstPrize: string;
  lastTwo: string;
}

export interface ResultHistoryResponse {
  items: ResultHistoryItem[];
  page: number;
  limit: number;
  total: number;
}
