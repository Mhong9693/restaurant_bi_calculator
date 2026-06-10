import { describe, expect, it } from "vitest";
import {
  calcGPOrder,
  calcRecommendedPrice,
  calculateGP,
  calculateBreakEven,
  simulatePromotion,
  calcNetGpPercent,
  calcGpPerOrder,
} from "../shared/gpCalculations";

// -------------------------------------------------------
// Tests for calcGPOrder — สูตรหลักที่ถูกต้อง
// GP% = ค่า Commission ที่แพลตฟอร์มหักจากราคาขายก่อนส่วนลด
// รายรับสุทธิ = ราคาหลังส่วนลด − (ราคาก่อนส่วนลด × GP%) − VAT บน GP
// -------------------------------------------------------

describe("calcGPOrder — สูตรหลัก", () => {
  it("ตัวอย่างจาก Wongnai: ราคา 150, GP 30%, VAT 7%, ไม่มีส่วนลด, ต้นทุน 0", () => {
    // ค่า GP = 150 × 30% = 45
    // VAT บน GP = 45 × 7% = 3.15
    // รายรับสุทธิ = 150 − 45 − 3.15 = 101.85
    const r = calcGPOrder({ sellingPrice: 150, gpPercent: 30, vatOnGpPercent: 7, totalCostPerOrder: 0 });
    expect(r.gpAmount).toBeCloseTo(45, 2);
    expect(r.vatOnGpAmount).toBeCloseTo(3.15, 2);
    expect(r.gpPlusVat).toBeCloseTo(48.15, 2);
    expect(r.netRevenue).toBeCloseTo(101.85, 2);
    expect(r.profitPerOrder).toBeCloseTo(101.85, 2);
  });

  it("ไทยช่วยไทยพลัส: ราคา 150, GP 23%, VAT 7%, ต้นทุน 0", () => {
    // ค่า GP = 150 × 23% = 34.5
    // VAT บน GP = 34.5 × 7% = 2.415
    // รายรับสุทธิ = 150 − 34.5 − 2.415 = 113.085
    const r = calcGPOrder({ sellingPrice: 150, gpPercent: 23, vatOnGpPercent: 7, totalCostPerOrder: 0 });
    expect(r.gpAmount).toBeCloseTo(34.5, 2);
    expect(r.vatOnGpAmount).toBeCloseTo(2.415, 2);
    expect(r.netRevenue).toBeCloseTo(113.085, 2);
  });

  it("GP คำนวณจากราคาก่อนส่วนลด ไม่ใช่หลังส่วนลด", () => {
    // ราคา 150, ส่วนลด 20 → ราคาหลังส่วนลด = 130
    // GP = 150 × 30% = 45 (ไม่ใช่ 130 × 30% = 39)
    const r = calcGPOrder({ sellingPrice: 150, gpPercent: 30, vatOnGpPercent: 7, restaurantDiscount: 20, totalCostPerOrder: 0 });
    expect(r.gpAmount).toBeCloseTo(45, 2);
    expect(r.priceAfterDiscount).toBeCloseTo(130, 2);
    // รายรับสุทธิ = 130 − 45 − 3.15 = 81.85
    expect(r.netRevenue).toBeCloseTo(81.85, 2);
  });

  it("กำไรต่อออเดอร์ = รายรับสุทธิ − ต้นทุนรวม", () => {
    const r = calcGPOrder({ sellingPrice: 150, gpPercent: 30, vatOnGpPercent: 7, totalCostPerOrder: 50 });
    expect(r.profitPerOrder).toBeCloseTo(101.85 - 50, 2);
  });

  it("Margin% = กำไรต่อออเดอร์ / ราคาขายหลังส่วนลด × 100", () => {
    const r = calcGPOrder({ sellingPrice: 150, gpPercent: 30, vatOnGpPercent: 7, totalCostPerOrder: 50 });
    const expectedMargin = ((101.85 - 50) / 150) * 100;
    expect(r.marginPercent).toBeCloseTo(expectedMargin, 1);
  });

  it("ค่าส่งที่ร้านช่วยออก ลดรายรับสุทธิ", () => {
    const withSubsidy = calcGPOrder({ sellingPrice: 150, gpPercent: 30, vatOnGpPercent: 7, deliverySubsidy: 10, totalCostPerOrder: 0 });
    const withoutSubsidy = calcGPOrder({ sellingPrice: 150, gpPercent: 30, vatOnGpPercent: 7, totalCostPerOrder: 0 });
    expect(withSubsidy.netRevenue).toBeCloseTo(withoutSubsidy.netRevenue - 10, 2);
  });

  it("VAT 0% → ไม่มี VAT บน GP", () => {
    const r = calcGPOrder({ sellingPrice: 150, gpPercent: 30, vatOnGpPercent: 0, totalCostPerOrder: 0 });
    expect(r.vatOnGpAmount).toBe(0);
    expect(r.netRevenue).toBeCloseTo(150 - 45, 2);
  });

  it("ไทยช่วยไทยพลัส มีกำไรมากกว่าปกติ (GP ต่ำกว่า)", () => {
    const normal = calcGPOrder({ sellingPrice: 150, gpPercent: 30, vatOnGpPercent: 7, totalCostPerOrder: 50 });
    const plus = calcGPOrder({ sellingPrice: 150, gpPercent: 23, vatOnGpPercent: 7, totalCostPerOrder: 50 });
    expect(plus.profitPerOrder).toBeGreaterThan(normal.profitPerOrder);
    expect(plus.marginPercent).toBeGreaterThan(normal.marginPercent);
  });

  it("status = healthy เมื่อ Margin ≥ 30%", () => {
    const r = calcGPOrder({ sellingPrice: 150, gpPercent: 23, vatOnGpPercent: 7, totalCostPerOrder: 0 });
    expect(r.status).toBe("healthy");
  });

  it("status = danger เมื่อ Margin < 15%", () => {
    const r = calcGPOrder({ sellingPrice: 150, gpPercent: 30, vatOnGpPercent: 7, totalCostPerOrder: 130 });
    expect(r.status).toBe("danger");
  });
});

