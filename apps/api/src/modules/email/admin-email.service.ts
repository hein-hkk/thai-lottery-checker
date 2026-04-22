import { getApiEnv } from "../../config/env.js";

const resendApiUrl = "https://api.resend.com/emails";

export type AdminEmailProvider = "disabled" | "resend";
export type AdminEmailType = "admin_invitation" | "admin_password_reset";

export interface AdminEmailRequestContext {
  requestId?: string;
  entityId?: string;
}

export interface SendAdminInvitationEmailInput {
  to: string;
  acceptUrl: string;
  expiresAt: string;
  invitedByName?: string | null;
}

export interface SendAdminPasswordResetEmailInput {
  to: string;
  resetUrl: string;
  expiresAt: string;
}

export interface AdminEmailDeliveryReceipt {
  provider: Exclude<AdminEmailProvider, "disabled">;
  messageId: string | null;
}

export interface AdminEmailService {
  provider: AdminEmailProvider;
  isAutomatedDeliveryEnabled(): boolean;
  sendAdminInvitationEmail(
    input: SendAdminInvitationEmailInput,
    context?: AdminEmailRequestContext
  ): Promise<AdminEmailDeliveryReceipt>;
  sendAdminPasswordResetEmail(
    input: SendAdminPasswordResetEmailInput,
    context?: AdminEmailRequestContext
  ): Promise<AdminEmailDeliveryReceipt>;
}

export class AdminEmailDeliveryError extends Error {
  readonly code: string;
  readonly provider: AdminEmailProvider;

  constructor(provider: AdminEmailProvider, code: string, message: string) {
    super(message);
    this.name = "AdminEmailDeliveryError";
    this.code = code;
    this.provider = provider;
  }
}

let cachedAdminEmailService: AdminEmailService | undefined;
let adminEmailServiceOverride: AdminEmailService | undefined;

export function maskEmailAddress(email: string): string {
  const [localPart, domain = ""] = email.trim().toLowerCase().split("@");

  if (!localPart || !domain) {
    return "[redacted-email]";
  }

  const visiblePrefixLength = Math.min(2, localPart.length);
  return `${localPart.slice(0, visiblePrefixLength)}***@${domain}`;
}

