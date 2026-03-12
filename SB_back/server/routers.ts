import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import * as db from "./db";
import * as auth from "./auth";
import { TRPCError } from "@trpc/server";

/**
 * Matching algorithm: Calculate compatibility between two users
 */
function calculateCompatibility(user1Profile: any, user1Prefs: any, user2Profile: any): number {
  let score = 0;
  let maxScore = 0;

  // Age compatibility (if preferences exist)
  if (user1Prefs?.minAge && user1Prefs?.maxAge) {
    maxScore += 20;
    const age = user2Profile?.age || 0;
    if (age >= user1Prefs.minAge && age <= user1Prefs.maxAge) {
      score += 20;
    }
  }

  // Proficiency level compatibility
  if (user1Prefs?.preferredLevel && user2Profile?.proficiencyLevel) {
    maxScore += 15;
    if (user1Prefs.preferredLevel === user2Profile.proficiencyLevel || user1Prefs.preferredLevel === "Any") {
      score += 15;
    }
  }

  // Schedule compatibility
  if (user1Prefs?.preferredSchedule && user2Profile?.schedule) {
    maxScore += 15;
    const user2Schedule = Array.isArray(user2Profile.schedule) ? user2Profile.schedule : [];
    const commonSchedule = (user1Prefs.preferredSchedule as string[]).filter((s: string) =>
      user2Schedule.includes(s)
    );
    if (commonSchedule.length > 0) {
      score += 15;
    }
  }

  // Learning format compatibility
  if (user1Prefs?.learningFormat && user2Profile?.subjects) {
    maxScore += 10;
    score += 10; // Simplified for now
  }

  // Communication style compatibility
  if (user1Prefs?.communicationStyle) {
    maxScore += 10;
    score += 10; // Simplified for now
  }

  // Study goals compatibility
  if (user1Profile?.studyGoals && user2Profile?.studyGoals) {
    maxScore += 15;
    const commonGoals = (user1Profile.studyGoals as string[]).filter((g: string) =>
      (user2Profile.studyGoals as string[]).includes(g)
    );
    if (commonGoals.length > 0) {
      score += Math.min(15, commonGoals.length * 5);
    }
  }

  // Subjects compatibility
  if (user1Profile?.subjects && user2Profile?.subjects) {
    maxScore += 15;
    const commonSubjects = (user1Profile.subjects as string[]).filter((s: string) =>
      (user2Profile.subjects as string[]).includes(s)
    );
    if (commonSubjects.length > 0) {
      score += Math.min(15, commonSubjects.length * 5);
    }
  }

  // City compatibility
  if (user1Prefs?.city && user2Profile?.city) {
    maxScore += 5;
    if (user1Prefs.city === user2Profile.city) {
      score += 5;
    }
  }

  if (maxScore === 0) return 50; // Default score if no preferences
  return Math.round((score / maxScore) * 100);
}

