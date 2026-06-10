import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the db module before importing routers
vi.mock("./db", () => ({
  createLead: vi.fn(),
  getLeadByPhone: vi.fn(),
  getAllLeads: vi.fn(),
  getMenuItemsBySession: vi.fn(),
  createMenuItem: vi.fn(),
  deleteMenuItem: vi.fn(),
  clearMenuItemsBySession: vi.fn(),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("leads.submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validInput = {
    storeName: "ร้านข้าวมันไก่ป้าแดง",
    phone: "0812345678",
    province: "กรุงเทพมหานคร",
    foodCategory: "อาหารไทย",
    pdpaConsent: true,
  };

  it("creates a new lead when phone is not registered", async () => {
    vi.mocked(db.getLeadByPhone).mockResolvedValue(undefined);
    vi.mocked(db.createLead).mockResolvedValue(undefined as never);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.submit(validInput);

    expect(result.success).toBe(true);
    expect(result.alreadyExists).toBe(false);
    expect(db.createLead).toHaveBeenCalledWith(expect.objectContaining({
      storeName: validInput.storeName,
      phone: validInput.phone,
    }));
  });

  it("returns alreadyExists when phone is already registered", async () => {
    vi.mocked(db.getLeadByPhone).mockResolvedValue({
      id: 1,
      storeName: "ร้านเดิม",
      phone: "0812345678",
      province: "กรุงเทพมหานคร",
      foodCategory: "อาหารไทย",
      pdpaConsent: true,
      createdAt: new Date(),
    } as never);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.submit(validInput);

    expect(result.success).toBe(true);
    expect(result.alreadyExists).toBe(true);
    expect(db.createLead).not.toHaveBeenCalled();
  });

  it("rejects submission when PDPA consent is false", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.leads.submit({ ...validInput, pdpaConsent: false })
    ).rejects.toThrow();
  });

  it("rejects submission with invalid phone (too short)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.leads.submit({ ...validInput, phone: "123" })
    ).rejects.toThrow();
  });

  it("rejects submission with empty store name", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.leads.submit({ ...validInput, storeName: "" })
    ).rejects.toThrow();
  });
});

describe("leads.checkAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns hasAccess=true when phone is registered", async () => {
    vi.mocked(db.getLeadByPhone).mockResolvedValue({
      id: 1,
      phone: "0812345678",
    } as never);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.checkAccess({ phone: "0812345678" });
    expect(result.hasAccess).toBe(true);
  });

  it("returns hasAccess=false when phone is not registered", async () => {
    vi.mocked(db.getLeadByPhone).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.checkAccess({ phone: "0899999999" });
    expect(result.hasAccess).toBe(false);
  });

  it("returns hasAccess=false for empty phone", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.checkAccess({ phone: "" });
    expect(result.hasAccess).toBe(false);
  });
});
