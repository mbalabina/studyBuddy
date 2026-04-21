import { and, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users,
  profiles,
  preferences,
  userStudyGoals,
  favorites,
  type InsertProfile,
  type InsertPreference,
  type InsertUserStudyGoal,
  type User,
  type Profile,
  type Preference,
  type UserStudyGoal,
  type Favorite,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

function omitUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as Partial<T>;
}

function normalizeGoalName(goal: string | null | undefined): string {
  return (goal ?? "").trim().toLowerCase();
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }

  return _db;
}

export async function createUser(
  email: string,
  passwordHash: string,
  telegramUsername?: string,
): Promise<User | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create user: database not available");
    return null;
  }

  try {
    const result = await db.insert(users).values({
      email,
      passwordHash,
      telegramUsername: telegramUsername || null,
      role: "user",
      isProfileComplete: false,
    });

    const userId = result[0].insertId;
    const user = await db.select().from(users).where(eq(users.id, Number(userId))).limit(1);
    return user[0] ?? null;
  } catch (error) {
    console.error("[Database] Failed to create user:", error);
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return null;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] ?? null;
}

export async function getUserById(id: number): Promise<User | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return null;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? null;
}

export async function upsertProfile(
  userId: number,
  data: Partial<Omit<InsertProfile, "userId">>,
): Promise<Profile | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert profile: database not available");
    return null;
  }

  try {
    const existing = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    const payload = omitUndefined(data);

    if (existing.length > 0) {
      await db
        .update(profiles)
        .set({
          ...payload,
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, userId));
    } else {
      await db.insert(profiles).values({
        userId,
        subjects: [],
        schedule: [],
        ...payload,
      });
    }

    const result = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    return result[0] ?? null;
  } catch (error) {
    console.error("[Database] Failed to upsert profile:", error);
    throw error;
  }
}

export async function getProfile(userId: number): Promise<Profile | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get profile: database not available");
    return null;
  }

  const result = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getUserGoals(userId: number): Promise<UserStudyGoal[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user goals: database not available");
    return [];
  }

  return await db
    .select()
    .from(userStudyGoals)
    .where(eq(userStudyGoals.userId, userId))
    .orderBy(desc(userStudyGoals.isActive), userStudyGoals.id);
}

export async function getGoalsByUserIds(userIds: number[]): Promise<UserStudyGoal[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get goals by user ids: database not available");
    return [];
  }

  if (userIds.length === 0) {
    return [];
  }

  return await db
    .select()
    .from(userStudyGoals)
    .where(inArray(userStudyGoals.userId, userIds))
    .orderBy(desc(userStudyGoals.isActive), userStudyGoals.id);
}

export async function getUserGoalById(goalId: number): Promise<UserStudyGoal | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get goal by id: database not available");
    return null;
  }

  const result = await db
    .select()
    .from(userStudyGoals)
    .where(eq(userStudyGoals.id, goalId))
    .limit(1);

  return result[0] ?? null;
}

export async function getActiveUserGoal(userId: number): Promise<UserStudyGoal | null> {
  const goals = await getUserGoals(userId);
  if (goals.length === 0) return null;

  return goals.find((goal) => goal.isActive) ?? goals[0] ?? null;
}

export async function createUserGoal(
  userId: number,
  data: {
    name: string;
    description?: string | null;
    isActive?: boolean;
  },
): Promise<UserStudyGoal | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create user goal: database not available");
    return null;
  }

  const name = data.name.trim();
  if (!name) {
    throw new Error("Goal name cannot be empty");
  }

  const shouldActivate = Boolean(data.isActive);

  try {
    if (shouldActivate) {
      await db
        .update(userStudyGoals)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(userStudyGoals.userId, userId));
    }

    const payload: InsertUserStudyGoal = {
      userId,
      name,
      description: data.description ?? null,
      isActive: shouldActivate,
    };

    const result = await db.insert(userStudyGoals).values(payload);
    const goalId = Number(result[0].insertId);
    const goal = await getUserGoalById(goalId);

    if (goal?.isActive) {
      await upsertProfile(userId, {
        studyGoal: goal.name,
        bio: goal.description ?? undefined,
      });
    }

    return goal;
  } catch (error) {
    console.error("[Database] Failed to create user goal:", error);
    throw error;
  }
}

