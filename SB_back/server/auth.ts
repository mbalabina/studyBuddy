import { SignJWT, jwtVerify } from "jose";
import type { Request, Response } from "express";
import { COOKIE_NAME } from "@shared/const";
import * as db from "./db";
import { ENV } from "./_core/env";

const JWT_SECRET = new TextEncoder().encode(ENV.cookieSecret || "your-secret-key");

export type SessionPayload = {
  userId: number;
  email: string;
};

/**
 * Hash password using a simple method (in production, use bcrypt)
 */
export async function hashPassword(password: string): Promise<string> {
  // In production, use bcrypt: await bcrypt.hash(password, 10)
  // For now, using a simple approach - in real app, use proper hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Create JWT token
 */
export async function createToken(userId: number, email: string): Promise<string> {
  const token = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
  return token;
}

/**
 * Verify JWT token
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as SessionPayload;
  } catch (error) {
    console.error("[Auth] Token verification failed:", error);
    return null;
  }
}

/**
 * Extract token from request
 */
export function getTokenFromRequest(req: Request): string | null {
  const cookies = parseCookie(req.headers.cookie || "");
  return cookies[COOKIE_NAME] || null;
}

/**
 * Parse cookie header
 */
function parseCookie(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(";").forEach(cookie => {
    const [name, value] = cookie.trim().split("=");
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  
  return cookies;
}

/**
 * Get session cookie options
 */
export function getSessionCookieOptions(req: Request) {
  const isSecure = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https";
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

/**
 * Set session cookie
 */
export async function setSessionCookie(res: Response, req: Request, userId: number, email: string): Promise<void> {
  const token = await createToken(userId, email);
  const options = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, token, options);
}

/**
 * Authenticate request
 */
export async function authenticateRequest(req: Request): Promise<{ userId: number; email: string } | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  // Verify user still exists
  const user = await db.getUserById(payload.userId);
  if (!user) return null;

  return { userId: user.id, email: user.email };
}
