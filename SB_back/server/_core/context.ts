import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import * as auth from "../auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: { userId: number; email: string; role?: "user" | "admin" } | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: { userId: number; email: string } | null = null;

  try {
    user = await auth.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