export const appRouter = router({
  // ==================== AUTH ====================
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      const user = await db.getUserById(ctx.user.userId);
      return user;
    }),

    register: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6),
          telegramUsername: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Check if user already exists
        const existing = await db.getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User already exists",
          });
        }

        // Hash password
        const passwordHash = await auth.hashPassword(input.password);

        // Create user
        const user = await db.createUser(input.email, passwordHash, input.telegramUsername);
        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create user",
          });
        }

        // Create JWT token
        const token = await auth.createToken(user.id, user.email);

        // Set session cookie
        auth.setSessionCookie(ctx.res, ctx.req, user.id, user.email);

        return { user, token };
      }),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // Verify password
        const isValid = await auth.verifyPassword(input.password, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid password",
          });
        }

        // Create JWT token
        const token = await auth.createToken(user.id, user.email);

        // Set session cookie
        auth.setSessionCookie(ctx.res, ctx.req, user.id, user.email);

        return { user, token };
      }),

    logout: protectedProcedure.mutation(({ ctx }) => {
      const cookieOptions = auth.getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("session", { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
  }),

  // ==================== PROFILE ====================
  profile: router({
    getMe: protectedProcedure.query(async ({ ctx }) => {
      const profile = await db.getProfile(ctx.user!.userId);
      const preferences = await db.getPreferences(ctx.user!.userId);
      return { profile, preferences };
    }),

    updateAboutMe: protectedProcedure
      .input(
        z.object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          age: z.number().optional(),
          city: z.string().optional(),
          studyGoal: z.string().optional(),
          proficiencyLevel: z.string().optional(),
          subjects: z.array(z.string()).optional(),
          schedule: z.array(z.string()).optional(),
          bio: z.string().optional(),
          experience: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const profile = await db.upsertProfile(ctx.user!.userId, {
          firstName: input.firstName,
          lastName: input.lastName,
          age: input.age,
          city: input.city,
          studyGoal: input.studyGoal,
          proficiencyLevel: input.proficiencyLevel,
          subjects: (input.subjects ? JSON.stringify(input.subjects) : JSON.stringify([])) as any,
          schedule: (input.schedule ? JSON.stringify(input.schedule) : JSON.stringify([])) as any,
          bio: input.bio,
          experience: input.experience,
        });

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
        })
      )
      .mutation(async ({ input, ctx }) => {
        const preferences = await db.upsertPreferences(ctx.user!.userId, {
          minAge: input.minAge,
          maxAge: input.maxAge,
          preferredLevel: input.preferredLevel,
          preferredSchedule: (input.preferredSchedule ? JSON.stringify(input.preferredSchedule) : JSON.stringify([])) as any,
          learningFormat: input.learningFormat,
          communicationStyle: input.communicationStyle,
        });

        // Mark profile as complete if both profile and preferences are filled
        const profile = await db.getProfile(ctx.user!.userId);
        if (profile && preferences) {
          await db.markProfileComplete(ctx.user!.userId);
        }

        return preferences;
      }),
  }),

  // ==================== MATCHING & CANDIDATES ====================
  matching: router({
    getCandidates: protectedProcedure
      .input(
        z.object({
          limit: z.number().optional().default(50),
          offset: z.number().optional().default(0),
        })
      )
      .query(async ({ input, ctx }) => {
        const currentUser = await db.getUserById(ctx.user!.userId);
        const currentProfile = await db.getProfile(ctx.user!.userId);
        const currentPreferences = await db.getPreferences(ctx.user!.userId);

        if (!currentProfile || !currentPreferences) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Profile and preferences not complete",
          });
        }

        // Get all users except current user
        const allUsers = await db.getAllUsers();
        const otherUsers = allUsers.filter((u) => u.id !== ctx.user!.userId);

        // Get all profiles
        const allProfiles = await db.getAllProfiles();

        // Calculate compatibility for each user
        const candidates = await Promise.all(
          otherUsers.map(async (user) => {
            const profile = allProfiles.find((p) => p.userId === user.id);
            const compatibility = calculateCompatibility(
              currentProfile,
              currentPreferences,
              profile
            );

            return {
              id: user.id,
              name: profile?.firstName ? `${profile.firstName} ${profile.lastName || ""}`.trim() : "Unknown",
              age: profile?.age || 0,
              city: profile?.city || "",
              compatibility,
              university: profile?.studyGoal || "",
              course: "",
              goal: profile?.studyGoal || "",
              goalDescription: profile?.bio || "",
              telegram: user.telegramUsername || "",
              avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face",
            };
          })
        );

        // Sort by compatibility descending
        candidates.sort((a, b) => b.compatibility - a.compatibility);

        return candidates.slice(input.offset, input.offset + input.limit);
      }),

    getCandidate: protectedProcedure
      .input(z.object({ candidateId: z.number() }))
      .query(async ({ input, ctx }) => {
        const user = await db.getUserById(input.candidateId);
        const profile = await db.getProfile(input.candidateId);
        const currentProfile = await db.getProfile(ctx.user!.userId);
        const currentPreferences = await db.getPreferences(ctx.user!.userId);

        if (!user || !profile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Candidate not found",
          });
        }

        const compatibility = calculateCompatibility(
          currentProfile,
          currentPreferences,
          profile
        );

        return {
          id: user.id,
          name: `${profile.firstName} ${profile.lastName || ""}`.trim(),
          age: profile.age || 0,
          city: profile.city || "",
          compatibility,
          university: profile.studyGoal || "",
          course: "",
          goal: profile.studyGoal || "",
          goalDescription: profile.bio || "",
          telegram: user.telegramUsername || "",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face",
          proficiencyLevel: profile.proficiencyLevel || "",
          subjects: profile.subjects ? JSON.parse(JSON.stringify(profile.subjects)) : [],
          schedule: profile.schedule ? JSON.parse(JSON.stringify(profile.schedule)) : [],
        };
      }),
  }),

  // ==================== FAVORITES & LIKES ====================
  favorites: router({
    like: protectedProcedure
      .input(z.object({ candidateId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const favorite = await db.addFavorite(ctx.user!.userId, input.candidateId);
        return favorite;
      }),

    unlike: protectedProcedure
      .input(z.object({ candidateId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const success = await db.removeFavorite(ctx.user!.userId, input.candidateId);
        return { success };
      }),

    getMyFavorites: protectedProcedure.query(async ({ ctx }) => {
      const favoriteIds = await db.getUserFavorites(ctx.user!.userId);
      const favorites = await Promise.all(
        favoriteIds.map(async (id) => {
          const user = await db.getUserById(id);
          const profile = await db.getProfile(id);
          return {
            id: user?.id,
            name: profile?.firstName ? `${profile.firstName} ${profile.lastName || ""}`.trim() : "Unknown",
            age: profile?.age || 0,
            city: profile?.city || "",
            telegram: user?.telegramUsername || "",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face",
          };
        })
      );
      return favorites;
    }),

    getAdmirers: protectedProcedure.query(async ({ ctx }) => {
      const admirers = await db.getUserAdmirers(ctx.user!.userId);
      const admirersWithProfiles = await Promise.all(
        admirers.map(async (user) => {
          const profile = await db.getProfile(user.id);
          return {
            id: user.id,
            name: profile?.firstName ? `${profile.firstName} ${profile.lastName || ""}`.trim() : "Unknown",
            age: profile?.age || 0,
            city: profile?.city || "",
            telegram: user.telegramUsername || "",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face",
          };
        })
      );
      return admirersWithProfiles;
    }),
  }),

  // ==================== ADMIN ====================
  admin: router({
    getAllUsers: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user!.userId);
      if (user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      return await db.getAllUsersWithStats();
    }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user!.userId);
      if (user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const allUsers = await db.getAllUsers();
      const profiles = await db.getAllProfiles();

      return {
        totalUsers: allUsers.length,
        profilesComplete: profiles.length,
        activeUsers: allUsers.filter((u) => u.updatedAt && new Date(u.updatedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