export async function setActiveUserGoal(userId: number, goalId: number): Promise<UserStudyGoal | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot activate goal: database not available");
    return null;
  }

  const goal = await getUserGoalById(goalId);
  if (!goal || goal.userId !== userId) {
    return null;
  }

  try {
    await db
      .update(userStudyGoals)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(userStudyGoals.userId, userId));

    await db
      .update(userStudyGoals)
      .set({ isActive: true, updatedAt: new Date() })
      .where(and(eq(userStudyGoals.userId, userId), eq(userStudyGoals.id, goalId)));

    const activeGoal = await getUserGoalById(goalId);
    if (activeGoal) {
      await upsertProfile(userId, {
        studyGoal: activeGoal.name,
        bio: activeGoal.description ?? undefined,
      });
    }

    return activeGoal;
  } catch (error) {
    console.error("[Database] Failed to activate goal:", error);
    throw error;
  }
}

export async function upsertUserGoalByName(
  userId: number,
  name: string,
  description?: string | null,
): Promise<UserStudyGoal | null> {
  const normalizedName = normalizeGoalName(name);
  if (!normalizedName) return null;

  const goals = await getUserGoals(userId);
  const existing = goals.find((goal) => normalizeGoalName(goal.name) === normalizedName) ?? null;

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert goal by name: database not available");
    return null;
  }

  try {
    if (!existing) {
      return await createUserGoal(userId, {
        name: name.trim(),
        description,
        isActive: true,
      });
    }

    await db
      .update(userStudyGoals)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(userStudyGoals.userId, userId));

    await db
      .update(userStudyGoals)
      .set({
        name: name.trim(),
        description: description ?? existing.description ?? null,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(userStudyGoals.id, existing.id));

    await upsertProfile(userId, {
      studyGoal: name.trim(),
      bio: description ?? undefined,
    });

    return await getUserGoalById(existing.id);
  } catch (error) {
    console.error("[Database] Failed to upsert goal by name:", error);
    throw error;
  }
}

export async function ensureUserGoalsFromLegacyProfile(userId: number): Promise<UserStudyGoal[]> {
  const goals = await getUserGoals(userId);
  if (goals.length > 0) {
    return goals;
  }

  const profile = await getProfile(userId);
  const legacyGoal = profile?.studyGoal?.trim();
  if (!legacyGoal) {
    return goals;
  }

  await createUserGoal(userId, {
    name: legacyGoal,
    description: profile?.bio ?? null,
    isActive: true,
  });

  return await getUserGoals(userId);
}

export async function upsertPreferences(
  userId: number,
  data: Partial<Omit<InsertPreference, "userId">>,
): Promise<Preference | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert preferences: database not available");
    return null;
  }

  try {
    const existing = await db.select().from(preferences).where(eq(preferences.userId, userId)).limit(1);
    const payload = omitUndefined(data);

    if (existing.length > 0) {
      await db
        .update(preferences)
        .set({
          ...payload,
          updatedAt: new Date(),
        })
        .where(eq(preferences.userId, userId));
    } else {
      await db.insert(preferences).values({
        userId,
        preferredSchedule: [],
        ...payload,
      });
    }

    const result = await db.select().from(preferences).where(eq(preferences.userId, userId)).limit(1);
    return result[0] ?? null;
  } catch (error) {
    console.error("[Database] Failed to upsert preferences:", error);
    throw error;
  }
}

export async function getPreferences(userId: number): Promise<Preference | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get preferences: database not available");
    return null;
  }

  const result = await db.select().from(preferences).where(eq(preferences.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function addFavorite(
  userId: number,
  favoriteUserId: number,
  goalId?: number,
): Promise<Favorite | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add favorite: database not available");
    return null;
  }

  if (userId === favoriteUserId) {
    throw new Error("User cannot favorite themselves");
  }

  try {
    const scopeCondition = typeof goalId === "number" ? eq(favorites.goalId, goalId) : undefined;
    const existing = await db
      .select()
      .from(favorites)
      .where(
        scopeCondition
          ? and(eq(favorites.userId, userId), eq(favorites.favoriteUserId, favoriteUserId), scopeCondition)
          : and(eq(favorites.userId, userId), eq(favorites.favoriteUserId, favoriteUserId)),
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0] ?? null;
    }

    await db.insert(favorites).values({ userId, favoriteUserId, goalId: goalId ?? null });

    const favorite = await db
      .select()
      .from(favorites)
      .where(
        scopeCondition
          ? and(eq(favorites.userId, userId), eq(favorites.favoriteUserId, favoriteUserId), scopeCondition)
          : and(eq(favorites.userId, userId), eq(favorites.favoriteUserId, favoriteUserId)),
      )
      .limit(1);

    return favorite[0] ?? null;
  } catch (error) {
    console.error("[Database] Failed to add favorite:", error);
    throw error;
  }
}

