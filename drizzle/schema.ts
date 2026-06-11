import { boolean, decimal, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  storeName: varchar("storeName", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  province: varchar("province", { length: 100 }).notNull(),
  foodCategory: varchar("foodCategory", { length: 100 }).notNull(),
  pdpaConsent: boolean("pdpaConsent").notNull().default(false),
  interestedWongnaiPos: boolean("interestedWongnaiPos").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

export const menuItems = pgTable("menuItems", {
  id: serial("id").primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  sellingPrice: decimal("sellingPrice", { precision: 10, scale: 2 }).notNull(),
  foodCost: decimal("foodCost", { precision: 10, scale: 2 }).notNull(),
  packagingCost: decimal("packagingCost", { precision: 10, scale: 2 }).notNull().default("0"),
  otherCost: decimal("otherCost", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;

export const gpSettings = pgTable("gpSettings", {
  id: serial("id").primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }).notNull().unique(),
  normalAvgPrice: decimal("normalAvgPrice", { precision: 10, scale: 2 }).notNull().default("0"),
  normalGpPercent: decimal("normalGpPercent", { precision: 5, scale: 2 }).notNull().default("30"),
  normalVatOnGp: decimal("normalVatOnGp", { precision: 5, scale: 2 }).notNull().default("7"),
  normalTotalCost: decimal("normalTotalCost", { precision: 10, scale: 2 }).notNull().default("0"),
  plusAvgPrice: decimal("plusAvgPrice", { precision: 10, scale: 2 }).notNull().default("0"),
  plusGpPercent: decimal("plusGpPercent", { precision: 5, scale: 2 }).notNull().default("23"),
  plusVatOnGp: decimal("plusVatOnGp", { precision: 5, scale: 2 }).notNull().default("7"),
  plusTotalCost: decimal("plusTotalCost", { precision: 10, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type GpSettings = typeof gpSettings.$inferSelect;
export type InsertGpSettings = typeof gpSettings.$inferInsert;

export const dailyLogs = pgTable("dailyLogs", {
  id: serial("id").primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  logDate: varchar("logDate", { length: 10 }).notNull(),
  normalOrders: integer("normalOrders").notNull().default(0),
  plusOrders: integer("plusOrders").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type DailyLog = typeof dailyLogs.$inferSelect;
export type InsertDailyLog = typeof dailyLogs.$inferInsert;
