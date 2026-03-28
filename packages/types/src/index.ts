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

export interface AdminInvitationCreateRequest {
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
}

export interface AdminInvitationCreateResponse {
  invitationId: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  expiresAt: string;
  inviteUrl?: string;
}

export interface AdminInvitationAcceptRequest {
  token: string;
  name: string;
  password: string;
}

export interface AdminInvitationAcceptResponse {
  success: true;
}

export interface AdminInvitationRevokeRequest {
  invitationId: string;
}

export interface AdminInvitationRevokeResponse {
  success: true;
}

export interface AdminPasswordResetRequest {
  email: string;
}

export interface AdminPasswordResetRequestResponse {
  success: true;
  resetUrl?: string;
}

export interface AdminPasswordResetConfirmRequest {
  token: string;
  password: string;
}

export interface AdminPasswordResetConfirmResponse {
  success: true;
}

export interface AdminListItem {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
  isActive: boolean;
  deactivatedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  permissions: AdminPermission[];
}

export interface AdminListResponse {
  items: AdminListItem[];
}

export interface AdminUpdateRequest {
  role?: AdminRole;
  permissions?: AdminPermission[];
  isActive?: boolean;
}

export interface AdminUpdateResponse {
  admin: AdminListItem;
}

export type PublishStatus = "draft" | "published";

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
  isReleased: boolean;
}

export interface PrizeGroupInput {
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
  publishedAt: string | null;
  prizeGroups: PrizeGroup[];
}

export interface ResultHistoryItem {
  drawDate: string;
  drawCode: string | null;
  firstPrize: string;
  frontThree: string[];
  lastThree: string[];
  lastTwo: string;
}

export interface ResultHistoryResponse {
  items: ResultHistoryItem[];
  page: number;
  limit: number;
  total: number;
}

export interface AdminResultListItem {
  id: string;
  drawDate: string;
  drawCode: string | null;
  status: PublishStatus;
  publishedAt: string | null;
  updatedAt: string;
}

export interface AdminResultListResponse {
  items: AdminResultListItem[];
}

export interface AdminResultDetail {
  id: string;
  drawDate: string;
  drawCode: string | null;
  status: PublishStatus;
  publishedAt: string | null;
  updatedAt: string;
  prizeGroups: PrizeGroup[];
}

export interface AdminResultDetailResponse {
  result: AdminResultDetail;
}

export interface AdminResultWriteRequest {
  drawDate: string;
  drawCode?: string | null;
  prizeGroups: PrizeGroupInput[];
}

export interface AdminResultPublishResponse {
  result: AdminResultDetail;
}