export async function removeFavorite(
  userId: number,
  favoriteUserId: number,
  goalId?: number,
): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot remove favorite: database not available");
    return false;
  }

  try {
    await db
      .delete(favorites)
      .where(
        typeof goalId === "number"
          ? and(eq(favorites.userId, userId), eq(favorites.favoriteUserId, favoriteUserId), eq(favorites.goalId, goalId))
          : and(eq(favorites.userId, userId), eq(favorites.favoriteUserId, favoriteUserId)),
      );
    return true;
  } catch (error) {
    console.error("[Database] Failed to remove favorite:", error);
    throw error;
  }
}

export async function getUserFavorites(userId: number, goalId?: number): Promise<number[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get favorites: database not available");
    return [];
  }

  const result = await db
    .select()
    .from(favorites)
    .where(
      typeof goalId === "number"
        ? and(eq(favorites.userId, userId), eq(favorites.goalId, goalId))
        : eq(favorites.userId, userId),
    );
  return result.map((item) => item.favoriteUserId);
}

export async function isFavorite(userId: number, favoriteUserId: number, goalId?: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot check favorite: database not available");
    return false;
  }

  const result = await db
    .select()
    .from(favorites)
    .where(
      typeof goalId === "number"
        ? and(eq(favorites.userId, userId), eq(favorites.favoriteUserId, favoriteUserId), eq(favorites.goalId, goalId))
        : and(eq(favorites.userId, userId), eq(favorites.favoriteUserId, favoriteUserId)),
    )
    .limit(1);

  return result.length > 0;
}

export async function getUserAdmirers(userId: number, goalId?: number): Promise<User[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get admirers: database not available");
    return [];
  }

  void goalId;
  const admirerIds = await db
    .select()
    .from(favorites)
    .where(eq(favorites.favoriteUserId, userId));
  if (admirerIds.length === 0) return [];

  const uniqueIds = Array.from(new Set(admirerIds.map((item) => item.userId)));
  return await db.select().from(users).where(inArray(users.id, uniqueIds));
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get users: database not available");
    return [];
  }

  return await db.select().from(users);
}

export async function getAllProfiles(): Promise<(Profile & { user: User | null })[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get profiles: database not available");
    return [];
  }

  const result = await db.select().from(profiles);

  return await Promise.all(
    result.map(async (profile) => {
      const user = await getUserById(profile.userId);
      return { ...profile, user };
    }),
  );
}

export async function getProfilesByUserIds(userIds: number[]): Promise<Profile[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get profiles by ids: database not available");
    return [];
  }

  if (userIds.length === 0) {
    return [];
  }

  return await db.select().from(profiles).where(inArray(profiles.userId, userIds));
}

export async function markProfileComplete(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot mark profile complete: database not available");
    return;
  }

  try {
    await db
      .update(users)
      .set({
        isProfileComplete: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  } catch (error) {
    console.error("[Database] Failed to mark profile complete:", error);
    throw error;
  }
}

export async function getAllUsersWithStats() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get users: database not available");
    return [];
  }

  const allUsers = await db.select().from(users);

  return await Promise.all(
    allUsers.map(async (user) => {
      const profile = await getProfile(user.id);
      const favoriteCount = await db.select().from(favorites).where(eq(favorites.favoriteUserId, user.id));
      const admirerCount = await db.select().from(favorites).where(eq(favorites.userId, user.id));

      return {
        ...user,
        profile,
        favoriteCount: favoriteCount.length,
        admirerCount: admirerCount.length,
      };
    }),
  );
}
