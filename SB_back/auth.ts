import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import type { Request, Response } from "express";
import { COOKIE_NAME } from "@shared/const";
import * as db from "./db";
import { ENV } from "./_core/env";

const JWT_SECRET = new TextEncoder().encode(ENV.cookieSecret || "your-secret-key");
const SCRYPT_KEYLEN = 64;

export type SessionPayload = {
  userId: number;
  email: string;
};

export type SafeUser = {
  id: number;
  email: string;
  telegramUsername: string | null;
  role: "user" | "admin";
  isProfileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function toSafeUser(user: Awaited<ReturnType<typeof db.getUserById>>): SafeUser | null {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    telegramUsername: user.telegramUsername ?? null,
    role: user.role,
    isProfileComplete: user.isProfileComplete,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Password hashing based on scrypt with a per-password salt.
 * Stored format: scrypt$<hexSalt>$<hexHash>
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt$${salt}$${derivedKey}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, salt, expectedHash] = storedHash.split("$");

  if (algorithm !== "scrypt" || !salt || !expectedHash) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, SCRYPT_KEYLEN);
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (derivedKey.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, expectedBuffer);
}

export async function createToken(userId: number, email: string): Promise<string> {
  return await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as SessionPayload;
  } catch (error) {
    console.error("[Auth] Token verification failed:", error);
    return null;
  }
}

export function getTokenFromRequest(req: Request): string | null {
  // Сначала пробуем Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  // Затем cookies
  const cookies = parseCookie(req.headers.cookie || "");
  return cookies[COOKIE_NAME] || null;
}

function parseCookie(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(";").forEach((cookie) => {
    const separatorIndex = cookie.indexOf("=");
    if (separatorIndex <= 0) return;

    const name = cookie.slice(0, separatorIndex).trim();
    const value = cookie.slice(separatorIndex + 1).trim();

    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });

  return cookies;
}

export function getSessionCookieOptions(req: Request) {
  const isSecure = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https";

  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export async function setSessionCookie(
  res: Response,
  req: Request,
  userId: number,
  email: string,
): Promise<string> {
  const token = await createToken(userId, email);
  const options = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, token, options);
  return token;
}

export async function authenticateRequest(
  req: Request,
): Promise<{ userId: number; email: string } | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await db.getUserById(payload.userId);
  if (!user) return null;

  return { userId: user.id, email: user.email };
}
