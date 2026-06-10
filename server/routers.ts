import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import { appendLeadToSheet } from "./googleSheets";
import {
  createLead, getLeadByPhone, getAllLeads,
  getMenuItemsBySession, createMenuItem, deleteMenuItem, clearMenuItemsBySession,
  getGpSettings, upsertGpSettings,
  upsertDailyLog, getDailyLogsBySession, getDailyLogByDate,
} from "./db";
import { z } from "zod";

const leadSchema = z.object({
  storeName: z.string().min(1, "กรุณากรอกชื่อร้าน"),
  phone: z.string().min(9, "กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง"),
  province: z.string().min(1, "กรุณาเลือกจังหวัด"),
  foodCategory: z.string().min(1, "กรุณาเลือกประเภทอาหาร"),
  pdpaConsent: z.boolean().refine(v => v === true, "กรุณายินยอมเงื่อนไข PDPA"),
});

const menuItemSchema = z.object({
  sessionId: z.string().min(1),
  name: z.string().min(1, "กรุณากรอกชื่อเมนู"),
  sellingPrice: z.number().positive("ราคาขายต้องมากกว่า 0"),
  foodCost: z.number().min(0, "ต้นทุนวัตถุดิบต้องไม่ติดลบ"),
  packagingCost: z.number().min(0).default(0),
  otherCost: z.number().min(0).default(0),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  leads: router({
    submit: publicProcedure
      .input(leadSchema)
      .mutation(async ({ input }) => {
        const existing = await getLeadByPhone(input.phone);
        if (existing) {
          return { success: true, alreadyExists: true, message: "เบอร์โทรนี้ลงทะเบียนแล้ว" };
        }
        await createLead({
          storeName: input.storeName,
          phone: input.phone,
          province: input.province,
          foodCategory: input.foodCategory,
          pdpaConsent: input.pdpaConsent,
        });
        try {
          await appendLeadToSheet({
            storeName: input.storeName,
            phone: input.phone,
            province: input.province,
            foodCategory: input.foodCategory,
            pdpaConsent: input.pdpaConsent,
          });
        } catch (e) {
          console.warn("[GoogleSheets] Sync failed (non-fatal):", e);
        }
        try {
          await notifyOwner({
            title: `🎉 Lead ใหม่: ${input.storeName}`,
            content: `ร้าน: ${input.storeName}\nเบอร์: ${input.phone}\nจังหวัด: ${input.province}\nประเภทอาหาร: ${input.foodCategory}\nเวลา: ${new Date().toLocaleString("th-TH")}`,
          });
        } catch (e) {
          console.warn("[Notification] Failed to notify owner:", e);
        }
        return { success: true, alreadyExists: false, message: "ลงทะเบียนสำเร็จ! ปลดล็อกฟีเจอร์ขั้นสูงแล้ว" };
      }),

    checkAccess: publicProcedure
      .input(z.object({ phone: z.string() }))
      .query(async ({ input }) => {
        if (!input.phone) return { hasAccess: false };
        const lead = await getLeadByPhone(input.phone);
        return { hasAccess: !!lead, lead: lead ?? null };
      }),

    list: publicProcedure.query(async () => {
      return getAllLeads();
    }),
  }),

  menuItems: router({
    list: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const items = await getMenuItemsBySession(input.sessionId);
        return items.map(item => ({
          ...item,
          sellingPrice: Number(item.sellingPrice),
          foodCost: Number(item.foodCost),
          packagingCost: Number(item.packagingCost),
          otherCost: Number(item.otherCost),
        }));
      }),

    add: publicProcedure
      .input(menuItemSchema)
      .mutation(async ({ input }) => {
        await createMenuItem({
          sessionId: input.sessionId,
          name: input.name,
          sellingPrice: String(input.sellingPrice),
          foodCost: String(input.foodCost),
          packagingCost: String(input.packagingCost),
          otherCost: String(input.otherCost),
        });
        return { success: true };
      }),

    remove: publicProcedure
      .input(z.object({ id: z.number(), sessionId: z.string() }))
      .mutation(async ({ input }) => {
        await deleteMenuItem(input.id, input.sessionId);
        return { success: true };
      }),

    clear: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ input }) => {
        await clearMenuItemsBySession(input.sessionId);
        return { success: true };
      }),
  }),

  gpSettings: router({
    get: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const s = await getGpSettings(input.sessionId);
        if (!s) return null;
        return {
          ...s,
          normalAvgPrice: Number(s.normalAvgPrice),
          normalGpPercent: Number(s.normalGpPercent),
          plusAvgPrice: Number(s.plusAvgPrice),
          plusGpPercent: Number(s.plusGpPercent),
        };
      }),

    save: publicProcedure
      .input(z.object({
        sessionId: z.string().min(1),
        normalAvgPrice: z.number().min(0),
        normalGpPercent: z.number().min(0).max(100),
        plusAvgPrice: z.number().min(0),
        plusGpPercent: z.number().min(0).max(100),
      }))
      .mutation(async ({ input }) => {
        await upsertGpSettings({
          sessionId: input.sessionId,
          normalAvgPrice: String(input.normalAvgPrice),
          normalGpPercent: String(input.normalGpPercent),
          plusAvgPrice: String(input.plusAvgPrice),
          plusGpPercent: String(input.plusGpPercent),
        });
        return { success: true };
      }),
  }),

  dailyLogs: router({
    getByDate: publicProcedure
      .input(z.object({ sessionId: z.string(), logDate: z.string() }))
      .query(async ({ input }) => {
        const log = await getDailyLogByDate(input.sessionId, input.logDate);
        if (!log) return null;
        return { ...log, normalOrders: Number(log.normalOrders), plusOrders: Number(log.plusOrders) };
      }),

    getRange: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const logs = await getDailyLogsBySession(input.sessionId, input.startDate, input.endDate);
        return logs.map(l => ({ ...l, normalOrders: Number(l.normalOrders), plusOrders: Number(l.plusOrders) }));
      }),

    save: publicProcedure
      .input(z.object({
        sessionId: z.string().min(1),
        logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ต้องเป็น YYYY-MM-DD"),
        normalOrders: z.number().int().min(0),
        plusOrders: z.number().int().min(0),
      }))
      .mutation(async ({ input }) => {
        await upsertDailyLog({
          sessionId: input.sessionId,
          logDate: input.logDate,
          normalOrders: input.normalOrders,
          plusOrders: input.plusOrders,
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