export function sanitizeSensitiveLogText(value: string): string {
  return value
    .replaceAll(/token=[^&\s"]+/gi, "token=[REDACTED]")
    .replaceAll(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, (match) => maskEmailAddress(match));
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

function formatExpiresAt(expiresAt: string): string {
  return new Date(expiresAt).toUTCString();
}

function formatFromHeader(emailFromName: string, emailFromAddress: string): string {
  return `${emailFromName} <${emailFromAddress}>`;
}

function logEmailEvent(level: "info" | "warn" | "error", event: Record<string, unknown>): void {
  const sanitizedEvent = {
    ...event,
    ...(typeof event.recipient === "string" ? { recipient: maskEmailAddress(event.recipient) } : {}),
    ...(typeof event.message === "string" ? { message: sanitizeSensitiveLogText(event.message) } : {})
  };
  const payload = JSON.stringify({
    category: "email",
    timestamp: new Date().toISOString(),
    ...sanitizedEvent
  });

  if (level === "warn") {
    console.warn(payload);
    return;
  }

  if (level === "error") {
    console.error(payload);
    return;
  }

  console.info(payload);
}

function renderActionEmail(input: {
  preview: string;
  title: string;
  lead: string;
  actionLabel: string;
  actionUrl: string;
  expiresAt: string;
  footnote: string;
}): { html: string; text: string } {
  const title = escapeHtml(input.title);
  const lead = escapeHtml(input.lead);
  const actionLabel = escapeHtml(input.actionLabel);
  const actionUrl = escapeAttribute(input.actionUrl);
  const expiresAt = escapeHtml(formatExpiresAt(input.expiresAt));
  const footnote = escapeHtml(input.footnote);

  return {
    html: `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4efe7;color:#1f2937;font-family:Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preview)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;padding:32px;box-shadow:0 12px 40px rgba(15,23,42,0.08);">
            <tr>
              <td>
                <p style="margin:0 0 12px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#b45309;">LottoKai Admin</p>
                <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#111827;">${title}</h1>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#374151;">${lead}</p>
                <p style="margin:0 0 24px;">
                  <a href="${actionUrl}" style="display:inline-block;background:#111827;color:#ffffff;padding:14px 22px;border-radius:999px;text-decoration:none;font-weight:700;">${actionLabel}</a>
                </p>
                <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#4b5563;">If the button does not work, copy and paste this link into your browser:</p>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.7;word-break:break-all;">
                  <a href="${actionUrl}" style="color:#b45309;text-decoration:underline;">${escapeHtml(input.actionUrl)}</a>
                </p>
                <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#4b5563;">This link expires on <strong>${expiresAt}</strong>.</p>
                <p style="margin:0;font-size:14px;line-height:1.7;color:#6b7280;">${footnote}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    text: `${input.title}

${input.lead}

${input.actionLabel}: ${input.actionUrl}

This link expires on ${formatExpiresAt(input.expiresAt)}.

${input.footnote}`
  };
}

function buildInvitationEmail(input: SendAdminInvitationEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const invitedBy = input.invitedByName ? ` from ${input.invitedByName}` : "";
  const content = renderActionEmail({
    preview: "Use this secure link to activate your LottoKai admin account.",
    title: "Activate your LottoKai admin account",
    lead: `You were invited${invitedBy} to access the LottoKai admin workspace. Use the secure link below to set your name and password.`,
    actionLabel: "Activate account",
    actionUrl: input.acceptUrl,
    expiresAt: input.expiresAt,
    footnote: "If you were not expecting this invitation, you can safely ignore this email."
  });

  return {
    subject: "Activate your LottoKai admin account",
    html: content.html,
    text: content.text
  };
}

function buildPasswordResetEmail(input: SendAdminPasswordResetEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const content = renderActionEmail({
    preview: "Use this secure link to reset your LottoKai admin password.",
    title: "Reset your LottoKai admin password",
    lead: "We received a request to reset your LottoKai admin password. Use the secure link below to choose a new password.",
    actionLabel: "Reset password",
    actionUrl: input.resetUrl,
    expiresAt: input.expiresAt,
    footnote: "If you did not request this change, you can ignore this email and your password will remain unchanged."
  });

  return {
    subject: "Reset your LottoKai admin password",
    html: content.html,
    text: content.text
  };
}

async function sendResendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  emailType: AdminEmailType;
  idempotencyKey: string;
  context?: AdminEmailRequestContext;
}): Promise<AdminEmailDeliveryReceipt> {
  const env = getApiEnv();
  const response = await fetch(resendApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey
    },
    body: JSON.stringify({
      from: formatFromHeader(env.EMAIL_FROM_NAME!, env.EMAIL_FROM_ADDRESS!),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(env.EMAIL_REPLY_TO_ADDRESS ? { reply_to: env.EMAIL_REPLY_TO_ADDRESS } : {}),
      tags: [
        { name: "email_type", value: input.emailType },
        { name: "environment", value: process.env.NODE_ENV ?? "development" }
      ]
    }),
    signal: AbortSignal.timeout(10_000)
  });

  let payload: unknown = null;

  try {
    payload = (await response.json()) as unknown;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : `Resend request failed with status ${response.status}`;

    logEmailEvent("error", {
      requestId: input.context?.requestId ?? null,
      entityId: input.context?.entityId ?? null,
      provider: "resend",
      emailType: input.emailType,
      recipient: input.to,
      outcome: "delivery_failed",
      statusCode: response.status,
      message
    });

    throw new AdminEmailDeliveryError("resend", "ADMIN_EMAIL_DELIVERY_FAILED", message);
  }

  const messageId =
    payload && typeof payload === "object" && "id" in payload && typeof payload.id === "string" ? payload.id : null;

  logEmailEvent("info", {
    requestId: input.context?.requestId ?? null,
    entityId: input.context?.entityId ?? null,
    provider: "resend",
    emailType: input.emailType,
    recipient: input.to,
    outcome: "delivered",
    messageId
  });

  return {
    provider: "resend",
    messageId
  };
}

function createDisabledAdminEmailService(): AdminEmailService {
  return {
    provider: "disabled",
    isAutomatedDeliveryEnabled: () => false,
    async sendAdminInvitationEmail() {
      throw new AdminEmailDeliveryError("disabled", "ADMIN_EMAIL_PROVIDER_DISABLED", "Email delivery is disabled");
    },
    async sendAdminPasswordResetEmail() {
      throw new AdminEmailDeliveryError("disabled", "ADMIN_EMAIL_PROVIDER_DISABLED", "Email delivery is disabled");
    }
  };
}

function createResendAdminEmailService(): AdminEmailService {
  return {
    provider: "resend",
    isAutomatedDeliveryEnabled: () => true,
    async sendAdminInvitationEmail(input, context) {
      const message = buildInvitationEmail(input);
      return sendResendEmail({
        to: input.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        emailType: "admin_invitation",
        idempotencyKey: `admin-invitation:${context?.entityId ?? input.to}:${input.expiresAt}`,
        context
      });
    },
    async sendAdminPasswordResetEmail(input, context) {
      const message = buildPasswordResetEmail(input);
      return sendResendEmail({
        to: input.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        emailType: "admin_password_reset",
        idempotencyKey: `admin-password-reset:${context?.entityId ?? input.to}:${input.expiresAt}`,
        context
      });
    }
  };
}

function createAdminEmailService(): AdminEmailService {
  const env = getApiEnv();

  if (env.EMAIL_PROVIDER === "resend") {
    return createResendAdminEmailService();
  }

  return createDisabledAdminEmailService();
}

export function resetAdminEmailServiceCache(): void {
  cachedAdminEmailService = undefined;
}

export function setAdminEmailServiceForTests(service?: AdminEmailService): void {
  adminEmailServiceOverride = service;
  cachedAdminEmailService = undefined;
}

export function getAdminEmailService(): AdminEmailService {
  if (adminEmailServiceOverride) {
    return adminEmailServiceOverride;
  }

  if (cachedAdminEmailService) {
    return cachedAdminEmailService;
  }

  cachedAdminEmailService = createAdminEmailService();
  return cachedAdminEmailService;
}
