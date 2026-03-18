import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { adminSessionPayloadSchema } from "@thai-lottery-checker/schemas";
import type { AdminSessionPayload } from "@thai-lottery-checker/types";

const scrypt = promisify(scryptCallback);
const SCRYPT_KEY_LENGTH = 64;

function toBase64Url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input: string): Buffer {
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(`${normalized}${"=".repeat(paddingLength)}`, "base64");
}

function createSignature(value: string, secret: string): string {
  return toBase64Url(createHmac("sha256", secret).update(value).digest());
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, SCRYPT_KEY_LENGTH)) as Buffer;
  return `scrypt$${toBase64Url(salt)}$${toBase64Url(derivedKey)}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, saltEncoded, hashEncoded] = storedHash.split("$");

  if (algorithm !== "scrypt" || !saltEncoded || !hashEncoded) {
    return false;
  }

  const salt = fromBase64Url(saltEncoded);
  const expectedHash = fromBase64Url(hashEncoded);
  const derivedKey = (await scrypt(password, salt, expectedHash.length)) as Buffer;

  return timingSafeEqual(expectedHash, derivedKey);
}

export function signAdminSession(payload: AdminSessionPayload, secret: string): string {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = createSignature(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function verifyAdminSession(cookieValue: string, secret: string): AdminSessionPayload | null {
  const [encodedPayload, providedSignature] = cookieValue.split(".");

  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = createSignature(encodedPayload, secret);

  if (providedSignature.length !== expectedSignature.length) {
    return null;
  }

  if (!timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    return adminSessionPayloadSchema.parse(JSON.parse(fromBase64Url(encodedPayload).toString("utf8")));
  } catch {
    return null;
  }
}
