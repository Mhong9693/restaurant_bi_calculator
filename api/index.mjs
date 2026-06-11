// server/vercel.ts
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";

// server/db.ts
import { eq, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// drizzle/schema.ts
import { boolean, decimal, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
var roleEnum = pgEnum("role", ["user", "admin"]);
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  storeName: varchar("storeName", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  province: varchar("province", { length: 100 }).notNull(),
  foodCategory: varchar("foodCategory", { length: 100 }).notNull(),
  pdpaConsent: boolean("pdpaConsent").notNull().default(false),
  interestedWongnaiPos: boolean("interestedWongnaiPos").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var menuItems = pgTable("menuItems", {
  id: serial("id").primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  sellingPrice: decimal("sellingPrice", { precision: 10, scale: 2 }).notNull(),
  foodCost: decimal("foodCost", { precision: 10, scale: 2 }).notNull(),
  packagingCost: decimal("packagingCost", { precision: 10, scale: 2 }).notNull().default("0"),
  otherCost: decimal("otherCost", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var gpSettings = pgTable("gpSettings", {
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
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
});
var dailyLogs = pgTable("dailyLogs", {
  id: serial("id").primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  logDate: varchar("logDate", { length: 10 }).notNull(),
  normalOrders: integer("normalOrders").notNull().default(0),
  plusOrders: integer("plusOrders").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
});

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = { openId: user.openId };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    }
    if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createLead(lead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(leads).values(lead);
}
async function getLeadByPhone(phone) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(leads).where(eq(leads.phone, phone)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllLeads() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).orderBy(leads.createdAt);
}
async function getMenuItemsBySession(sessionId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menuItems).where(eq(menuItems.sessionId, sessionId));
}
async function createMenuItem(item) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(menuItems).values(item);
}
async function deleteMenuItem(id, sessionId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(menuItems).where(and(eq(menuItems.id, id), eq(menuItems.sessionId, sessionId)));
}
async function clearMenuItemsBySession(sessionId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(menuItems).where(eq(menuItems.sessionId, sessionId));
}
async function getGpSettings(sessionId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(gpSettings).where(eq(gpSettings.sessionId, sessionId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function upsertGpSettings(settings) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(gpSettings).values(settings).onConflictDoUpdate({
    target: gpSettings.sessionId,
    set: {
      normalAvgPrice: settings.normalAvgPrice,
      normalGpPercent: settings.normalGpPercent,
      normalVatOnGp: settings.normalVatOnGp,
      normalTotalCost: settings.normalTotalCost,
      plusAvgPrice: settings.plusAvgPrice,
      plusGpPercent: settings.plusGpPercent,
      plusVatOnGp: settings.plusVatOnGp,
      plusTotalCost: settings.plusTotalCost,
      updatedAt: /* @__PURE__ */ new Date()
    }
  });
}
async function upsertDailyLog(log) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(dailyLogs).where(and(eq(dailyLogs.sessionId, log.sessionId), eq(dailyLogs.logDate, log.logDate))).limit(1);
  if (existing.length > 0) {
    await db.update(dailyLogs).set({ normalOrders: log.normalOrders, plusOrders: log.plusOrders, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(dailyLogs.sessionId, log.sessionId), eq(dailyLogs.logDate, log.logDate)));
  } else {
    await db.insert(dailyLogs).values(log);
  }
}
async function getDailyLogsBySession(sessionId, startDate, endDate) {
  const db = await getDb();
  if (!db) return [];
  if (startDate && endDate) {
    return db.select().from(dailyLogs).where(and(eq(dailyLogs.sessionId, sessionId), gte(dailyLogs.logDate, startDate), lte(dailyLogs.logDate, endDate))).orderBy(dailyLogs.logDate);
  }
  return db.select().from(dailyLogs).where(eq(dailyLogs.sessionId, sessionId)).orderBy(dailyLogs.logDate);
}
async function getDailyLogByDate(sessionId, logDate) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(dailyLogs).where(and(eq(dailyLogs.sessionId, sessionId), eq(dailyLogs.logDate, logDate))).limit(1);
  return result.length > 0 ? result[0] : void 0;
}

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/_core/sdk.ts
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/googleSheets.ts
import { google } from "googleapis";
var SPREADSHEET_ID = process.env.SPREADSHEET_ID ?? "1REwJa64uh0fCMJx5KtHTuvDVYeSYZTKsI6liR3zdaes";
var SHEET_NAME = "Leads";
async function appendLeadToSheet(lead) {
  try {
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!credentialsJson) {
      console.warn("[GoogleSheets] GOOGLE_SERVICE_ACCOUNT_JSON not set \u2014 skipping sheet sync");
      return;
    }
    const credentials = JSON.parse(credentialsJson);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });
    const sheets = google.sheets({ version: "v4", auth });
    const now = (/* @__PURE__ */ new Date()).toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    const row = [
      now,
      lead.storeName,
      lead.phone,
      lead.province,
      lead.foodCategory,
      lead.pdpaConsent ? "\u0E22\u0E34\u0E19\u0E22\u0E2D\u0E21" : "\u0E44\u0E21\u0E48\u0E22\u0E34\u0E19\u0E22\u0E2D\u0E21",
      lead.interestedWongnaiPos ? "\u2705 \u0E2A\u0E19\u0E43\u0E08" : "\u274C \u0E44\u0E21\u0E48\u0E2A\u0E19\u0E43\u0E08"
    ];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:G`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] }
    });
    console.log(`[GoogleSheets] Lead appended: ${lead.storeName} (${lead.phone})`);
  } catch (error) {
    console.error("[GoogleSheets] Failed to append lead to sheet:", error);
  }
}

// server/routers.ts
import { z as z2 } from "zod";
var leadSchema = z2.object({
  storeName: z2.string().min(1, "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E23\u0E49\u0E32\u0E19"),
  phone: z2.string().min(9, "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23\u0E28\u0E31\u0E1E\u0E17\u0E4C\u0E17\u0E35\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07"),
  province: z2.string().min(1, "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E31\u0E07\u0E2B\u0E27\u0E31\u0E14"),
  foodCategory: z2.string().min(1, "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E2D\u0E32\u0E2B\u0E32\u0E23"),
  pdpaConsent: z2.boolean().refine((v) => v === true, "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E22\u0E34\u0E19\u0E22\u0E2D\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02 PDPA"),
  interestedWongnaiPos: z2.boolean().default(false)
});
var menuItemSchema = z2.object({
  sessionId: z2.string().min(1),
  name: z2.string().min(1, "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E21\u0E19\u0E39"),
  sellingPrice: z2.number().positive("\u0E23\u0E32\u0E04\u0E32\u0E02\u0E32\u0E22\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32 0"),
  foodCost: z2.number().min(0, "\u0E15\u0E49\u0E19\u0E17\u0E38\u0E19\u0E27\u0E31\u0E15\u0E16\u0E38\u0E14\u0E34\u0E1A\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E15\u0E34\u0E14\u0E25\u0E1A"),
  packagingCost: z2.number().min(0).default(0),
  otherCost: z2.number().min(0).default(0)
});
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  leads: router({
    submit: publicProcedure.input(leadSchema).mutation(async ({ input }) => {
      const existing = await getLeadByPhone(input.phone);
      if (existing) {
        return { success: true, alreadyExists: true, message: "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23\u0E19\u0E35\u0E49\u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E41\u0E25\u0E49\u0E27" };
      }
      await createLead({
        storeName: input.storeName,
        phone: input.phone,
        province: input.province,
        foodCategory: input.foodCategory,
        pdpaConsent: input.pdpaConsent,
        interestedWongnaiPos: input.interestedWongnaiPos ?? false
      });
      try {
        await appendLeadToSheet({
          storeName: input.storeName,
          phone: input.phone,
          province: input.province,
          foodCategory: input.foodCategory,
          pdpaConsent: input.pdpaConsent,
          interestedWongnaiPos: input.interestedWongnaiPos ?? false
        });
      } catch (e) {
        console.warn("[GoogleSheets] Sync failed (non-fatal):", e);
      }
      try {
        await notifyOwner({
          title: `\u{1F389} Lead \u0E43\u0E2B\u0E21\u0E48: ${input.storeName}`,
          content: `\u0E23\u0E49\u0E32\u0E19: ${input.storeName}
\u0E40\u0E1A\u0E2D\u0E23\u0E4C: ${input.phone}
\u0E08\u0E31\u0E07\u0E2B\u0E27\u0E31\u0E14: ${input.province}
\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E2D\u0E32\u0E2B\u0E32\u0E23: ${input.foodCategory}
\u0E2A\u0E19\u0E43\u0E08 Wongnai POS: ${input.interestedWongnaiPos ? "\u2705 \u0E43\u0E0A\u0E48" : "\u274C \u0E44\u0E21\u0E48"}
\u0E40\u0E27\u0E25\u0E32: ${(/* @__PURE__ */ new Date()).toLocaleString("th-TH")}`
        });
      } catch (e) {
        console.warn("[Notification] Failed to notify owner:", e);
      }
      return { success: true, alreadyExists: false, message: "\u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08! \u0E1B\u0E25\u0E14\u0E25\u0E47\u0E2D\u0E01\u0E1F\u0E35\u0E40\u0E08\u0E2D\u0E23\u0E4C\u0E02\u0E31\u0E49\u0E19\u0E2A\u0E39\u0E07\u0E41\u0E25\u0E49\u0E27" };
    }),
    checkAccess: publicProcedure.input(z2.object({ phone: z2.string() })).query(async ({ input }) => {
      if (!input.phone) return { hasAccess: false };
      const lead = await getLeadByPhone(input.phone);
      return { hasAccess: !!lead, lead: lead ?? null };
    }),
    list: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user || ctx.user.role !== "admin") return [];
      return getAllLeads();
    })
  }),
  menuItems: router({
    list: publicProcedure.input(z2.object({ sessionId: z2.string() })).query(async ({ input }) => {
      const items = await getMenuItemsBySession(input.sessionId);
      return items.map((item) => ({
        ...item,
        sellingPrice: Number(item.sellingPrice),
        foodCost: Number(item.foodCost),
        packagingCost: Number(item.packagingCost),
        otherCost: Number(item.otherCost)
      }));
    }),
    add: publicProcedure.input(menuItemSchema).mutation(async ({ input }) => {
      await createMenuItem({
        sessionId: input.sessionId,
        name: input.name,
        sellingPrice: String(input.sellingPrice),
        foodCost: String(input.foodCost),
        packagingCost: String(input.packagingCost),
        otherCost: String(input.otherCost)
      });
      return { success: true };
    }),
    remove: publicProcedure.input(z2.object({ id: z2.number(), sessionId: z2.string() })).mutation(async ({ input }) => {
      await deleteMenuItem(input.id, input.sessionId);
      return { success: true };
    }),
    clear: publicProcedure.input(z2.object({ sessionId: z2.string() })).mutation(async ({ input }) => {
      await clearMenuItemsBySession(input.sessionId);
      return { success: true };
    })
  }),
  gpSettings: router({
    get: publicProcedure.input(z2.object({ sessionId: z2.string() })).query(async ({ input }) => {
      const s = await getGpSettings(input.sessionId);
      if (!s) return null;
      return {
        ...s,
        normalAvgPrice: Number(s.normalAvgPrice),
        normalGpPercent: Number(s.normalGpPercent),
        normalVatOnGp: Number(s.normalVatOnGp),
        normalTotalCost: Number(s.normalTotalCost),
        plusAvgPrice: Number(s.plusAvgPrice),
        plusGpPercent: Number(s.plusGpPercent),
        plusVatOnGp: Number(s.plusVatOnGp),
        plusTotalCost: Number(s.plusTotalCost)
      };
    }),
    save: publicProcedure.input(z2.object({
      sessionId: z2.string().min(1),
      normalAvgPrice: z2.number().min(0),
      normalGpPercent: z2.number().min(0).max(100),
      normalVatOnGp: z2.number().min(0).max(100),
      normalTotalCost: z2.number().min(0),
      plusAvgPrice: z2.number().min(0),
      plusGpPercent: z2.number().min(0).max(100),
      plusVatOnGp: z2.number().min(0).max(100),
      plusTotalCost: z2.number().min(0)
    })).mutation(async ({ input }) => {
      await upsertGpSettings({
        sessionId: input.sessionId,
        normalAvgPrice: String(input.normalAvgPrice),
        normalGpPercent: String(input.normalGpPercent),
        normalVatOnGp: String(input.normalVatOnGp),
        normalTotalCost: String(input.normalTotalCost),
        plusAvgPrice: String(input.plusAvgPrice),
        plusGpPercent: String(input.plusGpPercent),
        plusVatOnGp: String(input.plusVatOnGp),
        plusTotalCost: String(input.plusTotalCost)
      });
      return { success: true };
    })
  }),
  dailyLogs: router({
    getByDate: publicProcedure.input(z2.object({ sessionId: z2.string(), logDate: z2.string() })).query(async ({ input }) => {
      const log = await getDailyLogByDate(input.sessionId, input.logDate);
      if (!log) return null;
      return { ...log, normalOrders: Number(log.normalOrders), plusOrders: Number(log.plusOrders) };
    }),
    getRange: publicProcedure.input(z2.object({
      sessionId: z2.string(),
      startDate: z2.string().optional(),
      endDate: z2.string().optional()
    })).query(async ({ input }) => {
      const logs = await getDailyLogsBySession(input.sessionId, input.startDate, input.endDate);
      return logs.map((l) => ({ ...l, normalOrders: Number(l.normalOrders), plusOrders: Number(l.plusOrders) }));
    }),
    save: publicProcedure.input(z2.object({
      sessionId: z2.string().min(1),
      logDate: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/, "\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19 YYYY-MM-DD"),
      normalOrders: z2.number().int().min(0),
      plusOrders: z2.number().int().min(0)
    })).mutation(async ({ input }) => {
      await upsertDailyLog({
        sessionId: input.sessionId,
        logDate: input.logDate,
        normalOrders: input.normalOrders,
        plusOrders: input.plusOrders
      });
      return { success: true };
    })
  })
});

// server/vercel.ts
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);
var vercel_default = app;
export {
  vercel_default as default
};
