import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const profile = sqliteTable("guild_profile", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().default("Aventureiro"),
  xp: integer("xp").notNull().default(0),
  copper: integer("copper").notNull().default(0),
});
export const quests = sqliteTable("guild_quests", {
  id: text("id").primaryKey(),
  month: text("month").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  minutes: integer("minutes").notNull(),
  xp: integer("xp").notNull(),
  copper: integer("copper").notNull(),
  status: text("status").notNull().default("available"),
  completedAt: text("completed_at"),
});
export const rewards = sqliteTable("guild_rewards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: integer("price").notNull(),
  custom: integer("custom", { mode: "boolean" }).notNull().default(false),
});
export const purchases = sqliteTable("guild_purchases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rewardId: integer("reward_id"),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  purchasedAt: text("purchased_at").notNull(),
});
export const achievements = sqliteTable("guild_achievements", {
  id: text("id").primaryKey(),
  contract: text("contract").notNull(),
  period: text("period").notNull(),
  xp: integer("xp").notNull(),
  copper: integer("copper").notNull(),
  completedAt: text("completed_at").notNull(),
});
