import { describe, expect, it } from "vitest";
import { COOKIE_NAME } from "../shared/const";
import { appRouter } from "./routers";

describe("auth.logout", () => {
  it("clears the real session cookie", async () => {
    const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];

    const caller = appRouter.createCaller({
      user: { userId: 1, email: "sample@example.com" },
      req: {
        protocol: "https",
        headers: {},
      },
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      },
    } as any);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
      maxAge: -1,
    });
  });
});
