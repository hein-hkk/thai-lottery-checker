import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { after, before, beforeEach, describe, it } from "node:test";
import { createApp } from "../src/app.js";
import { getApiEnv, resetApiEnvCache } from "../src/config/env.js";
import { prisma } from "../src/db/client.js";
import { seed } from "../prisma/seed.ts";
import { hashPassword, signAdminSession } from "../src/modules/admin-auth/admin-auth.crypto.js";
import { createAdminBlogsService } from "../src/modules/admin-blogs/admin-blogs.service.js";
import type {
  AdminBlogRepositoryPost,
  AdminBlogsRepository
} from "../src/modules/admin-blogs/admin-blogs.repository.js";
import type { BlogBannerStorage } from "../src/modules/admin-blogs/admin-blog-banner-storage.js";
import {
  getAdminEmailService,
  maskEmailAddress,
  resetAdminEmailServiceCache,
  setAdminEmailServiceForTests,
  type AdminEmailRequestContext,
  type AdminEmailService,
  type SendAdminInvitationEmailInput,
  type SendAdminPasswordResetEmailInput
} from "../src/modules/email/admin-email.service.js";
import { getSafeLoggedPath, resetRateLimiters, shouldSkipSecurityLog } from "../src/security/http.js";
import type { AuthenticatedAdmin } from "@thai-lottery-checker/types";

const bootstrapAdminEmail = getApiEnv().ADMIN_BOOTSTRAP_EMAIL.toLowerCase();
const bootstrapAdminPassword = getApiEnv().ADMIN_BOOTSTRAP_PASSWORD;
const actorId = "11111111-1111-4111-8111-111111111111";
const fakeBlogId = "22222222-2222-4222-8222-222222222222";
const adminOrigin = getApiEnv().APP_URL ?? getApiEnv().NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

let server: Server;
let baseUrl: string;

type JsonResponse = {
  status: number;
  body: unknown;
  headers: Headers;
  setCookie: string | null;
};

async function startServer(): Promise<string> {
  const app = createApp();
  server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      resolve();
    });
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Failed to determine test server address");
  }

  return `http://127.0.0.1:${address.port}`;
}

async function requestJson(pathname: string, init: RequestInit = {}): Promise<JsonResponse> {
  const response = await fetch(`${baseUrl}${pathname}`, init);
  const text = await response.text();

  return {
    status: response.status,
    body: text.length > 0 ? JSON.parse(text) : null,
    headers: response.headers,
    setCookie: response.headers.get("set-cookie")
  };
}

function withAdminOrigin(pathname: string, method: string, headers: HeadersInit = {}): HeadersInit {
  if (!pathname.startsWith("/api/v1/admin")) {
    return headers;
  }

  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return headers;
  }

  return {
    origin: adminOrigin,
    ...headers
  };
}

async function getJson(pathname: string, cookie?: string, headers: HeadersInit = {}): Promise<JsonResponse> {
  return requestJson(pathname, {
    headers: {
      ...headers,
      ...(cookie ? { cookie } : {})
    }
  });
}

async function postJson(pathname: string, body: unknown, cookie?: string, headers: HeadersInit = {}): Promise<JsonResponse> {
  return requestJson(pathname, {
    method: "POST",
    headers: withAdminOrigin(pathname, "POST", {
      "Content-Type": "application/json",
      ...headers,
      ...(cookie ? { cookie } : {})
    }),
    body: JSON.stringify(body)
  });
}

async function patchJson(pathname: string, body: unknown, cookie?: string): Promise<JsonResponse> {
  return requestJson(pathname, {
    method: "PATCH",
    headers: withAdminOrigin(pathname, "PATCH", {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {})
    }),
    body: JSON.stringify(body)
  });
}

async function putJson(pathname: string, body: unknown, cookie?: string): Promise<JsonResponse> {
  return requestJson(pathname, {
    method: "PUT",
    headers: withAdminOrigin(pathname, "PUT", {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {})
    }),
    body: JSON.stringify(body)
  });
}

function getCookieValue(setCookieHeader: string | null): string {
  assert.ok(setCookieHeader);
  const [cookie] = setCookieHeader.split(";");
  assert.ok(cookie);
  return cookie;
}

async function login(email: string, password: string): Promise<string> {
  const response = await postJson("/api/v1/admin/auth/login", { email, password });

  assert.equal(response.status, 200);
  return getCookieValue(response.setCookie);
}

async function loginBootstrapAdmin(): Promise<string> {
  return login(bootstrapAdminEmail, bootstrapAdminPassword);
}

async function ensureEditorAdmin(email: string, permissions: Array<"manage_results" | "manage_blogs">): Promise<string> {
  const password = "EditorPass123!";
  const passwordHash = await hashPassword(password);
  const existing = await prisma.admin.findUnique({ where: { email } });

  if (existing) {
    await prisma.adminPermissionGrant.deleteMany({ where: { adminId: existing.id } });
    await prisma.admin.update({
      where: { id: existing.id },
      data: {
        name: email,
        passwordHash,
        role: "editor",
        isActive: true,
        deactivatedAt: null,
        passwordUpdatedAt: new Date()
      }
    });
  } else {
    await prisma.admin.create({
      data: {
        email,
        name: email,
        passwordHash,
        role: "editor",
        isActive: true,
        passwordUpdatedAt: new Date()
      }
    });
  }

  const admin = await prisma.admin.findUniqueOrThrow({ where: { email } });

  if (permissions.length > 0) {
    await prisma.adminPermissionGrant.createMany({
      data: permissions.map((permission) => ({
        adminId: admin.id,
        permission
      }))
    });
  }

  return password;
}

