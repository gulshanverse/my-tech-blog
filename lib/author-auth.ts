import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const authorSessionCookie = "gulshan_author_session";
const sessionLifetimeSeconds = 60 * 60 * 24 * 7;

function secret() {
  return process.env.AUTHOR_STUDIO_SESSION_SECRET || "";
}

export function isAuthorStudioConfigured() {
  return Boolean(process.env.AUTHOR_STUDIO_PASSWORD && secret());
}

export function authorUsername() {
  return process.env.AUTHOR_STUDIO_USERNAME || "gulshanverse";
}

function signature(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createAuthorSession(username = authorUsername()) {
  const expiresAt = Math.floor(Date.now() / 1000) + sessionLifetimeSeconds;
  const payload = `${username}.${expiresAt}`;
  return `${payload}.${signature(payload)}`;
}

export function verifyAuthorSession(value: string | undefined) {
  if (!value || !secret()) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [username, expiresAt, providedSignature] = parts;
  const expectedSignature = signature(`${username}.${expiresAt}`);
  const validSignature = providedSignature.length === expectedSignature.length && timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature));
  return validSignature && username === authorUsername() && Number(expiresAt) > Math.floor(Date.now() / 1000);
}

export async function hasAuthorSession() {
  const cookieStore = await cookies();
  return verifyAuthorSession(cookieStore.get(authorSessionCookie)?.value);
}

export async function requireAuthorSession() {
  return hasAuthorSession();
}

export function authorCookieOptions() {
  return { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: sessionLifetimeSeconds };
}
