import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { after, before, describe, it } from "node:test";
import { createApp } from "../src/app.js";
import { getApiEnv } from "../src/config/env.js";
import { seed } from "../prisma/seed.ts";
import { createResultsService } from "../src/modules/results/results.service.js";
import type { ResultsRepository } from "../src/modules/results/results.repository.js";
import { type ResultsApiError } from "../src/modules/results/results.errors.js";
import { prisma } from "../src/db/client.js";

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

function getCookieValue(setCookieHeader: string | null): string | null {
  if (!setCookieHeader) {
    return null;
  }

  const [cookie] = setCookieHeader.split(";");
  return cookie ?? null;
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

  it("returns the latest published draw with grouped prize data in canonical order", async () => {
    const { status, body } = await getJson("/api/v1/results/latest");
    const payload = body as {
      drawDate: string;
      drawCode: string | null;
      publishedAt: string;
      prizeGroups: Array<{ type: string; numbers: string[] }>;
    };

    assert.equal(status, 200);
    assert.equal(payload.drawDate, "2026-03-01");
    assert.equal(payload.drawCode, "2026-03-01");
    assert.equal(payload.prizeGroups.length, 9);
    assert.equal(payload.prizeGroups[0]?.type, "FIRST_PRIZE");
    assert.deepEqual(payload.prizeGroups[0]?.numbers, ["820866"]);
    assert.equal(payload.prizeGroups[8]?.type, "LAST_TWO");
    assert.deepEqual(payload.prizeGroups[8]?.numbers, ["06"]);
  });

  it("returns paginated published history in reverse chronological order", async () => {
    const { status, body } = await getJson("/api/v1/results?page=1&limit=1");
    const payload = body as {
      items: Array<{ drawDate: string; firstPrize: string; lastTwo: string }>;
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
      lastTwo: "06"
    });
  });

  it("returns detail for a published draw and hides the draft draw", async () => {
    const published = await getJson("/api/v1/results/2026-02-16");
    const draft = await getJson("/api/v1/results/2026-03-16");

    assert.equal(published.status, 200);
    assert.equal((published.body as { drawDate: string }).drawDate, "2026-02-16");

    assert.equal(draft.status, 404);
    assert.deepEqual(draft.body, {
      code: "RESULT_NOT_FOUND",
      message: "Result draw was not found"
    });
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
      async findLatestPublishedDraw() {
        return {
          id: "draw-1",
          drawDate: new Date("2026-03-01T00:00:00.000Z"),
          drawCode: "2026-03-01",
          publishedAt: new Date("2026-03-01T09:30:00.000Z")
        };
      },
      async findPublishedDrawByDate() {
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
});