// -------------------------------------------------------
// Tests for calcRecommendedPrice
// -------------------------------------------------------

describe("calcRecommendedPrice", () => {
  it("คำนวณราคาขายต่ำสุดเพื่อให้ได้ Margin 15%", () => {
    const cost = 50;
    const price = calcRecommendedPrice(cost, 30, 7, 15, 0);
    // ตรวจสอบว่าราคาที่แนะนำให้ Margin ≥ 15%
    const r = calcGPOrder({ sellingPrice: price, gpPercent: 30, vatOnGpPercent: 7, totalCostPerOrder: cost });
    expect(r.marginPercent).toBeGreaterThanOrEqual(14.9);
  });

  it("ปัดราคาขึ้นตาม priceStep", () => {
    const price = calcRecommendedPrice(50, 30, 7, 15, 5);
    expect(price % 5).toBe(0);
  });

  it("คืน 0 เมื่อ factor ≤ 0 (Margin สูงเกินไป)", () => {
    const price = calcRecommendedPrice(50, 30, 7, 100, 5);
    expect(price).toBe(0);
  });
});

// -------------------------------------------------------
// Legacy tests (calcNetGpPercent / calcGpPerOrder)
// -------------------------------------------------------

describe("calcNetGpPercent (legacy)", () => {
  it("Commission 30% → 67.9%", () => {
    expect(calcNetGpPercent(30)).toBeCloseTo(67.9, 1);
  });
  it("Commission 23% → 75.39%", () => {
    expect(calcNetGpPercent(23)).toBeCloseTo(75.39, 1);
  });
});

describe("calcGpPerOrder (legacy)", () => {
  it("ราคา 150, Commission 30% → 101.85", () => {
    expect(calcGpPerOrder(150, 30)).toBeCloseTo(101.85, 1);
  });
});

// -------------------------------------------------------
// Legacy calculateGP tests
// -------------------------------------------------------

describe("calculateGP (legacy item-level)", () => {
  it("GP คำนวณจากราคาก่อนส่วนลด", () => {
    const result = calculateGP({
      sellingPrice: 100,
      foodCost: 25,
      packagingCost: 5,
      otherCost: 0,
      restaurantDiscount: 0,
      deliverySubsidy: 0,
    });
    // Normal: 100 * 0.30 * 1.07 = 32.1
    // netRevenue = 100 - 32.1 = 67.9
    // grossProfit = 67.9 - 30 = 37.9
    expect(result.grossProfit).toBeCloseTo(37.9, 1);
  });

  it("Thai Plus มีกำไรมากกว่า Normal", () => {
    const result = calculateGP({
      sellingPrice: 100,
      foodCost: 25,
      packagingCost: 5,
      otherCost: 0,
      restaurantDiscount: 0,
      deliverySubsidy: 0,
    });
    expect(result.grossProfitThaiPlus).toBeGreaterThan(result.grossProfit);
  });

  it("danger status เมื่อ margin < 15%", () => {
    const result = calculateGP({
      sellingPrice: 100,
      foodCost: 80,
      packagingCost: 5,
      otherCost: 0,
      restaurantDiscount: 0,
      deliverySubsidy: 0,
    });
    expect(result.status).toBe("danger");
  });
});

describe("calculateBreakEven", () => {
  it("คำนวณ break-even ถูกต้อง", () => {
    const result = calculateBreakEven(30000, 50);
    expect(result.ordersPerMonth).toBe(600);
    expect(result.ordersPerDay).toBe(20);
  });

  it("คืน 0 เมื่อ avgGrossProfit = 0", () => {
    const result = calculateBreakEven(30000, 0);
    expect(result.ordersPerMonth).toBe(0);
  });
});

describe("simulatePromotion", () => {
  it("ตรวจจับขาดทุนเมื่อส่วนลดสูงเกิน", () => {
    const result = simulatePromotion(100, 80, 0, 30);
    expect(result.isLoss).toBe(true);
  });

  it("ไม่ขาดทุนเมื่อส่วนลดน้อย", () => {
    const result = simulatePromotion(100, 5, 0, 30);
    expect(result.isLoss).toBe(false);
  });
});
