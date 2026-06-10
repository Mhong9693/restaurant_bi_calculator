import { eq, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, leads, InsertLead, menuItems, InsertMenuItem, gpSettings, InsertGpSettings, dailyLogs, InsertDailyLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Leads helpers
export async function createLead(lead: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(leads).values(lead);
  return result;
}

export async function getLeadByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leads).where(eq(leads.phone, phone)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllLeads() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).orderBy(leads.createdAt);
}

// Menu items helpers
export async function getMenuItemsBySession(sessionId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menuItems).where(eq(menuItems.sessionId, sessionId));
}

export async function createMenuItem(item: InsertMenuItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(menuItems).values(item);
}

export async function deleteMenuItem(id: number, sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(menuItems).where(eq(menuItems.id, id));
}

export async function clearMenuItemsBySession(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(menuItems).where(eq(menuItems.sessionId, sessionId));
}

// GP Settings helpers
export async function getGpSettings(sessionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(gpSettings).where(eq(gpSettings.sessionId, sessionId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertGpSettings(settings: InsertGpSettings) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(gpSettings).values(settings).onDuplicateKeyUpdate({
    set: {
      normalAvgPrice: settings.normalAvgPrice,
      normalGpPercent: settings.normalGpPercent,
      normalVatOnGp: settings.normalVatOnGp,
      normalTotalCost: settings.normalTotalCost,
      plusAvgPrice: settings.plusAvgPrice,
      plusGpPercent: settings.plusGpPercent,
      plusVatOnGp: settings.plusVatOnGp,
      plusTotalCost: settings.plusTotalCost,
    },
  });
}

// Daily Log helpers
export async function upsertDailyLog(log: InsertDailyLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Check if exists for this session+date
  const existing = await db.select().from(dailyLogs)
    .where(and(eq(dailyLogs.sessionId, log.sessionId), eq(dailyLogs.logDate, log.logDate as string)))
    .limit(1);
  if (existing.length > 0) {
    await db.update(dailyLogs)
      .set({ normalOrders: log.normalOrders, plusOrders: log.plusOrders })
      .where(and(eq(dailyLogs.sessionId, log.sessionId), eq(dailyLogs.logDate, log.logDate as string)));
  } else {
    await db.insert(dailyLogs).values(log);
  }
}

export async function getDailyLogsBySession(sessionId: string, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return [];
  if (startDate && endDate) {
    return db.select().from(dailyLogs)
      .where(and(
        eq(dailyLogs.sessionId, sessionId),
        gte(dailyLogs.logDate, startDate),
        lte(dailyLogs.logDate, endDate)
      ))
      .orderBy(dailyLogs.logDate);
  }
  return db.select().from(dailyLogs)
    .where(eq(dailyLogs.sessionId, sessionId))
    .orderBy(dailyLogs.logDate);
}

export async function getDailyLogByDate(sessionId: string, logDate: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(dailyLogs)
    .where(and(eq(dailyLogs.sessionId, sessionId), eq(dailyLogs.logDate, logDate)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}
