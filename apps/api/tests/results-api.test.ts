import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { after, before, describe, it } from "node:test";
import { createApp } from "../src/app.js";
import { getApiEnv } from "../src/config/env.js";
import { seed } from "../prisma/seed.ts";
import { hashPassword } from "../src/modules/admin-auth/admin-auth.crypto.js";
import { createAdminBlogsService } from "../src/modules/admin-blogs/admin-blogs.service.js";
import type { AdminBlogsRepository, AdminBlogRepositoryPost } from "../src/modules/admin-blogs/admin-blogs.repository.js";
import type { BlogBannerStorage } from "../src/modules/admin-blogs/admin-blog-banner-storage.js";
import { type BlogApiError } from "../src/modules/blog/blog.errors.js";
import type { BlogRepository } from "../src/modules/blog/blog.repository.js";
import { createBlogService } from "../src/modules/blog/blog.service.js";
import { createCheckerService } from "../src/modules/checker/checker.service.js";
import type { CheckerRepository } from "../src/modules/checker/checker.repository.js";
import { type CheckerApiError } from "../src/modules/checker/checker.errors.js";
import { createResultsService } from "../src/modules/results/results.service.js";
import type { ResultsRepository } from "../src/modules/results/results.repository.js";
import { type ResultsApiError } from "../src/modules/results/results.errors.js";
import { prisma } from "../src/db/client.js";
import type { AuthenticatedAdmin } from "@thai-lottery-checker/types";

let server: Server;
let baseUrl: string;

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

