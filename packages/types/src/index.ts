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
export type CheckerStatus = "complete" | "partial";
export type CheckerMatchKind = "exact" | "front3" | "last3" | "last2";

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
  prizeAmount: number;
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

export interface CheckerDrawOption {
  drawDate: string;
  drawCode: string | null;
  drawStatus: PublishStatus;
}

export interface CheckerDrawOptionsResponse {
  items: CheckerDrawOption[];
}

export interface CheckerCheckRequest {
  ticketNumber: string;
  drawDate?: string;
}

export interface CheckerMatch {
  prizeType: PrizeType;
  prizeAmount: number;
  matchedNumber: string;
  matchKind: CheckerMatchKind;
}

export interface CheckerCheckResponse {
  ticketNumber: string;
  drawDate: string;
  drawCode: string | null;
  drawStatus: PublishStatus;
  checkStatus: CheckerStatus;
  isWinner: boolean;
  matches: CheckerMatch[];
  totalWinningAmount: number;
  checkedPrizeTypes: PrizeType[];
  uncheckedPrizeTypes: PrizeType[];
}

export interface BlogParagraphBlock {
  type: "paragraph";
  text: string;
}

export type BlogBodyBlock = BlogParagraphBlock;

export interface BlogListItem {
  slug: string;
  title: string;
  excerpt: string | null;
  bannerImageUrl: string | null;
  publishedAt: string;
}

export interface BlogListResponse {
  items: BlogListItem[];
  page: number;
  limit: number;
  total: number;
}

export interface BlogTranslation {
  locale: SupportedLocale;
  title: string;
  body: BlogBodyBlock[];
  excerpt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface BlogDetailResponse {
  slug: string;
  bannerImageUrl: string | null;
  publishedAt: string;
  translation: BlogTranslation;
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

export type AdminBlogStatusFilter = "draft" | "published" | "all";

export interface AdminBlogListItem {
  id: string;
  slug: string;
  displayTitle: string;
  status: PublishStatus;
  publishedAt: string | null;
  updatedAt: string;
  createdAt: string;
  availableLocales: SupportedLocale[];
}

export interface AdminBlogListResponse {
  items: AdminBlogListItem[];
}

export interface AdminBlogTranslationDraft {
  locale: SupportedLocale;
  title: string;
  body: BlogBodyBlock[];
  excerpt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string | null;
}

export interface AdminBlogPublishReadiness {
  isPublishable: boolean;
  issues: string[];
}

export interface AdminBlogDetail {
  id: string;
  slug: string;
  bannerImageUrl: string | null;
  status: PublishStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  availableLocales: SupportedLocale[];
  translations: AdminBlogTranslationDraft[];
  publishReadiness: AdminBlogPublishReadiness;
}

export interface AdminBlogDetailResponse {
  post: AdminBlogDetail;
}

export interface AdminBlogListQuery {
  status?: AdminBlogStatusFilter;
}

export interface AdminBlogMetadataRequest {
  slug: string;
}

export interface AdminBlogTranslationUpsertRequest {
  title: string;
  body: BlogBodyBlock[];
  excerpt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface AdminBlogPublishResponse {
  post: AdminBlogDetail;
}

export interface AdminBlogUnpublishResponse {
  post: AdminBlogDetail;
}

export const adminBlogBannerUploadContentTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export type AdminBlogBannerUploadContentType = (typeof adminBlogBannerUploadContentTypes)[number];
export const adminBlogBannerMaxFileSizeBytes = 5 * 1024 * 1024;

export interface AdminBlogBannerUploadInitRequest {
  fileName: string;
  contentType: AdminBlogBannerUploadContentType;
  fileSize: number;
}

export interface AdminBlogBannerUploadInitResponse {
  uploadUrl: string;
  fields: Record<string, string>;
  objectKey: string;
  publicUrl: string;
  expiresAt: string;
}

export interface AdminBlogBannerCompleteRequest {
  objectKey: string;
}

export interface AdminBlogBannerUpdateResponse {
  post: AdminBlogDetail;
}
