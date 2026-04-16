import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  getPreferences: vi.fn(),
  getAllUsers: vi.fn(),
  getAllProfiles: vi.fn(),
  getUserFavorites: vi.fn(),
}));

const compareGoalsMock = vi.hoisted(() => vi.fn());

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return {
    ...actual,
    ...dbMocks,
  };
});

vi.mock("./groq", async () => {
  const actual = await vi.importActual<typeof import("./groq")>("./groq");
  return {
    ...actual,
    compareGoals: compareGoalsMock,
  };
});

import { appRouter } from "./routers";

function createCaller() {
  return appRouter.createCaller({
    user: { userId: 1, email: "me@example.com" },
    req: { protocol: "https", headers: {} },
    res: {},
  } as any);
}

describe("matching strict goal filter", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    dbMocks.getPreferences.mockResolvedValue(null);
    dbMocks.getUserFavorites.mockResolvedValue([]);
    compareGoalsMock.mockResolvedValue(1);
  });

  it("returns empty when current user has no active goal", async () => {
    dbMocks.getProfile.mockResolvedValue({ userId: 1, studyGoal: "" } as any);
    dbMocks.getAllUsers.mockResolvedValue([
      { id: 2, email: "a@example.com", telegramUsername: "", isProfileComplete: true },
    ] as any);
    dbMocks.getAllProfiles.mockResolvedValue([
      { userId: 2, studyGoal: "IELTS", firstName: "Alice" },
    ] as any);

    const caller = createCaller();
    const result = await caller.search.users({
      onlyCompleteProfiles: true,
      limit: 20,
      offset: 0,
    });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(compareGoalsMock).not.toHaveBeenCalled();
  });

  it("returns only candidates with exact matching goal and excludes empty goals", async () => {
    dbMocks.getProfile.mockResolvedValue({ userId: 1, studyGoal: "IELTS" } as any);
    dbMocks.getAllUsers.mockResolvedValue([
      { id: 2, email: "match@example.com", telegramUsername: "", isProfileComplete: true },
      { id: 3, email: "other@example.com", telegramUsername: "", isProfileComplete: true },
      { id: 4, email: "empty@example.com", telegramUsername: "", isProfileComplete: true },
    ] as any);
    dbMocks.getAllProfiles.mockResolvedValue([
      { userId: 2, studyGoal: " IELTS ", firstName: "Match" },
      { userId: 3, studyGoal: "TOEFL", firstName: "Other" },
      { userId: 4, studyGoal: "", firstName: "Empty" },
    ] as any);

    const caller = createCaller();
    const result = await caller.search.users({
      onlyCompleteProfiles: true,
      limit: 20,
      offset: 0,
    });

    expect(result.items.map((item) => item.id)).toEqual([2]);
    expect(compareGoalsMock).toHaveBeenCalledTimes(1);
  });

  it("uses selected goal override in matching.getCandidates", async () => {
    dbMocks.getProfile.mockResolvedValue({ userId: 1, studyGoal: "TOEFL" } as any);
    dbMocks.getAllUsers.mockResolvedValue([
      { id: 2, email: "ielts@example.com", telegramUsername: "", isProfileComplete: true },
      { id: 3, email: "toefl@example.com", telegramUsername: "", isProfileComplete: true },
    ] as any);
    dbMocks.getAllProfiles.mockResolvedValue([
      { userId: 2, studyGoal: "IELTS", firstName: "Ielts Candidate" },
      { userId: 3, studyGoal: "TOEFL", firstName: "Toefl Candidate" },
    ] as any);

    const caller = createCaller();
    const result = await caller.matching.getCandidates({ goal: "IELTS" });

    expect(result.map((item) => item.id)).toEqual([2]);
    expect(compareGoalsMock).toHaveBeenCalledTimes(1);
    expect(compareGoalsMock).toHaveBeenCalledWith("IELTS", "IELTS");
  });
});
