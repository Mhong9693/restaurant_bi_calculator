import { boolean, decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Leads table for feature gate registration
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  storeName: varchar("storeName", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  province: varchar("province", { length: 100 }).notNull(),
  foodCategory: varchar("foodCategory", { length: 100 }).notNull(),
  pdpaConsent: boolean("pdpaConsent").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// Menu items table for menu analysis
export const menuItems = mysqlTable("menuItems", {
  id: int("id").autoincrement().primaryKey(),
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

// GP Settings per session
// GP% = ค่า Commission ที่แพลตฟอร์มหักจากร้านค้า คำนวณจากราคาก่อนส่วนลด
// รายรับสุทธิ = ราคาหลังส่วนลด - (GP% × ราคาก่อนส่วนลด) × (1 + VAT%)
export const gpSettings = mysqlTable("gpSettings", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }).notNull().unique(),
  // Normal channel
  normalAvgPrice: decimal("normalAvgPrice", { precision: 10, scale: 2 }).notNull().default("0"),
  normalGpPercent: decimal("normalGpPercent", { precision: 5, scale: 2 }).notNull().default("30"),
  normalVatOnGp: decimal("normalVatOnGp", { precision: 5, scale: 2 }).notNull().default("7"),
  normalTotalCost: decimal("normalTotalCost", { precision: 10, scale: 2 }).notNull().default("0"),
  // LINE MAN Plus channel
  plusAvgPrice: decimal("plusAvgPrice", { precision: 10, scale: 2 }).notNull().default("0"),
  plusGpPercent: decimal("plusGpPercent", { precision: 5, scale: 2 }).notNull().default("23"),
  plusVatOnGp: decimal("plusVatOnGp", { precision: 5, scale: 2 }).notNull().default("7"),
  plusTotalCost: decimal("plusTotalCost", { precision: 10, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GpSettings = typeof gpSettings.$inferSelect;
export type InsertGpSettings = typeof gpSettings.$inferInsert;

// Daily order log — records orders per channel per day
export const dailyLogs = mysqlTable("dailyLogs", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  logDate: varchar("logDate", { length: 10 }).notNull(), // YYYY-MM-DD
  normalOrders: int("normalOrders").notNull().default(0),
  plusOrders: int("plusOrders").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyLog = typeof dailyLogs.$inferSelect;
export type InsertDailyLog = typeof dailyLogs.$inferInsert;
