import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import * as auth from "./auth";
import * as db from "./db";
import { compareGoals } from "./groq";

type JsonArrayValue = string[] | null | undefined;

function normalizeStringArray(value: JsonArrayValue): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [];
}

/**
 * Алгоритм совместимости двух пользователей.
 *
 * Веса (итого 100 баллов):
 *   35 — схожесть учебных целей (оценивает Groq AI)
 *   25 — совпадение формата обучения (Online / Offline / Both)
 *   15 — общие предметы
 *   10 — совпадение расписания
 *   10 — совпадение уровня языка
 *    3 — стиль общения
 *    2 — город
 */
function calculateCompatibility(
  user1Profile: any,
  user1Prefs: any,
  user2Profile: any,
  goalSimilarity: number = 0.5,
): number {
  let score = 0;
  let maxScore = 0;

  // ── 1. Схожесть учебных целей (35 баллов) ────────────────────────
  if (user1Profile?.studyGoal || user2Profile?.studyGoal) {
    maxScore += 35;
    score += Math.round(goalSimilarity * 35);
  }

  // ── 2. Формат обучения (25 баллов) ───────────────────────────────
  // Сравниваем реальные значения, а не просто факт наличия поля
  if (user1Prefs?.learningFormat && user2Profile?.learningFormat) {
    maxScore += 25;
    if (
      user1Prefs.learningFormat === user2Profile.learningFormat ||
      user1Prefs.learningFormat === "Both" ||
      user2Profile.learningFormat === "Both"
    ) {
      score += 25;
    }
  }

  // ── 3. Общие предметы (15 баллов) ────────────────────────────────
  if (user1Profile?.subjects && user2Profile?.subjects) {
    maxScore += 15;
    const commonSubjects = normalizeStringArray(user1Profile.subjects).filter((item) =>
      normalizeStringArray(user2Profile.subjects).includes(item),
    );
    score += Math.min(15, commonSubjects.length * 5);
  }

  // ── 4. Совпадение расписания (10 баллов) ─────────────────────────
  if (user1Prefs?.preferredSchedule && user2Profile?.schedule) {
    maxScore += 10;
    const commonSlots = normalizeStringArray(user1Prefs.preferredSchedule).filter((item) =>
      normalizeStringArray(user2Profile.schedule).includes(item),
    );
    if (commonSlots.length > 0) {
      score += 10;
    }
  }

  // ── 5. Уровень языка (10 баллов) ─────────────────────────────────
  if (user1Prefs?.preferredLevel && user2Profile?.proficiencyLevel) {
    maxScore += 10;
    if (
      user1Prefs.preferredLevel === user2Profile.proficiencyLevel ||
      user1Prefs.preferredLevel === "Any"
    ) {
      score += 10;
    }
  }

  // ── 6. Стиль общения (3 балла) ────────────────────────────────────
  // Сравниваем реальные значения кандидата
  if (user1Prefs?.communicationStyle && user2Profile?.communicationStyle) {
    maxScore += 3;
    if (user1Prefs.communicationStyle === user2Profile.communicationStyle) {
      score += 3;
    }
  }

  // ── 7. Город (2 балла) ────────────────────────────────────────────
  if (user1Prefs?.city && user2Profile?.city) {
    maxScore += 2;
    if (user1Prefs.city.toLowerCase() === user2Profile.city.toLowerCase()) {
      score += 2;
    }
  }

  if (maxScore === 0) return 50;
  return Math.round((score / maxScore) * 100);
}

function buildCandidateCard(params: {
  user: Awaited<ReturnType<typeof db.getUserById>>;
  profile: Awaited<ReturnType<typeof db.getProfile>>;
  compatibility: number;
  isFavorite: boolean;
}) {
  const { user, profile, compatibility, isFavorite } = params;

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: profile?.firstName
      ? `${profile.firstName} ${profile.lastName || ""}`.trim()
      : user.email.split("@")[0],
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    age: profile?.age ?? null,
    city: profile?.city || "",
    compatibility,
    goal: profile?.studyGoal || "",
    goalDescription: profile?.bio || "",
    bio: profile?.bio || "",
    proficiencyLevel: profile?.proficiencyLevel || "",
    subjects: normalizeStringArray(profile?.subjects),
    schedule: normalizeStringArray(profile?.schedule),
    experience: profile?.experience || "",
    university: profile?.university || "",
    course: profile?.course || "",
    learningFormat: profile?.learningFormat || "",
    communicationStyle: profile?.communicationStyle || "",
    telegram: profile?.messengerHandle || user.telegramUsername || "",
    avatar: profile?.avatarUrl || "",
    isFavorite,
  };
}

