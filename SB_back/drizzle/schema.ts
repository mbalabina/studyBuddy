import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, decimal } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table for Study Buddy app.
 * Stores authentication and basic user info.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  telegramUsername: varchar("telegramUsername", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isProfileComplete: boolean("isProfileComplete").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User profile - "About Me" section
 */
export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  firstName: varchar("firstName", { length: 255 }),
  lastName: varchar("lastName", { length: 255 }),
  age: int("age"),
  city: varchar("city", { length: 255 }),
  studyGoal: varchar("studyGoal", { length: 255 }),
  proficiencyLevel: varchar("proficiencyLevel", { length: 100 }), // Beginner, Intermediate, Advanced
  subjects: json("subjects").$type<string[]>().notNull(), // JSON array of subjects
  schedule: json("schedule").$type<string[]>().notNull(), // JSON array of available times
  bio: text("bio"),
  experience: varchar("experience", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

/**
 * User preferences - "Partner Preferences" section
 */
export const preferences = mysqlTable("preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  minAge: int("minAge"),
  maxAge: int("maxAge"),
  preferredLevel: varchar("preferredLevel", { length: 100 }), // Any, Beginner, Intermediate, Advanced
  preferredSchedule: json("preferredSchedule").$type<string[]>().default([]).notNull(),
  learningFormat: varchar("learningFormat", { length: 100 }), // Online, Offline, Both
  communicationStyle: varchar("communicationStyle", { length: 100 }), // Friendly, Formal, Casual
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Preference = typeof preferences.$inferSelect;
export type InsertPreference = typeof preferences.$inferInsert;

/**
 * Favorites - users that I liked
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Who liked
  favoriteUserId: int("favoriteUserId").notNull(), // Who was liked
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * Relations for type safety
 */
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  preferences: one(preferences, {
    fields: [users.id],
    references: [preferences.userId],
  }),
  favorites: many(favorites),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const preferencesRelations = relations(preferences, ({ one }) => ({
  user: one(users, {
    fields: [preferences.userId],
    references: [users.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  favoriteUser: one(users, {
    fields: [favorites.favoriteUserId],
    references: [users.id],
  }),
}));