async function getJson(pathname: string): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${baseUrl}${pathname}`);
  return {
    status: response.status,
    body: (await response.json()) as unknown
  };
}

async function getJsonWithCookie(pathname: string, cookie?: string): Promise<{ status: number; body: unknown; setCookie: string | null }> {
  const response = await fetch(`${baseUrl}${pathname}`, {
    headers: cookie ? { cookie } : undefined
  });

  return {
    status: response.status,
    body: (await response.json()) as unknown,
    setCookie: response.headers.get("set-cookie")
  };
}

async function postJson(
  pathname: string,
  body: unknown,
  cookie?: string
): Promise<{ status: number; body: unknown; setCookie: string | null }> {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {})
    },
    body: JSON.stringify(body)
  });

  return {
    status: response.status,
    body: (await response.json()) as unknown,
    setCookie: response.headers.get("set-cookie")
  };
}

async function patchJson(
  pathname: string,
  body: unknown,
  cookie?: string
): Promise<{ status: number; body: unknown; setCookie: string | null }> {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {})
    },
    body: JSON.stringify(body)
  });

  return {
    status: response.status,
    body: (await response.json()) as unknown,
    setCookie: response.headers.get("set-cookie")
  };
}

async function putJson(
  pathname: string,
  body: unknown,
  cookie?: string
): Promise<{ status: number; body: unknown; setCookie: string | null }> {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {})
    },
    body: JSON.stringify(body)
  });

  return {
    status: response.status,
    body: (await response.json()) as unknown,
    setCookie: response.headers.get("set-cookie")
  };
}

async function deleteJson(pathname: string, cookie?: string): Promise<{ status: number; body: unknown; setCookie: string | null }> {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: "DELETE",
    headers: cookie ? { cookie } : undefined
  });

  return {
    status: response.status,
    body: (await response.json()) as unknown,
    setCookie: response.headers.get("set-cookie")
  };
}

function getCookieValue(setCookieHeader: string | null): string | null {
  if (!setCookieHeader) {
    return null;
  }

  const [cookie] = setCookieHeader.split(";");
  return cookie ?? null;
}

async function ensureEditorAdmin(email: string, password: string, permissions: Array<"manage_results" | "manage_blogs">): Promise<void> {
  const passwordHash = await hashPassword(password);
  const existing = await prisma.admin.findUnique({
    where: { email }
  });

  if (existing) {
    await prisma.adminPermissionGrant.deleteMany({
      where: { adminId: existing.id }
    });

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

    if (permissions.length > 0) {
      await prisma.adminPermissionGrant.createMany({
        data: permissions.map((permission) => ({
          adminId: existing.id,
          permission
        }))
      });
    }

    return;
  }

  const admin = await prisma.admin.create({
    data: {
      email,
      name: email,
      passwordHash,
      role: "editor",
      isActive: true,
      passwordUpdatedAt: new Date()
    }
  });

  if (permissions.length > 0) {
    await prisma.adminPermissionGrant.createMany({
      data: permissions.map((permission) => ({
        adminId: admin.id,
        permission
      }))
    });
  }
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

function toDrawDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function addDays(date: string, days: number): string {
  const target = toDrawDate(date);
  target.setUTCDate(target.getUTCDate() + days);

  return [
    target.getUTCFullYear(),
    String(target.getUTCMonth() + 1).padStart(2, "0"),
    String(target.getUTCDate()).padStart(2, "0")
  ].join("-");
}

async function createPublicDraftForToday(): Promise<string> {
  const env = getApiEnv();
  const drawDate = getBangkokTodayForTests();
  const existingDrafts = await prisma.lotteryDraw.findMany({
    where: {
      drawDate: toDrawDate(drawDate),
      status: "draft"
    },
    select: { id: true }
  });
  const existingDraftIds = existingDrafts.map((item) => item.id);

  if (existingDraftIds.length > 0) {
    await prisma.lotteryResultGroupRelease.deleteMany({
      where: { drawId: { in: existingDraftIds } }
    });
    await prisma.lotteryResult.deleteMany({
      where: { drawId: { in: existingDraftIds } }
    });
    await prisma.lotteryDraw.deleteMany({
      where: { id: { in: existingDraftIds } }
    });
  }

  const admin = await prisma.admin.findUniqueOrThrow({
    where: { email: env.ADMIN_BOOTSTRAP_EMAIL.toLowerCase() }
  });

  await prisma.lotteryDraw.create({
    data: {
      drawDate: toDrawDate(drawDate),
      drawCode: `${drawDate}-draft`,
      status: "draft",
      publishedAt: null,
      createdByAdminId: admin.id,
      updatedByAdminId: admin.id,
      results: {
        create: [
          { prizeType: "FIRST_PRIZE", prizeIndex: 0, number: "654321" },
          { prizeType: "LAST_TWO", prizeIndex: 0, number: "21" }
        ]
      },
      groupReleases: {
        create: [
          {
            prizeType: "FIRST_PRIZE",
            isReleased: true,
            releasedAt: new Date(),
            releasedByAdminId: admin.id
          },
          {
            prizeType: "LAST_TWO",
            isReleased: false,
            releasedAt: null,
            releasedByAdminId: null
          }
        ]
      }
    }
  });

  return drawDate;
}

async function createAdminActor(): Promise<AuthenticatedAdmin> {
  const env = getApiEnv();
  const admin = await prisma.admin.findUniqueOrThrow({
    where: {
      email: env.ADMIN_BOOTSTRAP_EMAIL.toLowerCase()
    }
  });

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name ?? "Admin",
    role: admin.role,
    effectivePermissions: ["manage_results", "manage_blogs"]
  };
}

function createRepositoryPost(overrides: Partial<AdminBlogRepositoryPost> = {}): AdminBlogRepositoryPost {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "admin-blog-workflow",
    bannerImageUrl: null,
    status: "draft",
    publishedAt: null,
    createdAt: new Date("2026-04-01T08:00:00.000Z"),
    updatedAt: new Date("2026-04-01T08:00:00.000Z"),
    updatedByAdminId: "admin-1",
    translations: [],
    ...overrides
  };
}

describe("results api", () => {
  const env = getApiEnv();

  before(async () => {
    await seed();
    baseUrl = await startServer();
  });

  after(async () => {
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

  it("keeps the root and health routes working", async () => {
    const root = await getJson("/");
    const health = await getJson("/health");

    assert.equal(root.status, 200);
    assert.deepEqual(root.body, {
      name: "thai-lottery-checker-api",
      status: "up"
    });

    assert.equal(health.status, 200);
    assert.equal((health.body as { status: string }).status === "ok" || (health.body as { status: string }).status === "degraded", true);
  });

  it("logs in the seeded super admin and returns the current session", async () => {
    const login = await postJson("/api/v1/admin/auth/login", {
      email: env.ADMIN_BOOTSTRAP_EMAIL,
      password: env.ADMIN_BOOTSTRAP_PASSWORD
    });

    assert.equal(login.status, 200);
    assert.deepEqual(login.body, {
      admin: {
        id: (login.body as { admin: { id: string } }).admin.id,
        email: env.ADMIN_BOOTSTRAP_EMAIL.toLowerCase(),
        name: env.ADMIN_BOOTSTRAP_NAME,
        role: "super_admin",
        effectivePermissions: ["manage_results", "manage_blogs"]
      }
    });

    const sessionCookie = getCookieValue(login.setCookie);
    assert.ok(sessionCookie);

    const me = await getJsonWithCookie("/api/v1/admin/auth/me", sessionCookie ?? undefined);

    assert.equal(me.status, 200);
    assert.deepEqual(me.body, login.body);
  });

  it("rejects invalid credentials and unauthenticated me requests", async () => {
    const invalidLogin = await postJson("/api/v1/admin/auth/login", {
      email: env.ADMIN_BOOTSTRAP_EMAIL,
      password: "wrong-password"
    });

    assert.equal(invalidLogin.status, 401);
    assert.deepEqual(invalidLogin.body, {
      code: "INVALID_ADMIN_CREDENTIALS",
      message: "Email or password is incorrect"
    });

    const me = await getJsonWithCookie("/api/v1/admin/auth/me");

    assert.equal(me.status, 401);
    assert.deepEqual(me.body, {
      code: "ADMIN_UNAUTHORIZED",
      message: "Admin authentication is required"
    });
  });

  it("blocks deactivated admins from authenticating", async () => {
    const admin = await prisma.admin.findUniqueOrThrow({
      where: { email: env.ADMIN_BOOTSTRAP_EMAIL.toLowerCase() }
    });

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        isActive: false,
        deactivatedAt: new Date()
      }
    });

    const login = await postJson("/api/v1/admin/auth/login", {
      email: env.ADMIN_BOOTSTRAP_EMAIL,
      password: env.ADMIN_BOOTSTRAP_PASSWORD
    });

    assert.equal(login.status, 401);
    assert.deepEqual(login.body, {
      code: "INVALID_ADMIN_CREDENTIALS",
      message: "Email or password is incorrect"
    });

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        isActive: true,
        deactivatedAt: null
      }
    });
  });

  it("clears the session cookie on logout and blocks further me access", async () => {
    const login = await postJson("/api/v1/admin/auth/login", {
      email: env.ADMIN_BOOTSTRAP_EMAIL,
      password: env.ADMIN_BOOTSTRAP_PASSWORD
    });
    const sessionCookie = getCookieValue(login.setCookie);

    assert.ok(sessionCookie);

    const logout = await postJson("/api/v1/admin/auth/logout", {}, sessionCookie ?? undefined);

    assert.equal(logout.status, 200);
    assert.deepEqual(logout.body, { success: true });
    assert.match(logout.setCookie ?? "", /admin_session=/);

    const me = await getJsonWithCookie("/api/v1/admin/auth/me");

    assert.equal(me.status, 401);
    assert.deepEqual(me.body, {
      code: "ADMIN_UNAUTHORIZED",
      message: "Admin authentication is required"
    });
  });

  it("supports invitation creation and acceptance for editors", async () => {
    const login = await postJson("/api/v1/admin/auth/login", {
      email: env.ADMIN_BOOTSTRAP_EMAIL,
      password: env.ADMIN_BOOTSTRAP_PASSWORD
    });
    const sessionCookie = getCookieValue(login.setCookie);

    const invite = await postJson(
      "/api/v1/admin/invitations",
      {
        email: "editor-one@thai-lottery-checker.local",
        role: "editor",
        permissions: ["manage_results"]
      },
      sessionCookie ?? undefined
    );

    assert.equal(invite.status, 201);
    assert.equal((invite.body as { email: string }).email, "editor-one@thai-lottery-checker.local");
    assert.equal((invite.body as { role: string }).role, "editor");
    assert.deepEqual((invite.body as { permissions: string[] }).permissions, ["manage_results"]);
    assert.equal(typeof (invite.body as { inviteUrl?: string }).inviteUrl, "string");

    const invitation = await prisma.adminInvitation.findUniqueOrThrow({
      where: { id: (invite.body as { invitationId: string }).invitationId }
    });

    assert.equal(invitation.tokenHash.includes("editor-one"), false);
    assert.equal(typeof invitation.permissionsJson, "object");

    const inviteUrl = new URL((invite.body as { inviteUrl: string }).inviteUrl);
    const token = inviteUrl.searchParams.get("token");

    assert.ok(token);

    const accept = await postJson("/api/v1/admin/invitations/accept", {
      token,
      name: "Editor One",
      password: "EditorPass123!"
    });

    assert.equal(accept.status, 200);
    assert.deepEqual(accept.body, { success: true });

    const createdAdmin = await prisma.admin.findUniqueOrThrow({
      where: { email: "editor-one@thai-lottery-checker.local" },
      include: { permissions: true }
    });

    assert.equal(createdAdmin.role, "editor");
    assert.equal(createdAdmin.invitedByAdminId !== null, true);
    assert.deepEqual(createdAdmin.permissions.map((permission) => permission.permission), ["manage_results"]);

    const acceptedInvitation = await prisma.adminInvitation.findUniqueOrThrow({
      where: { id: invitation.id }
    });

    assert.equal(acceptedInvitation.acceptedAt !== null, true);

    const reused = await postJson("/api/v1/admin/invitations/accept", {
      token,
      name: "Editor Again",
      password: "EditorPass123!"
    });

    assert.equal(reused.status, 400);
    assert.deepEqual(reused.body, {
      code: "INVALID_ADMIN_INVITATION",
      message: "Invitation token is invalid or can no longer be used"
    });
  });

  it("supports invitation revocation and blocks non-super-admin governance access", async () => {
    const superAdminLogin = await postJson("/api/v1/admin/auth/login", {
      email: env.ADMIN_BOOTSTRAP_EMAIL,
      password: env.ADMIN_BOOTSTRAP_PASSWORD
    });
    const superAdminCookie = getCookieValue(superAdminLogin.setCookie);

    const invite = await postJson(
      "/api/v1/admin/invitations",
      {
        email: "editor-two@thai-lottery-checker.local",
        role: "editor",
        permissions: ["manage_results"]
      },
      superAdminCookie ?? undefined
    );

    const revoke = await postJson(
      "/api/v1/admin/invitations/revoke",
      {
        invitationId: (invite.body as { invitationId: string }).invitationId
      },
      superAdminCookie ?? undefined
    );

    assert.equal(revoke.status, 200);
    assert.deepEqual(revoke.body, { success: true });

    const revokedInvitation = await prisma.adminInvitation.findUniqueOrThrow({
      where: { id: (invite.body as { invitationId: string }).invitationId }
    });

    assert.equal(revokedInvitation.revokedAt !== null, true);

    const acceptRevoked = await postJson("/api/v1/admin/invitations/accept", {
      token: new URL((invite.body as { inviteUrl: string }).inviteUrl).searchParams.get("token"),
      name: "Editor Two",
      password: "EditorPass123!"
    });

    assert.equal(acceptRevoked.status, 400);

    const editorLogin = await postJson("/api/v1/admin/auth/login", {
      email: "editor-one@thai-lottery-checker.local",
      password: "EditorPass123!"
    });
    const editorCookie = getCookieValue(editorLogin.setCookie);

    const nonSuperList = await getJsonWithCookie("/api/v1/admin/admins", editorCookie ?? undefined);

    assert.equal(nonSuperList.status, 403);
    assert.deepEqual(nonSuperList.body, {
      code: "ADMIN_FORBIDDEN",
      message: "Admin does not have permission to perform this action"
    });
  });

  it("supports password reset request and confirmation while invalidating old sessions", async () => {
    const login = await postJson("/api/v1/admin/auth/login", {
      email: "editor-one@thai-lottery-checker.local",
      password: "EditorPass123!"
    });
    const editorCookie = getCookieValue(login.setCookie);

    const existingCountBefore = await prisma.adminPasswordReset.count();

    const requestForExisting = await postJson("/api/v1/admin/password-resets/request", {
      email: "editor-one@thai-lottery-checker.local"
    });

    assert.equal(requestForExisting.status, 200);
    assert.deepEqual(
      Object.keys(requestForExisting.body as Record<string, unknown>).sort(),
      ["resetUrl", "success"]
    );

    const resetCountAfterExisting = await prisma.adminPasswordReset.count();
    assert.equal(resetCountAfterExisting, existingCountBefore + 1);

    const latestReset = await prisma.adminPasswordReset.findFirstOrThrow({
      orderBy: { createdAt: "desc" }
    });

    assert.ok(latestReset.tokenHash);

    const requestForUnknown = await postJson("/api/v1/admin/password-resets/request", {
      email: "missing-admin@thai-lottery-checker.local"
    });

    assert.equal(requestForUnknown.status, 200);
    assert.deepEqual(requestForUnknown.body, { success: true });
    assert.equal(await prisma.adminPasswordReset.count(), resetCountAfterExisting);

    const token = new URL((requestForExisting.body as { resetUrl: string }).resetUrl).searchParams.get("token");
    const confirm = await postJson("/api/v1/admin/password-resets/confirm", {
      token,
      password: "EditorPass456!"
    });

    assert.equal(confirm.status, 200);
    assert.deepEqual(confirm.body, { success: true });

    const meAfterReset = await getJsonWithCookie("/api/v1/admin/auth/me", editorCookie ?? undefined);

    assert.equal(meAfterReset.status, 401);

    const loginWithNewPassword = await postJson("/api/v1/admin/auth/login", {
      email: "editor-one@thai-lottery-checker.local",
      password: "EditorPass456!"
    });

    assert.equal(loginWithNewPassword.status, 200);

    const reusedReset = await postJson("/api/v1/admin/password-resets/confirm", {
      token,
      password: "EditorPass789!"
    });

    assert.equal(reusedReset.status, 400);
    assert.deepEqual(reusedReset.body, {
      code: "INVALID_ADMIN_PASSWORD_RESET",
      message: "Password reset token is invalid or can no longer be used"
    });
  });

  it("lists admins, updates roles and permissions, and protects the last active super admin", async () => {
    const login = await postJson("/api/v1/admin/auth/login", {
      email: env.ADMIN_BOOTSTRAP_EMAIL,
      password: env.ADMIN_BOOTSTRAP_PASSWORD
    });
    const sessionCookie = getCookieValue(login.setCookie);

    const list = await getJsonWithCookie("/api/v1/admin/admins", sessionCookie ?? undefined);

    assert.equal(list.status, 200);
    assert.equal(Array.isArray((list.body as { items: unknown[] }).items), true);

    const editor = await prisma.admin.findUniqueOrThrow({
      where: { email: "editor-one@thai-lottery-checker.local" }
    });

    const promote = await patchJson(
      `/api/v1/admin/admins/${editor.id}`,
      {
        role: "super_admin"
      },
      sessionCookie ?? undefined
    );

    assert.equal(promote.status, 200);
    assert.equal((promote.body as { admin: { role: string } }).admin.role, "super_admin");
    assert.deepEqual((promote.body as { admin: { permissions: string[] } }).admin.permissions, ["manage_results", "manage_blogs"]);

    const promotedEditor = await prisma.admin.findUniqueOrThrow({
      where: { id: editor.id },
      include: { permissions: true }
    });

    assert.equal(promotedEditor.permissions.length, 0);

    const demote = await patchJson(
      `/api/v1/admin/admins/${editor.id}`,
      {
        role: "editor",
        permissions: ["manage_blogs"]
      },
      sessionCookie ?? undefined
    );

    assert.equal(demote.status, 200);
    assert.equal((demote.body as { admin: { role: string } }).admin.role, "editor");
    assert.deepEqual((demote.body as { admin: { permissions: string[] } }).admin.permissions, ["manage_blogs"]);

    const demotedEditor = await prisma.admin.findUniqueOrThrow({
      where: { id: editor.id },
      include: { permissions: true }
    });

    assert.deepEqual(demotedEditor.permissions.map((permission) => permission.permission), ["manage_blogs"]);

    const deactivateLastSuperAdmin = await patchJson(
      `/api/v1/admin/admins/${(login.body as { admin: { id: string } }).admin.id}`,
      {
        isActive: false
      },
      sessionCookie ?? undefined
    );

    assert.equal(deactivateLastSuperAdmin.status, 400);
    assert.deepEqual(deactivateLastSuperAdmin.body, {
      code: "LAST_SUPER_ADMIN_PROTECTED",
      message: "The last active super admin cannot be deactivated or demoted"
    });
  });

  it("supports admin result draft, publish, and correction workflows", async () => {
    const draftDrawDate = addDays(getBangkokTodayForTests(), 1);
    const login = await postJson("/api/v1/admin/auth/login", {
      email: env.ADMIN_BOOTSTRAP_EMAIL,
      password: env.ADMIN_BOOTSTRAP_PASSWORD
    });
    const sessionCookie = getCookieValue(login.setCookie);

    const draftCreate = await postJson(
      "/api/v1/admin/results",
      {
        drawDate: draftDrawDate,
        drawCode: "special-april-draft",
        prizeGroups: [
          { type: "FIRST_PRIZE", numbers: ["123456"] },
          { type: "LAST_TWO", numbers: ["45"] }
        ]
      },
      sessionCookie ?? undefined
    );

    assert.equal(draftCreate.status, 201);
    assert.equal((draftCreate.body as { result: { status: string } }).result.status, "draft");
    assert.equal((draftCreate.body as { result: { publishedAt: string | null } }).result.publishedAt, null);

    const createdDrawId = (draftCreate.body as { result: { id: string } }).result.id;

    const publicDraft = await getJson(`/api/v1/results/${draftDrawDate}`);
    assert.equal(publicDraft.status, 404);

    const duplicateDraw = await postJson(
      "/api/v1/admin/results",
      {
        drawDate: draftDrawDate,
        drawCode: "duplicate",
        prizeGroups: []
      },
      sessionCookie ?? undefined
    );

    assert.equal(duplicateDraw.status, 409);
    assert.deepEqual(duplicateDraw.body, {
      code: "ADMIN_RESULT_DUPLICATE_DRAW_DATE",
      message: "A result draw already exists for this draw date"
    });

    const invalidDraftUpdate = await patchJson(
      `/api/v1/admin/results/${createdDrawId}`,
      {
        drawDate: draftDrawDate,
        drawCode: "invalid-draft",
        prizeGroups: [{ type: "LAST_TWO", numbers: ["4A"] }]
      },
      sessionCookie ?? undefined
    );

    assert.equal(invalidDraftUpdate.status, 400);
    assert.deepEqual(invalidDraftUpdate.body, {
      code: "ADMIN_RESULT_DATA_INVALID",
      message: "Invalid prize number for LAST_TWO: 4A"
    });

    const incompleteDraftUpdate = await patchJson(
      `/api/v1/admin/results/${createdDrawId}`,
      {
        drawDate: draftDrawDate,
        drawCode: "updated-incomplete-draft",
        prizeGroups: [
          { type: "FIRST_PRIZE", numbers: ["654321"] },
          { type: "FRONT_THREE", numbers: ["111", "222"] }
        ]
      },
      sessionCookie ?? undefined
    );

    assert.equal(incompleteDraftUpdate.status, 200);
    assert.equal((incompleteDraftUpdate.body as { result: { status: string } }).result.status, "draft");

    const publishIncomplete = await postJson(
      `/api/v1/admin/results/${createdDrawId}/publish`,
      {},
      sessionCookie ?? undefined
    );

    assert.equal(publishIncomplete.status, 400);
    assert.deepEqual(publishIncomplete.body, {
      code: "ADMIN_RESULT_DATA_INVALID",
      message: "Result prize groups are incomplete or invalid for publish/correction"
    });

    const completeDraftUpdate = await patchJson(
      `/api/v1/admin/results/${createdDrawId}`,
      {
        drawDate: draftDrawDate,
        drawCode: "published-april-draw",
        prizeGroups: [
          { type: "FIRST_PRIZE", numbers: ["820866"] },
          { type: "NEAR_FIRST_PRIZE", numbers: ["820865", "820867"] },
          { type: "SECOND_PRIZE", numbers: ["328032", "716735", "320227", "000001", "999999"] },
          { type: "THIRD_PRIZE", numbers: ["123456", "234567", "345678", "456789", "567890", "678901", "789012", "890123", "901234", "012345"] },
          { type: "FOURTH_PRIZE", numbers: Array.from({ length: 50 }, (_, index) => String(400001 + index).padStart(6, "0")) },
          { type: "FIFTH_PRIZE", numbers: Array.from({ length: 100 }, (_, index) => String(500001 + index).padStart(6, "0")) },
          { type: "FRONT_THREE", numbers: ["068", "837"] },
          { type: "LAST_THREE", numbers: ["054", "479"] },
          { type: "LAST_TWO", numbers: ["06"] }
        ]
      },
      sessionCookie ?? undefined
    );

    assert.equal(completeDraftUpdate.status, 200);

    const publish = await postJson(
      `/api/v1/admin/results/${createdDrawId}/publish`,
      {},
      sessionCookie ?? undefined
    );

    assert.equal(publish.status, 200);
    assert.equal((publish.body as { result: { status: string } }).result.status, "published");
    const originalPublishedAt = (publish.body as { result: { publishedAt: string } }).result.publishedAt;
    assert.ok(originalPublishedAt);

    const republish = await postJson(
      `/api/v1/admin/results/${createdDrawId}/publish`,
      {},
      sessionCookie ?? undefined
    );

    assert.equal(republish.status, 400);
    assert.deepEqual(republish.body, {
      code: "ADMIN_RESULT_INVALID_STATE",
      message: "Only draft results can be published"
    });

    const publicPublished = await getJson(`/api/v1/results/${draftDrawDate}`);
    assert.equal(publicPublished.status, 200);

    const invalidCorrection = await patchJson(
      `/api/v1/admin/results/${createdDrawId}/correct`,
      {
        drawDate: draftDrawDate,
        drawCode: "published-april-draw",
        prizeGroups: [{ type: "FIRST_PRIZE", numbers: ["999999"] }]
      },
      sessionCookie ?? undefined
    );

    assert.equal(invalidCorrection.status, 400);
    assert.deepEqual(invalidCorrection.body, {
      code: "ADMIN_RESULT_DATA_INVALID",
      message: "Result prize groups are incomplete or invalid for publish/correction"
    });

    const correction = await patchJson(
      `/api/v1/admin/results/${createdDrawId}/correct`,
      {
        drawDate: draftDrawDate,
        drawCode: "published-april-draw-corrected",
        prizeGroups: [
          { type: "FIRST_PRIZE", numbers: ["999999"] },
          { type: "NEAR_FIRST_PRIZE", numbers: ["820865", "820867"] },
          { type: "SECOND_PRIZE", numbers: ["328032", "716735", "320227", "000001", "999999"] },
          { type: "THIRD_PRIZE", numbers: ["123456", "234567", "345678", "456789", "567890", "678901", "789012", "890123", "901234", "012345"] },
          { type: "FOURTH_PRIZE", numbers: Array.from({ length: 50 }, (_, index) => String(400001 + index).padStart(6, "0")) },
          { type: "FIFTH_PRIZE", numbers: Array.from({ length: 100 }, (_, index) => String(500001 + index).padStart(6, "0")) },
          { type: "FRONT_THREE", numbers: ["068", "837"] },
          { type: "LAST_THREE", numbers: ["054", "479"] },
          { type: "LAST_TWO", numbers: ["06"] }
        ]
      },
      sessionCookie ?? undefined
    );

    assert.equal(correction.status, 200);
    assert.equal((correction.body as { result: { publishedAt: string } }).result.publishedAt, originalPublishedAt);
    assert.equal((correction.body as { result: { drawCode: string } }).result.drawCode, "published-april-draw-corrected");

    const adminResults = await getJsonWithCookie("/api/v1/admin/results", sessionCookie ?? undefined);
    assert.equal(adminResults.status, 200);
    assert.equal(
      (adminResults.body as { items: Array<{ id: string }> }).items.some((item) => item.id === createdDrawId),
      true
    );

    const correctionAuditLog = await prisma.adminAuditLog.findFirst({
      where: {
        entityId: createdDrawId,
        action: "correct_result"
      },
      orderBy: { createdAt: "desc" }
    });

    assert.ok(correctionAuditLog);
    assert.equal(correctionAuditLog?.beforeData !== null, true);
    assert.equal(correctionAuditLog?.afterData !== null, true);

    await prisma.lotteryDraw.delete({
      where: { id: createdDrawId }
    });
  });

  it("enforces admin result permissions for editors", async () => {
    await ensureEditorAdmin("editor-results@thai-lottery-checker.local", "EditorResults123!", ["manage_results"]);
    await ensureEditorAdmin("editor-no-results@thai-lottery-checker.local", "EditorNoResults123!", ["manage_blogs"]);

    const allowedLogin = await postJson("/api/v1/admin/auth/login", {
      email: "editor-results@thai-lottery-checker.local",
      password: "EditorResults123!"
    });
    const allowedCookie = getCookieValue(allowedLogin.setCookie);

    const blockedLogin = await postJson("/api/v1/admin/auth/login", {
      email: "editor-no-results@thai-lottery-checker.local",
      password: "EditorNoResults123!"
    });
    const blockedCookie = getCookieValue(blockedLogin.setCookie);

    const allowedList = await getJsonWithCookie("/api/v1/admin/results", allowedCookie ?? undefined);
    assert.equal(allowedList.status, 200);

    const blockedList = await getJsonWithCookie("/api/v1/admin/results", blockedCookie ?? undefined);
    assert.equal(blockedList.status, 403);
    assert.deepEqual(blockedList.body, {
      code: "ADMIN_FORBIDDEN",
      message: "Admin does not have permission to perform this action"
    });
  });

  it("returns the latest published draw with grouped prize data in canonical order", async () => {
    const todayDraft = await createPublicDraftForToday();
    const { status, body } = await getJson("/api/v1/results/latest");
    const payload = body as {
      drawDate: string;
      drawCode: string | null;
      publishedAt: string | null;
      prizeGroups: Array<{ type: string; numbers: string[]; isReleased: boolean }>;
    };

    assert.equal(status, 200);
    assert.equal(payload.drawDate, todayDraft);
    assert.equal(payload.drawCode, `${todayDraft}-draft`);
    assert.equal(payload.publishedAt, null);
    assert.equal(payload.prizeGroups.length, 9);
    assert.equal(payload.prizeGroups[0]?.type, "FIRST_PRIZE");
    assert.deepEqual(payload.prizeGroups[0]?.numbers, ["654321"]);
    assert.equal(payload.prizeGroups[0]?.isReleased, true);
    assert.equal(payload.prizeGroups[8]?.type, "LAST_TWO");
    assert.deepEqual(payload.prizeGroups[8]?.numbers, ["21"]);
    assert.equal(payload.prizeGroups[8]?.isReleased, false);
  });

  it("returns paginated published history in reverse chronological order", async () => {
    const { status, body } = await getJson("/api/v1/results?page=1&limit=1");
    const payload = body as {
      items: Array<{
        drawDate: string;
        drawCode: string | null;
        firstPrize: string;
        frontThree: string[];
        lastThree: string[];
        lastTwo: string;
      }>;
      page: number;
      limit: number;
      total: number;
    };

    assert.equal(status, 200);
    assert.equal(payload.page, 1);
    assert.equal(payload.limit, 1);
    assert.equal(payload.total, 2);
    assert.equal(payload.items.length, 1);
    assert.deepEqual(payload.items[0], {
      drawDate: "2026-03-01",
      drawCode: "2026-03-01",
      firstPrize: "820866",
      frontThree: ["068", "837"],
      lastThree: ["054", "479"],
      lastTwo: "06"
    });
  });

  it("returns localized published blog list items in reverse published order", async () => {
    const { status, body } = await getJson("/api/v1/blogs?locale=en&page=1&limit=10");
    const payload = body as {
      items: Array<{
        slug: string;
        title: string;
        excerpt: string | null;
        bannerImageUrl: string | null;
        publishedAt: string;
      }>;
      page: number;
      limit: number;
      total: number;
    };

    assert.equal(status, 200);
    assert.equal(payload.page, 1);
    assert.equal(payload.limit, 10);
    assert.equal(payload.total, 2);
    assert.deepEqual(payload.items.map((item) => item.slug), [
      "how-to-check-thai-lottery",
      "thai-lottery-draw-day-tips"
    ]);
    assert.deepEqual(payload.items[0], {
      slug: "how-to-check-thai-lottery",
      title: "How to Check Thai Lottery Results",
      excerpt: "A simple guide to reading Thai lottery results.",
      bannerImageUrl: "https://example.com/blog/how-to-check-thai-lottery.jpg",
      publishedAt: "2026-03-31T08:00:00.000Z"
    });

    const thaiList = await getJson("/api/v1/blogs?locale=th");
    const thaiPayload = thaiList.body as { items: Array<{ slug: string }>; total: number; limit: number };

    assert.equal(thaiList.status, 200);
    assert.equal(thaiPayload.total, 1);
    assert.equal(thaiPayload.limit, 12);
    assert.deepEqual(thaiPayload.items.map((item) => item.slug), ["how-to-check-thai-lottery"]);
  });

  it("returns localized blog detail and hides draft or untranslated posts", async () => {
    const published = await getJson("/api/v1/blogs/how-to-check-thai-lottery?locale=my");
    const payload = published.body as {
      slug: string;
      bannerImageUrl: string | null;
      publishedAt: string;
      translation: {
        locale: string;
        title: string;
        body: Array<{ type: string; text: string }>;
        excerpt: string | null;
        seoTitle: string | null;
        seoDescription: string | null;
      };
    };

    assert.equal(published.status, 200);
    assert.equal(payload.slug, "how-to-check-thai-lottery");
    assert.equal(payload.translation.locale, "my");
    assert.equal(payload.translation.title, "ထိုင်းထီရလဒ် စစ်နည်း");
    assert.deepEqual(payload.translation.body, [
      {
        type: "paragraph",
        text: "တရားဝင် ထိုင်းထီရလဒ်ကို အဆင့်လိုက် ဖတ်ရှုစစ်ဆေးနည်းကို လေ့လာပါ။"
      }
    ]);

    const missingTranslation = await getJson("/api/v1/blogs/thai-lottery-draw-day-tips?locale=th");
    assert.equal(missingTranslation.status, 404);
    assert.deepEqual(missingTranslation.body, {
      code: "BLOG_NOT_FOUND",
      message: "Blog post was not found"
    });

    const draft = await getJson("/api/v1/blogs/thai-lottery-common-mistakes?locale=th");
    assert.equal(draft.status, 404);
    assert.deepEqual(draft.body, {
      code: "BLOG_NOT_FOUND",
      message: "Blog post was not found"
    });
  });

  it("returns structured blog validation errors", async () => {
    const invalidLocale = await getJson("/api/v1/blogs?locale=jp");
    const invalidLimit = await getJson("/api/v1/blogs?locale=en&limit=51");
    const invalidDetailLocale = await getJson("/api/v1/blogs/how-to-check-thai-lottery?locale=jp");
    const missingSlug = await getJson("/api/v1/blogs/missing-post?locale=en");

    assert.equal(invalidLocale.status, 400);
    assert.deepEqual(invalidLocale.body, {
      code: "INVALID_BLOG_LOCALE",
      message: "locale must be one of: en, th, my"
    });

    assert.equal(invalidLimit.status, 400);
    assert.deepEqual(invalidLimit.body, {
      code: "INVALID_BLOG_QUERY",
      message: "Query parameters are invalid"
    });

    assert.equal(invalidDetailLocale.status, 400);
    assert.deepEqual(invalidDetailLocale.body, {
      code: "INVALID_BLOG_LOCALE",
      message: "locale must be one of: en, th, my"
    });

    assert.equal(missingSlug.status, 404);
    assert.deepEqual(missingSlug.body, {
      code: "BLOG_NOT_FOUND",
      message: "Blog post was not found"
    });
  });

  it("supports admin blog draft, translation, publish, and unpublish workflows", async () => {
    const login = await postJson("/api/v1/admin/auth/login", {
      email: env.ADMIN_BOOTSTRAP_EMAIL,
      password: env.ADMIN_BOOTSTRAP_PASSWORD
    });
    const sessionCookie = getCookieValue(login.setCookie);

    const initialList = await getJsonWithCookie("/api/v1/admin/blogs?status=all", sessionCookie ?? undefined);
    assert.equal(initialList.status, 200);
    assert.equal(
      (initialList.body as { items: Array<{ slug: string; displayTitle: string }> }).items.some(
        (item) => item.slug === "thai-lottery-common-mistakes" && item.displayTitle === "ข้อผิดพลาดที่พบบ่อยในการตรวจหวย"
      ),
      true
    );

    const createDraft = await postJson(
      "/api/v1/admin/blogs",
      {
        slug: "admin-blog-workflow"
      },
      sessionCookie ?? undefined
    );

    assert.equal(createDraft.status, 201);
    assert.equal((createDraft.body as { post: { status: string } }).post.status, "draft");
    assert.equal((createDraft.body as { post: { publishedAt: string | null } }).post.publishedAt, null);
    assert.deepEqual((createDraft.body as { post: { publishReadiness: { issues: string[] } } }).post.publishReadiness.issues, [
      "At least one valid translation is required",
      "A valid translation must include a title and at least one paragraph"
    ]);

    const createdBlogId = (createDraft.body as { post: { id: string } }).post.id;

    const duplicateCreate = await postJson(
      "/api/v1/admin/blogs",
      {
        slug: "admin-blog-workflow"
      },
      sessionCookie ?? undefined
    );

    assert.equal(duplicateCreate.status, 409);
    assert.deepEqual(duplicateCreate.body, {
      code: "ADMIN_BLOG_DUPLICATE_SLUG",
      message: "A blog post already exists for this slug"
    });

    const duplicateSlugUpdate = await patchJson(
      `/api/v1/admin/blogs/${createdBlogId}`,
      {
        slug: "how-to-check-thai-lottery"
      },
      sessionCookie ?? undefined
    );

    assert.equal(duplicateSlugUpdate.status, 409);

    const metadataUpdate = await patchJson(
      `/api/v1/admin/blogs/${createdBlogId}`,
      {
        slug: "admin-blog-workflow-updated"
      },
      sessionCookie ?? undefined
    );

    assert.equal(metadataUpdate.status, 200);
    assert.equal((metadataUpdate.body as { post: { slug: string } }).post.slug, "admin-blog-workflow-updated");

    const publishBeforeTranslation = await postJson(
      `/api/v1/admin/blogs/${createdBlogId}/publish`,
      {},
      sessionCookie ?? undefined
    );

    assert.equal(publishBeforeTranslation.status, 400);
    assert.deepEqual(publishBeforeTranslation.body, {
      code: "ADMIN_BLOG_DATA_INVALID",
      message: "At least one valid translation is required. A valid translation must include a title and at least one paragraph"
    });

    const translationUpsert = await putJson(
      `/api/v1/admin/blogs/${createdBlogId}/translations/en`,
      {
        title: "Admin blog workflow",
        body: [
          {
            type: "paragraph",
            text: "This post walks through the admin blog workflow."
          }
        ],
        excerpt: "How admin blog management works.",
        seoTitle: "Admin blog workflow",
        seoDescription: "A walkthrough of the admin blog workflow."
      },
      sessionCookie ?? undefined
    );

    assert.equal(translationUpsert.status, 200);
    assert.equal((translationUpsert.body as { post: { availableLocales: string[] } }).post.availableLocales.includes("en"), true);
    assert.deepEqual((translationUpsert.body as { post: { publishReadiness: { issues: string[] } } }).post.publishReadiness.issues, []);

    const detail = await getJsonWithCookie(`/api/v1/admin/blogs/${createdBlogId}`, sessionCookie ?? undefined);
    assert.equal(detail.status, 200);
    assert.deepEqual((detail.body as { post: { translations: Array<{ locale: string }> } }).post.translations.map((item) => item.locale), [
      "en",
      "th",
      "my"
    ]);

    const publish = await postJson(`/api/v1/admin/blogs/${createdBlogId}/publish`, {}, sessionCookie ?? undefined);
    assert.equal(publish.status, 200);
    assert.equal((publish.body as { post: { status: string } }).post.status, "published");

    const publicPublished = await getJson("/api/v1/blogs/admin-blog-workflow-updated?locale=en");
    assert.equal(publicPublished.status, 200);
    assert.equal((publicPublished.body as { slug: string }).slug, "admin-blog-workflow-updated");

    const publishedFilter = await getJsonWithCookie("/api/v1/admin/blogs?status=published", sessionCookie ?? undefined);
    assert.equal(publishedFilter.status, 200);
    assert.equal(
      (publishedFilter.body as { items: Array<{ id: string }> }).items.some((item) => item.id === createdBlogId),
      true
    );

    const unpublish = await postJson(`/api/v1/admin/blogs/${createdBlogId}/unpublish`, {}, sessionCookie ?? undefined);
    assert.equal(unpublish.status, 200);
    assert.equal((unpublish.body as { post: { status: string; publishedAt: string | null } }).post.status, "draft");
    assert.equal((unpublish.body as { post: { status: string; publishedAt: string | null } }).post.publishedAt, null);

    const publicDraft = await getJson("/api/v1/blogs/admin-blog-workflow-updated?locale=en");
    assert.equal(publicDraft.status, 404);

    const auditLogs = await prisma.adminAuditLog.findMany({
      where: {
        entityId: createdBlogId,
        entityType: "blog_post",
        action: {
          in: ["create_blog", "update_blog", "publish_blog", "unpublish_blog"]
        }
      }
    });

    assert.equal(auditLogs.length >= 4, true);
    assert.equal(auditLogs.every((log) => log.afterData !== null), true);
  });

  it("returns banner upload unavailability when object storage is not configured", async () => {
    const actor = await createAdminActor();
    const post = createRepositoryPost();
    const repository: AdminBlogsRepository = {
      async listAdminBlogs() {
        return [];
      },
      async findBlogById(blogId) {
        return blogId === post.id ? post : null;
      },
      async findBlogBySlug() {
        return null;
      },
      async createDraftBlog() {
        throw new Error("not used");
      },
      async updateBlogMetadata() {
        throw new Error("not used");
      },
      async updateBlogBannerImage() {
        throw new Error("not used");
      },
      async upsertBlogTranslation() {
        throw new Error("not used");
      },
      async publishBlog() {
        throw new Error("not used");
      },
      async unpublishBlog() {
        throw new Error("not used");
      }
    };
    const storage: BlogBannerStorage = {
      isConfigured() {
        return false;
      },
      async createUpload() {
        throw new Error("not used");
      },
      async objectExists() {
        return false;
      },
      async deleteObject() {
        throw new Error("not used");
      },
      getPublicUrl(objectKey) {
        return objectKey;
      },
      getManagedObjectKeyFromUrl() {
        return null;
      },
      isBlogObjectKey() {
        return false;
      }
    };
    const service = createAdminBlogsService(repository, storage);

    await assert.rejects(
      () =>
        service.initBannerUpload(actor, post.id, {
          fileName: "banner.webp",
          contentType: "image/webp",
          fileSize: 1024
        }),
      (error: unknown) =>
        error instanceof Error &&
        "code" in error &&
        (error as { code?: unknown }).code === "ADMIN_BLOG_BANNER_UNAVAILABLE" &&
        error.message === "Blog banner uploads are not configured"
    );
  });

  it("enforces admin blog permissions for editors", async () => {
    await ensureEditorAdmin("editor-blogs@thai-lottery-checker.local", "EditorBlogs123!", ["manage_blogs"]);
    await ensureEditorAdmin("editor-no-blogs@thai-lottery-checker.local", "EditorNoBlogs123!", ["manage_results"]);

    const allowedLogin = await postJson("/api/v1/admin/auth/login", {
      email: "editor-blogs@thai-lottery-checker.local",
      password: "EditorBlogs123!"
    });
    const allowedCookie = getCookieValue(allowedLogin.setCookie);

    const blockedLogin = await postJson("/api/v1/admin/auth/login", {
      email: "editor-no-blogs@thai-lottery-checker.local",
      password: "EditorNoBlogs123!"
    });
    const blockedCookie = getCookieValue(blockedLogin.setCookie);

    const allowedList = await getJsonWithCookie("/api/v1/admin/blogs", allowedCookie ?? undefined);
    assert.equal(allowedList.status, 200);

    const blockedList = await getJsonWithCookie("/api/v1/admin/blogs", blockedCookie ?? undefined);
    assert.equal(blockedList.status, 403);
    assert.deepEqual(blockedList.body, {
      code: "ADMIN_FORBIDDEN",
      message: "Admin does not have permission to perform this action"
    });

    const blockedCreate = await postJson(
      "/api/v1/admin/blogs",
      {
        slug: "blocked-blog-post"
      },
      blockedCookie ?? undefined
    );

    assert.equal(blockedCreate.status, 403);

    const blog = await prisma.blogPost.findFirstOrThrow({
      select: {
        id: true
      }
    });

    const blockedUploadInit = await postJson(
      `/api/v1/admin/blogs/${blog.id}/banner/upload-init`,
      {
        fileName: "banner.webp",
        contentType: "image/webp",
        fileSize: 1024
      },
      blockedCookie ?? undefined
    );

    assert.equal(blockedUploadInit.status, 403);

    const blockedDelete = await deleteJson(`/api/v1/admin/blogs/${blog.id}/banner`, blockedCookie ?? undefined);
    assert.equal(blockedDelete.status, 403);
  });

  it("completes banner uploads and deletes the previous managed object", async () => {
    const actor = await createAdminActor();
    let currentPost = createRepositoryPost({
      bannerImageUrl: "https://cdn.example.com/blog-banners/11111111-1111-4111-8111-111111111111/old-banner.webp"
    });
    const deletedKeys: string[] = [];
    const repository: AdminBlogsRepository = {
      async listAdminBlogs() {
        return [];
      },
      async findBlogById(blogId) {
        return blogId === currentPost.id ? currentPost : null;
      },
      async findBlogBySlug() {
        return null;
      },
      async createDraftBlog() {
        throw new Error("not used");
      },
      async updateBlogMetadata() {
        throw new Error("not used");
      },
      async updateBlogBannerImage(input) {
        currentPost = {
          ...currentPost,
          bannerImageUrl: input.bannerImageUrl,
          updatedAt: new Date("2026-04-02T08:00:00.000Z"),
          updatedByAdminId: input.adminId
        };
        return currentPost;
      },
      async upsertBlogTranslation() {
        throw new Error("not used");
      },
      async publishBlog() {
        throw new Error("not used");
      },
      async unpublishBlog() {
        throw new Error("not used");
      }
    };
    const storage: BlogBannerStorage = {
      isConfigured() {
        return true;
      },
      async createUpload() {
        throw new Error("not used");
      },
      async objectExists() {
        return true;
      },
      async deleteObject(objectKey) {
        deletedKeys.push(objectKey);
      },
      getPublicUrl(objectKey) {
        return `https://cdn.example.com/${objectKey}`;
      },
      getManagedObjectKeyFromUrl(value) {
        if (!value || !value.startsWith("https://cdn.example.com/")) {
          return null;
        }

        return value.slice("https://cdn.example.com/".length);
      },
      isBlogObjectKey(blogId, objectKey) {
        return objectKey.startsWith(`blog-banners/${blogId}/`);
      }
    };
    const service = createAdminBlogsService(repository, storage);

    const response = await service.completeBannerUpload(actor, currentPost.id, {
      objectKey: "blog-banners/11111111-1111-4111-8111-111111111111/new-banner.webp"
    });

    assert.equal(response.post.bannerImageUrl, "https://cdn.example.com/blog-banners/11111111-1111-4111-8111-111111111111/new-banner.webp");
    assert.deepEqual(deletedKeys, ["blog-banners/11111111-1111-4111-8111-111111111111/old-banner.webp"]);
  });

  it("rejects invalid or missing uploaded banner objects", async () => {
    const actor = await createAdminActor();
    const post = createRepositoryPost();
    const repository: AdminBlogsRepository = {
      async listAdminBlogs() {
        return [];
      },
      async findBlogById(blogId) {
        return blogId === post.id ? post : null;
      },
      async findBlogBySlug() {
        return null;
      },
      async createDraftBlog() {
        throw new Error("not used");
      },
      async updateBlogMetadata() {
        throw new Error("not used");
      },
      async updateBlogBannerImage() {
        throw new Error("not used");
      },
      async upsertBlogTranslation() {
        throw new Error("not used");
      },
      async publishBlog() {
        throw new Error("not used");
      },
      async unpublishBlog() {
        throw new Error("not used");
      }
    };
    const storage: BlogBannerStorage = {
      isConfigured() {
        return true;
      },
      async createUpload() {
        throw new Error("not used");
      },
      async objectExists() {
        return false;
      },
      async deleteObject() {
        throw new Error("not used");
      },
      getPublicUrl(objectKey) {
        return `https://cdn.example.com/${objectKey}`;
      },
      getManagedObjectKeyFromUrl() {
        return null;
      },
      isBlogObjectKey(blogId, objectKey) {
        return objectKey.startsWith(`blog-banners/${blogId}/`);
      }
    };
    const service = createAdminBlogsService(repository, storage);

    await assert.rejects(
      () =>
        service.completeBannerUpload(actor, post.id, {
          objectKey: "blog-banners/22222222-2222-4222-8222-222222222222/banner.webp"
        }),
      (error: unknown) =>
        error instanceof Error &&
        "code" in error &&
        (error as { code?: unknown }).code === "ADMIN_BLOG_DATA_INVALID" &&
        error.message === "Uploaded banner object key is invalid"
    );

    await assert.rejects(
      () =>
        service.completeBannerUpload(actor, post.id, {
          objectKey: "blog-banners/11111111-1111-4111-8111-111111111111/missing-banner.webp"
        }),
      (error: unknown) =>
        error instanceof Error &&
        "code" in error &&
        (error as { code?: unknown }).code === "ADMIN_BLOG_DATA_INVALID" &&
        error.message === "Uploaded banner object was not found"
    );
  });

  it("removes banners and skips deletion for legacy external URLs", async () => {
    const actor = await createAdminActor();
    let currentPost = createRepositoryPost({
      bannerImageUrl: "https://images.example.com/legacy-banner.jpg"
    });
    const deletedKeys: string[] = [];
    const repository: AdminBlogsRepository = {
      async listAdminBlogs() {
        return [];
      },
      async findBlogById(blogId) {
        return blogId === currentPost.id ? currentPost : null;
      },
      async findBlogBySlug() {
        return null;
      },
      async createDraftBlog() {
        throw new Error("not used");
      },
      async updateBlogMetadata() {
        throw new Error("not used");
      },
      async updateBlogBannerImage(input) {
        currentPost = {
          ...currentPost,
          bannerImageUrl: input.bannerImageUrl,
          updatedAt: new Date("2026-04-02T09:00:00.000Z"),
          updatedByAdminId: input.adminId
        };
        return currentPost;
      },
      async upsertBlogTranslation() {
        throw new Error("not used");
      },
      async publishBlog() {
        throw new Error("not used");
      },
      async unpublishBlog() {
        throw new Error("not used");
      }
    };
    const storage: BlogBannerStorage = {
      isConfigured() {
        return true;
      },
      async createUpload() {
        throw new Error("not used");
      },
      async objectExists() {
        return true;
      },
      async deleteObject(objectKey) {
        deletedKeys.push(objectKey);
      },
      getPublicUrl(objectKey) {
        return `https://cdn.example.com/${objectKey}`;
      },
      getManagedObjectKeyFromUrl(value) {
        if (!value || !value.startsWith("https://cdn.example.com/")) {
          return null;
        }

        return value.slice("https://cdn.example.com/".length);
      },
      isBlogObjectKey(blogId, objectKey) {
        return objectKey.startsWith(`blog-banners/${blogId}/`);
      }
    };
    const service = createAdminBlogsService(repository, storage);

    const response = await service.removeBanner(actor, currentPost.id);

    assert.equal(response.post.bannerImageUrl, null);
    assert.deepEqual(deletedKeys, []);
  });

  it("returns checker draw options and uses the latest public draft when no draw date is supplied", async () => {
    const todayDraft = await createPublicDraftForToday();

    const draws = await getJson("/api/v1/checker/draws");
    const options = draws.body as {
      items: Array<{ drawDate: string; drawCode: string | null; drawStatus: string }>;
    };

    assert.equal(draws.status, 200);
    assert.equal(options.items[0]?.drawDate, todayDraft);
    assert.equal(options.items[0]?.drawStatus, "draft");

    const winner = await postJson("/api/v1/checker/check", {
      ticketNumber: "654321"
    });
    const winnerPayload = winner.body as {
      drawDate: string;
      drawStatus: string;
      checkStatus: string;
      isWinner: boolean;
      totalWinningAmount: number;
      matches: Array<{ prizeType: string; prizeAmount: number; matchedNumber: string; matchKind: string }>;
      checkedPrizeTypes: string[];
      uncheckedPrizeTypes: string[];
    };

    assert.equal(winner.status, 200);
    assert.equal(winnerPayload.drawDate, todayDraft);
    assert.equal(winnerPayload.drawStatus, "draft");
    assert.equal(winnerPayload.checkStatus, "partial");
    assert.equal(winnerPayload.isWinner, true);
    assert.equal(winnerPayload.totalWinningAmount, 6000000);
    assert.deepEqual(winnerPayload.matches, [
      {
        prizeType: "FIRST_PRIZE",
        prizeAmount: 6000000,
        matchedNumber: "654321",
        matchKind: "exact"
      }
    ]);
    assert.deepEqual(winnerPayload.checkedPrizeTypes, ["FIRST_PRIZE"]);
    assert.equal(winnerPayload.uncheckedPrizeTypes.includes("LAST_TWO"), true);

    const nonWinner = await postJson("/api/v1/checker/check", {
      ticketNumber: "123456"
    });
    const nonWinnerPayload = nonWinner.body as {
      checkStatus: string;
      isWinner: boolean;
      totalWinningAmount: number;
      uncheckedPrizeTypes: string[];
    };

    assert.equal(nonWinner.status, 200);
    assert.equal(nonWinnerPayload.checkStatus, "partial");
    assert.equal(nonWinnerPayload.isWinner, false);
    assert.equal(nonWinnerPayload.totalWinningAmount, 0);
    assert.equal(nonWinnerPayload.uncheckedPrizeTypes.includes("LAST_TWO"), true);
  });

  it("checks an explicit published draw and returns structured checker validation errors", async () => {
    const check = await postJson("/api/v1/checker/check", {
      ticketNumber: "820866",
      drawDate: "2026-03-01"
    });
    const payload = check.body as {
      drawDate: string;
      drawStatus: string;
      checkStatus: string;
      isWinner: boolean;
      totalWinningAmount: number;
      matches: Array<{ prizeType: string; prizeAmount: number; matchedNumber: string; matchKind: string }>;
    };

    assert.equal(check.status, 200);
    assert.equal(payload.drawDate, "2026-03-01");
    assert.equal(payload.drawStatus, "published");
    assert.equal(payload.checkStatus, "complete");
    assert.equal(payload.isWinner, true);
    assert.equal(payload.totalWinningAmount, 6000000);
    assert.deepEqual(payload.matches, [
      {
        prizeType: "FIRST_PRIZE",
        prizeAmount: 6000000,
        matchedNumber: "820866",
        matchKind: "exact"
      }
    ]);

    const invalidTicket = await postJson("/api/v1/checker/check", {
      ticketNumber: "12345A"
    });
    const invalidDate = await postJson("/api/v1/checker/check", {
      ticketNumber: "123456",
      drawDate: "01-03-2026"
    });
    const missingDraw = await postJson("/api/v1/checker/check", {
      ticketNumber: "123456",
      drawDate: "2026-01-01"
    });

    assert.equal(invalidTicket.status, 400);
    assert.deepEqual(invalidTicket.body, {
      code: "INVALID_TICKET_NUMBER",
      message: "ticketNumber must use exactly 6 digits"
    });

    assert.equal(invalidDate.status, 400);
    assert.deepEqual(invalidDate.body, {
      code: "INVALID_DRAW_DATE",
      message: "drawDate must use YYYY-MM-DD format"
    });

    assert.equal(missingDraw.status, 404);
    assert.deepEqual(missingDraw.body, {
      code: "CHECKER_DRAW_NOT_FOUND",
      message: "Checker draw was not found"
    });
  });

  it("returns detail for a published draw and exposes the Bangkok-today draft immediately", async () => {
    const todayDraft = await createPublicDraftForToday();
    const published = await getJson("/api/v1/results/2026-02-16");
    const draft = await getJson(`/api/v1/results/${todayDraft}`);

    assert.equal(published.status, 200);
    assert.equal((published.body as { drawDate: string }).drawDate, "2026-02-16");

    assert.equal(draft.status, 200);
    assert.equal((draft.body as { drawDate: string }).drawDate, todayDraft);
    assert.equal((draft.body as { publishedAt: string | null }).publishedAt, null);
    assert.equal((draft.body as { prizeGroups: Array<{ type: string; isReleased: boolean }> }).prizeGroups[0]?.isReleased, true);
    assert.equal((draft.body as { prizeGroups: Array<{ type: string; isReleased: boolean }> }).prizeGroups[8]?.isReleased, false);
  });

  it("returns structured 400 and 404 errors", async () => {
    const invalidDate = await getJson("/api/v1/results/not-a-date");
    const invalidQuery = await getJson("/api/v1/results?page=0&limit=200");
    const unknownDraw = await getJson("/api/v1/results/2026-01-01");

    assert.equal(invalidDate.status, 400);
    assert.deepEqual(invalidDate.body, {
      code: "INVALID_DRAW_DATE",
      message: "drawDate must use YYYY-MM-DD format"
    });

    assert.equal(invalidQuery.status, 400);
    assert.deepEqual(invalidQuery.body, {
      code: "INVALID_QUERY",
      message: "Query parameters are invalid"
    });

    assert.equal(unknownDraw.status, 404);
    assert.deepEqual(unknownDraw.body, {
      code: "RESULT_NOT_FOUND",
      message: "Result draw was not found"
    });
  });

  it("fails fast when published draw data is incomplete", async () => {
    const service = createResultsService({
      async findLatestPublicDraw() {
        return null;
      },
      async findLatestPublishedDraw() {
        return {
          id: "draw-1",
          drawDate: new Date("2026-03-01T00:00:00.000Z"),
          drawCode: "2026-03-01",
          status: "published",
          publishedAt: new Date("2026-03-01T09:30:00.000Z")
        };
      },
      async findPublicDrawByDate() {
        return null;
      },
      async findPublishedDrawHistory() {
        return {
          draws: [],
          total: 0,
          summaryRows: []
        };
      },
      async findResultsByDrawId() {
        return [{ drawId: "draw-1", prizeType: "FIRST_PRIZE", prizeIndex: 0, number: "820866" }];
      },
      async findGroupReleasesByDrawId() {
        return [];
      }
    } satisfies ResultsRepository);

    await assert.rejects(
      () => service.getLatestResults(),
      (error: unknown) =>
        error instanceof Error &&
        (error as ResultsApiError).code === "RESULT_DATA_INVALID" &&
        error.message === "Published result data is incomplete or invalid"
    );
  });

  it("fails fast when checker draw data is incomplete", async () => {
    const service = createCheckerService({
      async findLatestPublicDraw() {
        return null;
      },
      async findLatestPublishedDraw() {
        return {
          id: "draw-1",
          drawDate: new Date("2026-03-01T00:00:00.000Z"),
          drawCode: "2026-03-01",
          status: "published",
          publishedAt: new Date("2026-03-01T09:30:00.000Z")
        };
      },
      async findPublicDrawByDate() {
        return null;
      },
      async findCheckerDrawOptions() {
        return [];
      },
      async findResultsByDrawId() {
        return [{ drawId: "draw-1", prizeType: "FIRST_PRIZE", prizeIndex: 0, number: "820866" }];
      },
      async findGroupReleasesByDrawId() {
        return [];
      }
    } satisfies CheckerRepository);

    await assert.rejects(
      () => service.checkTicket({ ticketNumber: "820866" }),
      (error: unknown) =>
        error instanceof Error &&
        (error as CheckerApiError).code === "CHECKER_DATA_INVALID" &&
        error.message === "Checker draw data is incomplete or invalid"
    );
  });

  it("fails fast when published blog data is invalid", async () => {
    const service = createBlogService({
      async findPublishedBlogsByLocale() {
        return {
          items: [],
          total: 0
        };
      },
      async findPublishedBlogBySlug() {
        return {
          slug: "broken-post",
          bannerImageUrl: null,
          publishedAt: new Date("2026-03-31T08:00:00.000Z"),
          translation: {
            locale: "en",
            title: "Broken Post",
            body: [{ type: "heading", text: "Unsupported" }],
            excerpt: null,
            seoTitle: null,
            seoDescription: null
          }
        };
      }
    } satisfies BlogRepository);

    await assert.rejects(
      () => service.getPublicBlogBySlug("broken-post", "en"),
      (error: unknown) =>
        error instanceof Error &&
        (error as BlogApiError).code === "BLOG_DATA_INVALID" &&
        error.message === "Published blog data is incomplete or invalid"
    );
  });
});