async function getBootstrapAdminId(): Promise<string> {
  const admin = await prisma.admin.findUniqueOrThrow({
    where: { email: bootstrapAdminEmail }
  });

  return admin.id;
}

function expectError(response: JsonResponse, status: number, code: string): void {
  assert.equal(response.status, status);
  assert.equal((response.body as { code?: string }).code, code);
  assert.equal(typeof (response.body as { message?: string }).message, "string");
}

function expectNoSensitiveFields(value: unknown): void {
  const serialized = JSON.stringify(value);

  assert.equal(serialized.includes("passwordHash"), false);
  assert.equal(serialized.includes("tokenHash"), false);
  assert.equal(serialized.includes("resetUrl"), false);
  assert.equal(serialized.includes("inviteUrl"), false);
}

function getBangkokTodayForTests(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Failed to resolve Bangkok today in tests");
  }

  return `${year}-${month}-${day}`;
}

async function createThaiOnlyPublishedBlog(adminId: string): Promise<string> {
  const slug = `security-th-only-${Date.now()}`;

  await prisma.blogPost.create({
    data: {
      slug,
      status: "published",
      publishedAt: new Date("2026-04-08T08:00:00.000Z"),
      createdByAdminId: adminId,
      updatedByAdminId: adminId,
      translations: {
        create: {
          locale: "th",
          title: "บทความทดสอบความปลอดภัย",
          body: [{ type: "paragraph", text: "เนื้อหาสำหรับทดสอบการแยกภาษา" }],
          excerpt: "ทดสอบการแยกภาษา",
          seoTitle: null,
          seoDescription: null
        }
      }
    }
  });

  return slug;
}

function createRepositoryPost(overrides: Partial<AdminBlogRepositoryPost> = {}): AdminBlogRepositoryPost {
  return {
    id: fakeBlogId,
    slug: "security-blog",
    bannerImageUrl: null,
    status: "draft",
    publishedAt: null,
    createdAt: new Date("2026-04-01T08:00:00.000Z"),
    updatedAt: new Date("2026-04-01T08:00:00.000Z"),
    updatedByAdminId: actorId,
    translations: [],
    ...overrides
  };
}

function createFakeBlogRepository(post = createRepositoryPost()): AdminBlogsRepository {
  const unused = async (): Promise<never> => {
    throw new Error("Unexpected repository call in security test");
  };

  return {
    listAdminBlogs: unused,
    findBlogById: async () => post,
    findBlogBySlug: unused,
    createDraftBlog: unused,
    updateBlogMetadata: unused,
    updateBlogBannerImage: unused,
    upsertBlogTranslation: unused,
    publishBlog: unused,
    unpublishBlog: unused
  };
}

function createFakeBannerStorage(options: { objectExists?: boolean } = {}): BlogBannerStorage {
  return {
    isConfigured: () => true,
    createUpload: async () => ({
      uploadUrl: "https://uploads.example.test",
      fields: {},
      objectKey: `blog-banners/${fakeBlogId}/banner.jpg`,
      publicUrl: `https://cdn.example.test/blog-banners/${fakeBlogId}/banner.jpg`,
      expiresAt: "2026-04-10T08:00:00.000Z"
    }),
    objectExists: async () => options.objectExists ?? true,
    deleteObject: async () => {},
    getPublicUrl: (objectKey) => `https://cdn.example.test/${objectKey}`,
    getManagedObjectKeyFromUrl: () => null,
    isBlogObjectKey: (blogId, objectKey) => objectKey.startsWith(`blog-banners/${blogId}/`)
  };
}

function createDisabledBannerStorage(): BlogBannerStorage {
  return {
    isConfigured: () => false,
    createUpload: async () => {
      throw new Error("Unexpected disabled storage upload call");
    },
    objectExists: async () => false,
    deleteObject: async () => {
      throw new Error("Unexpected disabled storage delete call");
    },
    getPublicUrl: (objectKey) => objectKey,
    getManagedObjectKeyFromUrl: () => null,
    isBlogObjectKey: () => false
  };
}

function createActor(permissions: Array<"manage_results" | "manage_blogs"> = ["manage_blogs"]): AuthenticatedAdmin {
  return {
    id: actorId,
    email: "actor@thai-lottery-checker.local",
    name: "Actor",
    role: "editor",
    effectivePermissions: permissions
  };
}

function createDisabledAdminEmailService(): AdminEmailService {
  return {
    provider: "disabled",
    isAutomatedDeliveryEnabled: () => false,
    async sendAdminInvitationEmail() {
      throw new Error("Disabled email service should not send invitations");
    },
    async sendAdminPasswordResetEmail() {
      throw new Error("Disabled email service should not send password resets");
    }
  };
}

