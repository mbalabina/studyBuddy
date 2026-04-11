import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users,
  profiles,
  preferences,
  favorites,
  type InsertProfile,
  type InsertPreference,
  type User,
  type Profile,
  type Preference,
  type Favorite,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

function omitUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as Partial<T>;
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

export async function addFavorite(userId: number, favoriteUserId: number): Promise<Favorite | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add favorite: database not available");
    return null;
  }

  if (userId === favoriteUserId) {
    throw new Error("User cannot favorite themselves");
  }

  try {
    const existing = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.favoriteUserId, favoriteUserId)))
      .limit(1);

    if (existing.length > 0) {
      return existing[0] ?? null;
    }

    await db.insert(favorites).values({ userId, favoriteUserId });

    const favorite = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.favoriteUserId, favoriteUserId)))
      .limit(1);

    return favorite[0] ?? null;
  } catch (error) {
    console.error("[Database] Failed to add favorite:", error);
    throw error;
  }
}

export async function removeFavorite(userId: number, favoriteUserId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot remove favorite: database not available");
    return false;
  }

  try {
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.favoriteUserId, favoriteUserId)));
    return true;
  } catch (error) {
    console.error("[Database] Failed to remove favorite:", error);
    throw error;
  }
}

export async function getUserFavorites(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get favorites: database not available");
    return [];
  }

  const result = await db.select().from(favorites).where(eq(favorites.userId, userId));
  return result.map((item) => item.favoriteUserId);
}

export async function isFavorite(userId: number, favoriteUserId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot check favorite: database not available");
    return false;
  }

  const result = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.favoriteUserId, favoriteUserId)))
    .limit(1);

  return result.length > 0;
}

export async function getUserAdmirers(userId: number): Promise<User[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get admirers: database not available");
    return [];
  }

  const admirerIds = await db.select().from(favorites).where(eq(favorites.favoriteUserId, userId));
  if (admirerIds.length === 0) return [];

  return await db.select().from(users).where(inArray(users.id, admirerIds.map((item) => item.userId)));
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
