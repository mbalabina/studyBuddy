import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

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

export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  firstName: varchar("firstName", { length: 255 }),
  lastName: varchar("lastName", { length: 255 }),
  age: int("age"),
  city: varchar("city", { length: 255 }),
  studyGoal: varchar("studyGoal", { length: 255 }),
  proficiencyLevel: varchar("proficiencyLevel", { length: 100 }),
  subjects: json("subjects").$type<string[]>().notNull(),
  schedule: json("schedule").$type<string[]>().notNull(),
  motivation: json("motivation").$type<string[]>(),
  learningStyle: json("learningStyle").$type<string[]>(),
  additionalGoals: json("additionalGoals").$type<string[]>(),
  organization: int("organization"),
  sociability: int("sociability"),
  friendliness: int("friendliness"),
  stressResistance: int("stressResistance"),
  bio: text("bio"),
  experience: varchar("experience", { length: 255 }),
  learningFormat: varchar("learningFormat", { length: 100 }),
  communicationStyle: varchar("communicationStyle", { length: 100 }),
  // Новые поля
  avatarUrl: text("avatarUrl"),       // base64 JPEG 256×256 (~15KB); на проде — заменить на S3 URL
  university: varchar("university", { length: 255 }),
  program: varchar("program", { length: 255 }),
  course: varchar("course", { length: 100 }),
  messengerHandle: varchar("messengerHandle", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

export const preferences = mysqlTable("preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  minAge: int("minAge"),
  maxAge: int("maxAge"),
  preferredLevel: varchar("preferredLevel", { length: 100 }),
  preferredSchedule: json("preferredSchedule").$type<string[]>().default([]).notNull(),
  learningFormat: varchar("learningFormat", { length: 100 }),
  communicationStyle: varchar("communicationStyle", { length: 100 }),
  city: varchar("city", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Preference = typeof preferences.$inferSelect;
export type InsertPreference = typeof preferences.$inferInsert;

export const userStudyGoals = mysqlTable("userStudyGoals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserStudyGoal = typeof userStudyGoals.$inferSelect;
export type InsertUserStudyGoal = typeof userStudyGoals.$inferInsert;

export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  favoriteUserId: int("favoriteUserId").notNull(),
  goalId: int("goalId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

export const emailNotifications = mysqlTable("emailNotifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  notificationType: varchar("notificationType", { length: 64 }).notNull(),
  notificationKey: varchar("notificationKey", { length: 255 }).notNull().unique(),
  payload: json("payload").$type<Record<string, unknown> | null>(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailNotification = typeof emailNotifications.$inferSelect;
export type InsertEmailNotification = typeof emailNotifications.$inferInsert;

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  preferences: one(preferences, { fields: [users.id], references: [preferences.userId] }),
  studyGoals: many(userStudyGoals),
  favorites: many(favorites),
  emailNotifications: many(emailNotifications),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const preferencesRelations = relations(preferences, ({ one }) => ({
  user: one(users, { fields: [preferences.userId], references: [users.id] }),
}));

export const userStudyGoalsRelations = relations(userStudyGoals, ({ one }) => ({
  user: one(users, { fields: [userStudyGoals.userId], references: [users.id] }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  favoriteUser: one(users, { fields: [favorites.favoriteUserId], references: [users.id] }),
  goal: one(userStudyGoals, { fields: [favorites.goalId], references: [userStudyGoals.id] }),
}));

export const emailNotificationsRelations = relations(emailNotifications, ({ one }) => ({
  user: one(users, { fields: [emailNotifications.userId], references: [users.id] }),
}));