async function captureConsole<T>(
  callback: () => Promise<T> | T
): Promise<{ result: T; info: string[]; warn: string[]; error: string[] }> {
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const originalError = console.error;
  const info: string[] = [];
  const warn: string[] = [];
  const error: string[] = [];

  console.info = (...args: unknown[]) => {
    info.push(args.map((value) => String(value)).join(" "));
  };
  console.warn = (...args: unknown[]) => {
    warn.push(args.map((value) => String(value)).join(" "));
  };
  console.error = (...args: unknown[]) => {
    error.push(args.map((value) => String(value)).join(" "));
  };

  try {
    const result = await callback();
    await new Promise<void>((resolve) => {
      setImmediate(() => resolve());
    });
    return { result, info, warn, error };
  } finally {
    console.info = originalInfo;
    console.warn = originalWarn;
    console.error = originalError;
  }
}

function createFakeResendEmailService(options: {
  failInvitation?: boolean;
  failPasswordReset?: boolean;
} = {}): AdminEmailService & {
  sentInvitations: Array<SendAdminInvitationEmailInput & { context?: AdminEmailRequestContext }>;
  sentPasswordResets: Array<SendAdminPasswordResetEmailInput & { context?: AdminEmailRequestContext }>;
} {
  const sentInvitations: Array<SendAdminInvitationEmailInput & { context?: AdminEmailRequestContext }> = [];
  const sentPasswordResets: Array<SendAdminPasswordResetEmailInput & { context?: AdminEmailRequestContext }> = [];

  return {
    provider: "resend",
    isAutomatedDeliveryEnabled: () => true,
    sentInvitations,
    sentPasswordResets,
    async sendAdminInvitationEmail(input, context) {
      if (options.failInvitation) {
        throw new Error("Simulated invitation delivery failure");
      }

      sentInvitations.push({ ...input, context });
      return {
        provider: "resend",
        messageId: `invite-${sentInvitations.length}`
      };
    },
    async sendAdminPasswordResetEmail(input, context) {
      if (options.failPasswordReset) {
        throw new Error("Simulated password reset delivery failure");
      }

      sentPasswordResets.push({ ...input, context });
      return {
        provider: "resend",
        messageId: `reset-${sentPasswordResets.length}`
      };
    }
  };
}