const searchInput = z.object({
  query: z.string().trim().optional(),
  city: z.string().trim().optional(),
  subject: z.string().trim().optional(),
  proficiencyLevel: z.string().trim().optional(),
  minAge: z.number().int().min(0).optional(),
  maxAge: z.number().int().min(0).optional(),
  onlyCompleteProfiles: z.boolean().default(true),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const appRouter: any = router({

  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      const user = await db.getUserById(ctx.user.userId);
      return auth.toSafeUser(user);
    }),

    register: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6),
          telegramUsername: z.string().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const existing = await db.getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "User already exists" });
        }

        const passwordHash = await auth.hashPassword(input.password);
        const user = await db.createUser(input.email, passwordHash, input.telegramUsername);

        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create user",
          });
        }

        await auth.setSessionCookie(ctx.res, ctx.req, user.id, user.email);
        return { user: auth.toSafeUser(user) };
      }),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        const isValid = await auth.verifyPassword(input.password, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
        }

        await auth.setSessionCookie(ctx.res, ctx.req, user.id, user.email);
        return { user: auth.toSafeUser(user) };
      }),

    logout: protectedProcedure.mutation(({ ctx }) => {
      const cookieOptions = auth.getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
  }),

  menu: router({
    main: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user!.userId;
      const [user, profile, favoriteIds, admirers] = await Promise.all([
        db.getUserById(userId),
        db.getProfile(userId),
        db.getUserFavorites(userId),
        db.getUserAdmirers(userId),
      ]);

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return {
        user: auth.toSafeUser(user),
        profile: {
          firstName: profile?.firstName || "",
          lastName: profile?.lastName || "",
          city: profile?.city || "",
          proficiencyLevel: profile?.proficiencyLevel || "",
          isComplete: user.isProfileComplete,
        },
        counters: {
          favorites: favoriteIds.length,
          admirers: admirers.length,
        },
        menuItems: [
          { key: "home", label: "Главная" },
          { key: "search", label: "Поиск" },
          { key: "favorites", label: "Избранное", badge: favoriteIds.length },
          { key: "admirers", label: "Кто лайкнул", badge: admirers.length },
          { key: "profile", label: "Профиль" },
        ],
      };
    }),
  }),

  profile: router({
    getMe: protectedProcedure.query(async ({ ctx }) => {
      const [user, profile, preferences] = await Promise.all([
        db.getUserById(ctx.user!.userId),
        db.getProfile(ctx.user!.userId),
        db.getPreferences(ctx.user!.userId),
      ]);

      return {
        user: auth.toSafeUser(user),
        profile,
        preferences,
      };
    }),

      updateAboutMe: protectedProcedure
        .input(z.object({
          firstName:        z.string().optional(),
          lastName:         z.string().optional(),
          age:              z.number().optional(),
          city:             z.string().optional(),
          studyGoal:        z.string().optional(),
          proficiencyLevel: z.string().optional(),
          subjects:         z.array(z.string()).optional(),
          schedule:         z.array(z.string()).optional(),
          bio:              z.string().optional(),
          experience:       z.string().optional(),
          learningFormat:   z.string().optional(),
          communicationStyle: z.string().optional(),
          // Новые поля
          avatarUrl:        z.string().optional(),
          university:       z.string().optional(),
          program:          z.string().optional(),
          course:           z.string().optional(),
          messengerHandle:  z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const profile = await db.upsertProfile(ctx.user!.userId, {
            firstName:        input.firstName,
            lastName:         input.lastName,
            age:              input.age,
            city:             input.city,
            studyGoal:        input.studyGoal,
            proficiencyLevel: input.proficiencyLevel,
            subjects:         input.subjects,
            schedule:         input.schedule,
            bio:              input.bio,
            experience:       input.experience,
            learningFormat:   input.learningFormat,
            communicationStyle: input.communicationStyle,
            avatarUrl:        input.avatarUrl,
            university:       input.university,
            program:          input.program,
            course:           input.course,
            messengerHandle:  input.messengerHandle,
          });

          if (!profile) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to save profile",
            });
          }

          const preferences = await db.getPreferences(ctx.user!.userId);
          if (preferences) {
            await db.markProfileComplete(ctx.user!.userId);
          }

          return profile;
        }),

    updatePartnerPreferences: protectedProcedure
      .input(
        z.object({
          minAge: z.number().optional(),
          maxAge: z.number().optional(),
          preferredLevel: z.string().optional(),
          preferredSchedule: z.array(z.string()).optional(),
          learningFormat: z.string().optional(),
          communicationStyle: z.string().optional(),
          city: z.string().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const preferences = await db.upsertPreferences(ctx.user!.userId, {
          minAge: input.minAge,
          maxAge: input.maxAge,
          preferredLevel: input.preferredLevel,
          preferredSchedule: input.preferredSchedule,
          learningFormat: input.learningFormat,
          communicationStyle: input.communicationStyle,
          city: input.city,
        });

        if (!preferences) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to save partner preferences",
          });
        }

        const profile = await db.getProfile(ctx.user!.userId);
        if (profile) {
          await db.markProfileComplete(ctx.user!.userId);
        }

        return preferences;
      }),
  }),

  search: router({
    users: protectedProcedure.input(searchInput).query(async ({ input, ctx }) => {
      const currentUserId = ctx.user!.userId;

      const [currentProfile, currentPreferences, allUsers, allProfiles, favoriteIds] =
        await Promise.all([
          db.getProfile(currentUserId),
          db.getPreferences(currentUserId),
          db.getAllUsers(),
          db.getAllProfiles(),
          db.getUserFavorites(currentUserId),
        ]);

      const favoritesSet = new Set(favoriteIds);
      const profileMap = new Map(allProfiles.map((item) => [item.userId, item]));
      const normalizedQuery = input.query?.toLowerCase();
      const normalizedCity = input.city?.toLowerCase();
      const normalizedSubject = input.subject?.toLowerCase();
      const normalizedLevel = input.proficiencyLevel?.toLowerCase();

      const filtered = allUsers
        .filter((user) => user.id !== currentUserId)
        .filter((user) => (input.onlyCompleteProfiles ? user.isProfileComplete : true))
        .map((user) => {
          const profile = profileMap.get(user.id) ?? null;
          return { user, profile };
        })
        .filter(({ user, profile }) => {
          if (!profile) return !input.onlyCompleteProfiles;

          if (normalizedQuery) {
            const haystack = [
              profile.firstName,
              profile.lastName,
              profile.city,
              profile.studyGoal,
              profile.bio,
              profile.proficiencyLevel,
              ...(normalizeStringArray(profile.subjects) || []),
              user.email,
              user.telegramUsername,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            if (!haystack.includes(normalizedQuery)) return false;
          }

          if (normalizedCity && (profile.city || "").toLowerCase() !== normalizedCity) return false;

          if (
            normalizedSubject &&
            !normalizeStringArray(profile.subjects).some((item) =>
              item.toLowerCase().includes(normalizedSubject),
            )
          )
            return false;

          if (
            normalizedLevel &&
            (profile.proficiencyLevel || "").toLowerCase() !== normalizedLevel
          )
            return false;

          if (typeof input.minAge === "number" && (profile.age ?? -1) < input.minAge) return false;
          if (typeof input.maxAge === "number" && (profile.age ?? 999) > input.maxAge) return false;

          return true;
        });

      // Запрашиваем Groq для всех кандидатов параллельно (кэш в groq.ts предотвращает дубли)
      const items = (
        await Promise.all(
          filtered.map(async ({ user, profile }) => {
            const goalSimilarity = profile?.studyGoal
              ? await compareGoals(currentProfile?.studyGoal || "", profile.studyGoal)
              : 0.5;

            const compatibility = profile
              ? calculateCompatibility(currentProfile, currentPreferences, profile, goalSimilarity)
              : 0;

            return buildCandidateCard({
              user,
              profile,
              compatibility,
              isFavorite: favoritesSet.has(user.id),
            });
          }),
        )
      )
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .sort((a, b) => {
          if (b.compatibility !== a.compatibility) return b.compatibility - a.compatibility;
          return a.name.localeCompare(b.name);
        });

      const total = items.length;
      const paginated = items.slice(input.offset, input.offset + input.limit);

      return {
        items: paginated,
        total,
        limit: input.limit,
        offset: input.offset,
      };
    }),
  }),

  matching: router({
    getCandidates: protectedProcedure
      .input(
        z.object({
          limit: z.number().optional().default(50),
          offset: z.number().optional().default(0),
        }),
      )
      .query(async ({ input, ctx }) => {
        const result = await (appRouter as any).createCaller(ctx).search.users({
          limit: input.limit,
          offset: input.offset,
          onlyCompleteProfiles: true,
        });

        return result.items;
      }),

    getCandidate: protectedProcedure
      .input(z.object({ candidateId: z.number() }))
      .query(async ({ input, ctx }) => {
        const [user, profile, currentProfile, currentPreferences, isFavorite] = await Promise.all([
          db.getUserById(input.candidateId),
          db.getProfile(input.candidateId),
          db.getProfile(ctx.user!.userId),
          db.getPreferences(ctx.user!.userId),
          db.isFavorite(ctx.user!.userId, input.candidateId),
        ]);

        if (!user || !profile) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Candidate not found" });
        }

        const goalSimilarity = await compareGoals(
          currentProfile?.studyGoal || "",
          profile.studyGoal || "",
        );

        const compatibility = calculateCompatibility(
          currentProfile,
          currentPreferences,
          profile,
          goalSimilarity,
        );
        return buildCandidateCard({ user, profile, compatibility, isFavorite });
      }),
  }),

  favorites: router({
    like: protectedProcedure
      .input(z.object({ candidateId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (input.candidateId === ctx.user!.userId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot like yourself" });
        }

        const candidate = await db.getUserById(input.candidateId);
        if (!candidate) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Candidate not found" });
        }

        const favorite = await db.addFavorite(ctx.user!.userId, input.candidateId);
        return favorite;
      }),

    unlike: protectedProcedure
      .input(z.object({ candidateId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.removeFavorite(ctx.user!.userId, input.candidateId);
        return { success: true };
      }),

    getList: protectedProcedure.query(async ({ ctx }) => {
      const currentUserId = ctx.user!.userId;

      const [favoriteIds, allUsers, allProfiles, currentProfile, currentPreferences] =
        await Promise.all([
          db.getUserFavorites(currentUserId),
          db.getAllUsers(),
          db.getAllProfiles(),
          db.getProfile(currentUserId),
          db.getPreferences(currentUserId),
        ]);

      if (favoriteIds.length === 0) return [];

      const favSet = new Set(favoriteIds);
      const profileMap = new Map(allProfiles.map((p) => [p.userId, p]));

      const items = await Promise.all(
        allUsers
          .filter((u) => favSet.has(u.id))
          .map(async (user) => {
            const profile = profileMap.get(user.id) ?? null;
            const goalSimilarity = profile?.studyGoal
              ? await compareGoals(currentProfile?.studyGoal || "", profile.studyGoal)
              : 0.5;
            const compatibility = profile
              ? calculateCompatibility(currentProfile, currentPreferences, profile, goalSimilarity)
              : 0;
            return buildCandidateCard({ user, profile, compatibility, isFavorite: true });
          }),
      );

      return items.filter((item): item is NonNullable<typeof item> => Boolean(item));
    }),

    getAdmirers: protectedProcedure.query(async ({ ctx }) => {
      const currentUserId = ctx.user!.userId;

      const [admirerIds, allUsers, allProfiles, currentProfile, currentPreferences] =
        await Promise.all([
          db.getUserAdmirers(currentUserId),
          db.getAllUsers(),
          db.getAllProfiles(),
          db.getProfile(currentUserId),
          db.getPreferences(currentUserId),
        ]);

      if (admirerIds.length === 0) return [];

      const admireSet = new Set(admirerIds.map((item) => item.id));
      const profileMap = new Map(allProfiles.map((p) => [p.userId, p]));
      const myFavorites = new Set(await db.getUserFavorites(currentUserId));

      const items = await Promise.all(
        allUsers
          .filter((u) => admireSet.has(u.id))
          .map(async (user) => {
            const profile = profileMap.get(user.id) ?? null;
            const goalSimilarity = profile?.studyGoal
              ? await compareGoals(currentProfile?.studyGoal || "", profile.studyGoal)
              : 0.5;
            const compatibility = profile
              ? calculateCompatibility(currentProfile, currentPreferences, profile, goalSimilarity)
              : 0;
            return buildCandidateCard({
              user,
              profile,
              compatibility,
              isFavorite: myFavorites.has(user.id),
            });
          }),
      );

      return items.filter((item): item is NonNullable<typeof item> => Boolean(item));
    }),
  }),

  admin: router({
    getUsers: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user!.userId);
      if (user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      return await db.getAllUsersWithStats();
    }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user!.userId);
      if (user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const [allUsers, profiles] = await Promise.all([db.getAllUsers(), db.getAllProfiles()]);

      return {
        totalUsers: allUsers.length,
        profilesComplete: profiles.length,
        activeUsers: allUsers.filter(
          (item) =>
            item.updatedAt &&
            new Date(item.updatedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
        ).length,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