describe("security api", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  before(async () => {
    await seed();
    baseUrl = await startServer();
  });

  beforeEach(() => {
    resetRateLimiters();
    setAdminEmailServiceForTests(createDisabledAdminEmailService());
    resetAdminEmailServiceCache();
  });

  after(async () => {
    process.env.NODE_ENV = originalNodeEnv;
    setAdminEmailServiceForTests(undefined);
    resetAdminEmailServiceCache();

    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    await prisma.$disconnect();
  });

  it("keeps admin login errors generic and rejects unauthenticated or tampered sessions", async () => {
    const invalidLogin = await postJson("/api/v1/admin/auth/login", {
      email: bootstrapAdminEmail,
      password: "wrong-password"
    });
    const unauthenticated = await getJson("/api/v1/admin/auth/me");
    const sessionCookie = await loginBootstrapAdmin();
    const tampered = await getJson("/api/v1/admin/auth/me", `${sessionCookie}tampered`);

    expectError(invalidLogin, 401, "INVALID_ADMIN_CREDENTIALS");
    assert.deepEqual(invalidLogin.body, {
      code: "INVALID_ADMIN_CREDENTIALS",
      message: "Email or password is incorrect"
    });
    expectError(unauthenticated, 401, "ADMIN_UNAUTHORIZED");
    expectError(tampered, 401, "ADMIN_UNAUTHORIZED");
  });

  it("rejects expired admin sessions", async () => {
    const admin = await prisma.admin.findUniqueOrThrow({
      where: { email: bootstrapAdminEmail }
    });
    const expiredAt = new Date(Date.now() - 60_000);
    const session = await prisma.adminSession.create({
      data: {
        adminId: admin.id,
        expiresAt: expiredAt
      }
    });
    const expiredCookie = `admin_session=${signAdminSession(
      {
        sessionId: session.id,
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
        passwordUpdatedAt: admin.passwordUpdatedAt?.toISOString() ?? null,
        expiresAt: expiredAt.toISOString()
      },
      getApiEnv().ADMIN_SESSION_SECRET
    )}`;

    const response = await getJson("/api/v1/admin/auth/me", expiredCookie);

    expectError(response, 401, "ADMIN_UNAUTHORIZED");
  });

  it("rejects deactivated admins from both login and existing session reuse", async () => {
    const email = "deactivated-security@thai-lottery-checker.local";
    const password = await ensureEditorAdmin(email, ["manage_results"]);
    const sessionCookie = await login(email, password);
    const admin = await prisma.admin.findUniqueOrThrow({ where: { email } });

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        isActive: false,
        deactivatedAt: new Date()
      }
    });

    const reusedSession = await getJson("/api/v1/admin/auth/me", sessionCookie);
    const loginAgain = await postJson("/api/v1/admin/auth/login", { email, password });

    expectError(reusedSession, 401, "ADMIN_UNAUTHORIZED");
    expectError(loginAgain, 401, "INVALID_ADMIN_CREDENTIALS");
  });

  it("invalidates old sessions after password reset and clears cookies on logout", async () => {
    const email = "reset-security@thai-lottery-checker.local";
    const oldPassword = await ensureEditorAdmin(email, ["manage_results"]);
    const oldSession = await login(email, oldPassword);
    const resetRequest = await postJson("/api/v1/admin/password-resets/request", { email });

    assert.equal(resetRequest.status, 200);
    assert.equal(typeof (resetRequest.body as { resetUrl?: string }).resetUrl, "string");

    const resetUrl = new URL((resetRequest.body as { resetUrl: string }).resetUrl);
    const token = resetUrl.searchParams.get("token");
    assert.ok(token);

    const reset = await postJson("/api/v1/admin/password-resets/confirm", {
      token,
      password: "NewEditorPass123!"
    });
    const oldSessionAfterReset = await getJson("/api/v1/admin/auth/me", oldSession);
    const newSession = await login(email, "NewEditorPass123!");
    const logout = await postJson("/api/v1/admin/auth/logout", {}, newSession);
    const afterLogout = await getJson("/api/v1/admin/auth/me", newSession);

    assert.equal(reset.status, 200);
    expectError(oldSessionAfterReset, 401, "ADMIN_UNAUTHORIZED");
    assert.equal(logout.status, 200);
    expectError(afterLogout, 401, "ADMIN_UNAUTHORIZED");
    assert.match(logout.setCookie ?? "", /admin_session=/);
    assert.match(logout.setCookie ?? "", /HttpOnly/i);
  });

  it("sets the expected session cookie flags, including Secure in production", async () => {
    const developmentLogin = await postJson("/api/v1/admin/auth/login", {
      email: bootstrapAdminEmail,
      password: bootstrapAdminPassword
    });

    process.env.NODE_ENV = "production";
    const productionLogin = await postJson("/api/v1/admin/auth/login", {
      email: bootstrapAdminEmail,
      password: bootstrapAdminPassword
    });
    process.env.NODE_ENV = originalNodeEnv;

    assert.match(developmentLogin.setCookie ?? "", /HttpOnly/i);
    assert.match(developmentLogin.setCookie ?? "", /SameSite=Lax/i);
    assert.match(developmentLogin.setCookie ?? "", /Path=\//i);
    assert.doesNotMatch(developmentLogin.setCookie ?? "", /;\s*Secure/i);
    assert.match(productionLogin.setCookie ?? "", /HttpOnly/i);
    assert.match(productionLogin.setCookie ?? "", /SameSite=Lax/i);
    assert.match(productionLogin.setCookie ?? "", /Path=\//i);
    assert.match(productionLogin.setCookie ?? "", /;\s*Secure/i);
  });

  it("uses the configured shared cookie domain when present", async () => {
    process.env.ADMIN_SESSION_COOKIE_DOMAIN = "lottokai.com";
    resetApiEnvCache();

    const loginResponse = await postJson("/api/v1/admin/auth/login", {
      email: bootstrapAdminEmail,
      password: bootstrapAdminPassword
    });

    delete process.env.ADMIN_SESSION_COOKIE_DOMAIN;
    resetApiEnvCache();

    assert.match(loginResponse.setCookie ?? "", /;\s*Domain=lottokai\.com/i);
  });

  it("enforces super admin governance and editor permission boundaries", async () => {
    const superAdminCookie = await loginBootstrapAdmin();
    const noPermissionPassword = await ensureEditorAdmin("no-permission-security@thai-lottery-checker.local", []);
    const resultsPassword = await ensureEditorAdmin("results-security@thai-lottery-checker.local", ["manage_results"]);
    const blogsPassword = await ensureEditorAdmin("blogs-security@thai-lottery-checker.local", ["manage_blogs"]);
    const noPermissionCookie = await login("no-permission-security@thai-lottery-checker.local", noPermissionPassword);
    const resultsCookie = await login("results-security@thai-lottery-checker.local", resultsPassword);
    const blogsCookie = await login("blogs-security@thai-lottery-checker.local", blogsPassword);

    const superAdminList = await getJson("/api/v1/admin/admins", superAdminCookie);
    const noPermissionAdmins = await getJson("/api/v1/admin/admins", noPermissionCookie);
    const noPermissionResults = await getJson("/api/v1/admin/results", noPermissionCookie);
    const noPermissionBlogs = await getJson("/api/v1/admin/blogs", noPermissionCookie);
    const resultsEditorBlogWrite = await postJson("/api/v1/admin/blogs", { slug: "blocked-by-results-editor" }, resultsCookie);
    const blogsEditorResultWrite = await postJson(
      "/api/v1/admin/results",
      { drawDate: "2026-05-16", prizeGroups: [] },
      blogsCookie
    );

    assert.equal(superAdminList.status, 200);
    expectError(noPermissionAdmins, 403, "ADMIN_FORBIDDEN");
    expectError(noPermissionResults, 403, "ADMIN_FORBIDDEN");
    expectError(noPermissionBlogs, 403, "ADMIN_FORBIDDEN");
    expectError(resultsEditorBlogWrite, 403, "ADMIN_FORBIDDEN");
    expectError(blogsEditorResultWrite, 403, "ADMIN_FORBIDDEN");
  });

  it("protects the last active super admin from demotion or deactivation", async () => {
    const superAdminCookie = await loginBootstrapAdmin();
    const adminId = await getBootstrapAdminId();
    const deactivate = await patchJson(`/api/v1/admin/admins/${adminId}`, { isActive: false }, superAdminCookie);
    const demote = await patchJson(`/api/v1/admin/admins/${adminId}`, { role: "editor" }, superAdminCookie);

    expectError(deactivate, 400, "LAST_SUPER_ADMIN_PROTECTED");
    expectError(demote, 400, "LAST_SUPER_ADMIN_PROTECTED");
  });

  it("keeps draft and untranslated content out of public APIs while allowing authorized admin access", async () => {
    const adminId = await getBootstrapAdminId();
    const superAdminCookie = await loginBootstrapAdmin();
    const draftDraw = await prisma.lotteryDraw.findFirstOrThrow({ where: { status: "draft" } });
    const draftBlog = await prisma.blogPost.findFirstOrThrow({ where: { status: "draft" } });
    const thOnlySlug = await createThaiOnlyPublishedBlog(adminId);

    const publicDraftDraw = await getJson(`/api/v1/results/${draftDraw.drawDate.toISOString().slice(0, 10)}`);
    const publicHistory = await getJson("/api/v1/results?limit=50");
    const adminDraftDraw = await getJson(`/api/v1/admin/results/${draftDraw.id}`, superAdminCookie);
    const publicDraftBlog = await getJson(`/api/v1/blogs/${draftBlog.slug}?locale=en`);
    const publicUntranslatedBlog = await getJson(`/api/v1/blogs/${thOnlySlug}?locale=en`);
    const publicEnglishBlogs = await getJson("/api/v1/blogs?locale=en&limit=50");
    const publicThaiBlogs = await getJson("/api/v1/blogs?locale=th&limit=50");
    const adminDraftBlog = await getJson(`/api/v1/admin/blogs/${draftBlog.id}`, superAdminCookie);

    const draftDrawDate = draftDraw.drawDate.toISOString().slice(0, 10);
    const isBangkokTodayDraft = draftDrawDate === getBangkokTodayForTests();

    if (isBangkokTodayDraft) {
      assert.equal(publicDraftDraw.status, 200);
    } else {
      expectError(publicDraftDraw, 404, "RESULT_NOT_FOUND");
    }

    assert.equal(JSON.stringify(publicHistory.body).includes(draftDraw.drawCode ?? draftDraw.id), false);
    assert.equal(adminDraftDraw.status, 200);
    assert.equal((adminDraftDraw.body as { result: { status: string } }).result.status, "draft");
    expectError(publicDraftBlog, 404, "BLOG_NOT_FOUND");
    expectError(publicUntranslatedBlog, 404, "BLOG_NOT_FOUND");
    assert.equal(JSON.stringify(publicEnglishBlogs.body).includes(thOnlySlug), false);
    assert.equal(JSON.stringify(publicThaiBlogs.body).includes(thOnlySlug), true);
    assert.equal(adminDraftBlog.status, 200);
    assert.equal((adminDraftBlog.body as { post: { status: string } }).post.status, "draft");
  });

  it("returns structured validation errors for malformed params and invalid payloads", async () => {
    const superAdminCookie = await loginBootstrapAdmin();
    const draftDraw = await prisma.lotteryDraw.findFirstOrThrow({ where: { status: "draft" } });
    const draftBlog = await prisma.blogPost.findFirstOrThrow({ where: { status: "draft" } });
    const malformedUuid = await getJson("/api/v1/admin/results/not-a-uuid", superAdminCookie);
    const oversizedPublicPagination = await getJson("/api/v1/results?limit=999");
    const invalidDrawDate = await getJson("/api/v1/results/not-a-date");
    const invalidPrizeType = await postJson(`/api/v1/admin/results/${draftDraw.id}/prize-groups/NOPE/release`, {}, superAdminCookie);
    const invalidPrizeNumber = await postJson(
      "/api/v1/admin/results",
      {
        drawDate: "2026-06-16",
        prizeGroups: [{ type: "FIRST_PRIZE", numbers: ["abc123"] }]
      },
      superAdminCookie
    );
    const invalidBlogBody = await putJson(
      `/api/v1/admin/blogs/${draftBlog.id}/translations/en`,
      {
        title: "Invalid body",
        body: [{ type: "paragraph", text: "" }]
      },
      superAdminCookie
    );

    expectError(malformedUuid, 400, "INVALID_ADMIN_RESULT_REQUEST");
    expectError(oversizedPublicPagination, 400, "INVALID_QUERY");
    expectError(invalidDrawDate, 400, "INVALID_DRAW_DATE");
    expectError(invalidPrizeType, 400, "INVALID_ADMIN_RESULT_REQUEST");
    expectError(invalidPrizeNumber, 400, "ADMIN_RESULT_DATA_INVALID");
    expectError(invalidBlogBody, 400, "INVALID_ADMIN_BLOG_REQUEST");
  });

  it("does not leak account existence or secret material in production responses", async () => {
    const superAdminCookie = await loginBootstrapAdmin();
    const fakeEmailService = createFakeResendEmailService();
    setAdminEmailServiceForTests(fakeEmailService);
    process.env.NODE_ENV = "production";

    const existingReset = await postJson("/api/v1/admin/password-resets/request", { email: bootstrapAdminEmail });
    const missingReset = await postJson("/api/v1/admin/password-resets/request", {
      email: "missing-security@thai-lottery-checker.local"
    });
    const invite = await postJson(
      "/api/v1/admin/invitations",
      {
        email: `production-invite-${Date.now()}@thai-lottery-checker.local`,
        role: "editor",
        permissions: ["manage_results"]
      },
      superAdminCookie
    );
    const adminList = await getJson("/api/v1/admin/admins", superAdminCookie);

    process.env.NODE_ENV = originalNodeEnv;

    assert.deepEqual(existingReset.body, { success: true });
    assert.deepEqual(missingReset.body, { success: true });
    assert.equal(invite.status, 201);
    assert.equal(adminList.status, 200);
    assert.equal(fakeEmailService.sentInvitations.length, 1);
    expectNoSensitiveFields(existingReset.body);
    expectNoSensitiveFields(missingReset.body);
    expectNoSensitiveFields(invite.body);
    expectNoSensitiveFields(adminList.body);
  });

  it("rate limits repeated login attempts", async () => {
    let lastResponse: JsonResponse | undefined;

    for (let index = 0; index < 21; index += 1) {
      lastResponse = await postJson("/api/v1/admin/auth/login", {
        email: bootstrapAdminEmail,
        password: "wrong-password"
      });
    }

    expectError(lastResponse, 429, "RATE_LIMITED");
  });

  it("rate limits repeated password reset and invitation accept attempts", async () => {
    let resetResponse: JsonResponse | undefined;

    for (let index = 0; index < 11; index += 1) {
      resetResponse = await postJson("/api/v1/admin/password-resets/request", {
        email: "missing-security@thai-lottery-checker.local"
      });
    }

    expectError(resetResponse, 429, "RATE_LIMITED");

    resetRateLimiters();

    let invitationResponse: JsonResponse | undefined;

    for (let index = 0; index < 11; index += 1) {
      invitationResponse = await postJson("/api/v1/admin/invitations/accept", {
        token: `bogus-token-${index}`,
        name: "Rate Limited",
        password: "RateLimited123!"
      });
    }

    expectError(invitationResponse, 429, "RATE_LIMITED");
  });

  it("rate limits repeated public read and checker check requests", async () => {
    let publicReadResponse: JsonResponse | undefined;

    for (let index = 0; index < 121; index += 1) {
      publicReadResponse = await getJson("/api/v1/results/latest");
    }

    expectError(publicReadResponse, 429, "RATE_LIMITED");

    resetRateLimiters();

    let checkerResponse: JsonResponse | undefined;

    for (let index = 0; index < 31; index += 1) {
      checkerResponse = await postJson("/api/v1/checker/check", {
        ticketNumber: "123456"
      });
    }

    expectError(checkerResponse, 429, "RATE_LIMITED");
  });

  it("rejects admin writes from disallowed origins", async () => {
    const sessionCookie = await loginBootstrapAdmin();
    const response = await postJson(
      "/api/v1/admin/results",
      {
        drawDate: "2026-07-01",
        prizeGroups: []
      },
      sessionCookie,
      { origin: "https://evil.example.test" }
    );

    expectError(response, 403, "INVALID_ADMIN_ORIGIN");
  });

  it("redacts sensitive admin route paths and skips noisy admin preflight logs", () => {
    assert.equal(shouldSkipSecurityLog("OPTIONS", "/api/v1/admin/password-resets/request"), true);
    assert.equal(shouldSkipSecurityLog("POST", "/api/v1/admin/password-resets/request"), false);
    assert.equal(getSafeLoggedPath("/api/v1/admin/password-resets/confirm?token=super-secret-token"), "/api/v1/admin/password-resets/confirm");
    assert.equal(getSafeLoggedPath("/api/v1/admin/invitations/accept?token=invite-token"), "/api/v1/admin/invitations/accept");
  });

  it("restricts credentialed CORS headers and hides Express implementation details", async () => {
    const allowedOrigin = getApiEnv().APP_URL ?? getApiEnv().NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const allowed = await getJson("/health", undefined, { origin: allowedOrigin });
    const disallowed = await getJson("/health", undefined, { origin: "https://evil.example.test" });

    assert.equal(allowed.headers.get("access-control-allow-origin"), allowedOrigin);
    assert.equal(allowed.headers.get("access-control-allow-credentials"), "true");
    assert.equal(allowed.headers.get("vary"), "Origin");
    assert.equal(disallowed.headers.get("access-control-allow-origin"), null);
    assert.equal(disallowed.headers.get("access-control-allow-credentials"), null);
    assert.equal(allowed.headers.get("x-powered-by"), null);
  });

  it("fails production env validation when secrets remain on development defaults", async () => {
    const originalSessionSecret = process.env.ADMIN_SESSION_SECRET;
    const originalAppUrl = process.env.APP_URL;
    const originalPublicAppUrl = process.env.NEXT_PUBLIC_APP_URL;

    process.env.NODE_ENV = "production";
    process.env.APP_URL = "https://admin.example.test";
    process.env.NEXT_PUBLIC_APP_URL = "https://admin.example.test";
    process.env.ADMIN_SESSION_SECRET = "development-admin-session-secret-change-me";
    resetApiEnvCache();

    assert.throws(() => getApiEnv(), /ADMIN_SESSION_SECRET/);

    process.env.ADMIN_SESSION_SECRET = originalSessionSecret;
    process.env.APP_URL = originalAppUrl;
    process.env.NEXT_PUBLIC_APP_URL = originalPublicAppUrl;
    process.env.NODE_ENV = originalNodeEnv;
    resetApiEnvCache();
  });

  it("sends automated invitation and reset emails without exposing raw links in responses", async () => {
    const fakeEmailService = createFakeResendEmailService();
    setAdminEmailServiceForTests(fakeEmailService);
    const superAdminCookie = await loginBootstrapAdmin();
    const inviteEmail = `emailed-invite-${Date.now()}@thai-lottery-checker.local`;

    const invite = await postJson(
      "/api/v1/admin/invitations",
      {
        email: inviteEmail,
        role: "editor",
        permissions: ["manage_results"]
      },
      superAdminCookie
    );

    assert.equal(invite.status, 201);
    assert.equal((invite.body as { inviteUrl?: string }).inviteUrl, undefined);
    assert.equal(fakeEmailService.sentInvitations.length, 1);
    assert.equal(fakeEmailService.sentInvitations[0]?.to, inviteEmail);
    assert.match(fakeEmailService.sentInvitations[0]?.acceptUrl ?? "", /\/admin\/invitations\/accept\?token=/);

    const invitationToken = new URL(fakeEmailService.sentInvitations[0]!.acceptUrl).searchParams.get("token");
    assert.ok(invitationToken);

    const accept = await postJson("/api/v1/admin/invitations/accept", {
      token: invitationToken,
      name: "Email Invite Admin",
      password: "EmailInvite123!"
    });

    assert.equal(accept.status, 200);

    const resetEmail = "emailed-reset@thai-lottery-checker.local";
    const resetPassword = await ensureEditorAdmin(resetEmail, ["manage_results"]);
    await login(resetEmail, resetPassword);

    const reset = await postJson("/api/v1/admin/password-resets/request", { email: resetEmail });

    assert.equal(reset.status, 200);
    assert.deepEqual(reset.body, { success: true });
    assert.equal(fakeEmailService.sentPasswordResets.length, 1);
    assert.equal(fakeEmailService.sentPasswordResets[0]?.to, resetEmail);
    assert.match(fakeEmailService.sentPasswordResets[0]?.resetUrl ?? "", /\/admin\/reset-password\/confirm\?token=/);
  });

  it("revokes invitations when automated email delivery fails", async () => {
    const failingEmailService = createFakeResendEmailService({ failInvitation: true });
    setAdminEmailServiceForTests(failingEmailService);
    const superAdminCookie = await loginBootstrapAdmin();
    const email = `invite-fail-${Date.now()}@thai-lottery-checker.local`;

    const invite = await postJson(
      "/api/v1/admin/invitations",
      {
        email,
        role: "editor",
        permissions: ["manage_results"]
      },
      superAdminCookie
    );

    expectError(invite, 503, "ADMIN_EMAIL_DELIVERY_FAILED");

    const invitation = await prisma.adminInvitation.findFirstOrThrow({
      where: { email },
      orderBy: { createdAt: "desc" }
    });

    assert.ok(invitation.revokedAt);
  });

  it("deletes password reset tokens when automated email delivery fails", async () => {
    const failingEmailService = createFakeResendEmailService({ failPasswordReset: true });
    setAdminEmailServiceForTests(failingEmailService);
    const email = "reset-failure@thai-lottery-checker.local";
    const password = await ensureEditorAdmin(email, ["manage_results"]);
    await login(email, password);
    const beforeCount = await prisma.adminPasswordReset.count();

    const reset = await postJson("/api/v1/admin/password-resets/request", { email });

    assert.equal(reset.status, 200);
    assert.deepEqual(reset.body, { success: true });
    assert.equal(await prisma.adminPasswordReset.count(), beforeCount);
  });

  it("fails env validation when resend is enabled without required mail config", async () => {
    const originalEmailProvider = process.env.EMAIL_PROVIDER;
    const originalResendApiKey = process.env.RESEND_API_KEY;
    const originalFromAddress = process.env.EMAIL_FROM_ADDRESS;
    const originalFromName = process.env.EMAIL_FROM_NAME;

    process.env.EMAIL_PROVIDER = "resend";
    process.env.RESEND_API_KEY = "";
    process.env.EMAIL_FROM_ADDRESS = "";
    process.env.EMAIL_FROM_NAME = "";
    resetApiEnvCache();
    resetAdminEmailServiceCache();

    assert.throws(() => getApiEnv(), /RESEND_API_KEY/);

    process.env.EMAIL_PROVIDER = originalEmailProvider;
    process.env.RESEND_API_KEY = originalResendApiKey;
    process.env.EMAIL_FROM_ADDRESS = originalFromAddress;
    process.env.EMAIL_FROM_NAME = originalFromName;
    resetApiEnvCache();
    resetAdminEmailServiceCache();
  });

  it("masks recipient emails in provider delivery logs", async () => {
    const originalEmailProvider = process.env.EMAIL_PROVIDER;
    const originalResendApiKey = process.env.RESEND_API_KEY;
    const originalFromAddress = process.env.EMAIL_FROM_ADDRESS;
    const originalFromName = process.env.EMAIL_FROM_NAME;
    const originalFetch = globalThis.fetch;
    const recipient = "williamaung1701@gmail.com";
    const maskedRecipient = maskEmailAddress(recipient);

    process.env.EMAIL_PROVIDER = "resend";
    process.env.RESEND_API_KEY = "test-resend-api-key";
    process.env.EMAIL_FROM_ADDRESS = "noreply@example.com";
    process.env.EMAIL_FROM_NAME = "LottoKai";
    setAdminEmailServiceForTests(undefined);
    resetApiEnvCache();
    resetAdminEmailServiceCache();

    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ id: "message-1" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      })) as typeof fetch;

    try {
      const captured = await captureConsole(async () =>
        getAdminEmailService().sendAdminPasswordResetEmail(
          {
            to: recipient,
            resetUrl: "https://example.com/admin/reset-password/confirm?token=topsecret",
            expiresAt: new Date("2026-04-18T08:00:00.000Z").toISOString()
          },
          {
            requestId: "req-log-mask",
            entityId: "entity-log-mask"
          }
        )
      );

      assert.equal(captured.info.some((line) => line.includes(recipient)), false);
      assert.equal(captured.info.some((line) => line.includes(maskedRecipient)), true);
      assert.equal(captured.info.some((line) => line.includes("topsecret")), false);
    } finally {
      globalThis.fetch = originalFetch;
      process.env.EMAIL_PROVIDER = originalEmailProvider;
      process.env.RESEND_API_KEY = originalResendApiKey;
      process.env.EMAIL_FROM_ADDRESS = originalFromAddress;
      process.env.EMAIL_FROM_NAME = originalFromName;
      resetApiEnvCache();
      resetAdminEmailServiceCache();
    }
  });

  it("masks recipient emails in governance fallback logs", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const email = "williamaung1701@gmail.com";
    const password = await ensureEditorAdmin(email, ["manage_results"]);
    const maskedRecipient = maskEmailAddress(email);
    await login(email, password);
    setAdminEmailServiceForTests(createDisabledAdminEmailService());
    process.env.NODE_ENV = "production";

    try {
      const captured = await captureConsole(async () =>
        postJson("/api/v1/admin/password-resets/request", {
          email
        })
      );

      assert.equal(captured.result.status, 200);
      assert.deepEqual(captured.result.body, { success: true });
      assert.equal(captured.warn.some((line) => line.includes(email)), false);
      assert.equal(captured.warn.some((line) => line.includes(maskedRecipient)), true);
      assert.equal(captured.warn.some((line) => line.includes('"outcome":"delivery_unavailable"')), true);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("rejects unsafe banner upload requests and object-key mismatches", async () => {
    const service = createAdminBlogsService(createFakeBlogRepository(), createFakeBannerStorage({ objectExists: false }));
    const actor = createActor();

    await assert.rejects(
      service.initBannerUpload(actor, fakeBlogId, {
        fileName: "banner.gif",
        contentType: "image/gif",
        fileSize: 1024
      }),
      /Admin blog banner upload request is invalid/
    );
    await assert.rejects(
      service.initBannerUpload(actor, fakeBlogId, {
        fileName: "banner.jpg",
        contentType: "image/jpeg",
        fileSize: 5 * 1024 * 1024 + 1
      }),
      /Admin blog banner upload request is invalid/
    );
    await assert.rejects(
      service.completeBannerUpload(actor, fakeBlogId, {
        objectKey: "blog-banners/33333333-3333-4333-8333-333333333333/banner.jpg"
      }),
      /Uploaded banner object key is invalid/
    );
    await assert.rejects(
      service.completeBannerUpload(actor, fakeBlogId, {
        objectKey: `blog-banners/${fakeBlogId}/missing.jpg`
      }),
      /Uploaded banner object was not found/
    );
  });

  it("returns the existing banner upload unavailable error when storage is disabled", async () => {
    const service = createAdminBlogsService(createFakeBlogRepository(), createDisabledBannerStorage());
    const actor = createActor();

    await assert.rejects(
      service.initBannerUpload(actor, fakeBlogId, {
        fileName: "banner.jpg",
        contentType: "image/jpeg",
        fileSize: 1024
      }),
      /Blog banner uploads are not configured/
    );
  });
});
