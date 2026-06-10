import { describe, expect, it } from "vitest";
import { calculateGP, calculateBreakEven, simulatePromotion, GRAB_NORMAL_COMMISSION, GRAB_THAI_PLUS_COMMISSION, calcNetGpPercent, calcGpPerOrder } from "../shared/gpCalculations";

// -------------------------------------------------------
// Tests for the new commission-based formula
// GP% สุทธิ = (1 - commission% × 1.07) × 100
// กำไรต่อออเดอร์ = ราคาขาย × GP% สุทธิ / 100
// -------------------------------------------------------

describe("calcNetGpPercent (commission-based formula)", () => {
  it("Commission 30% → GP% สุทธิ = 67.9%", () => {
    // (1 - 0.30 × 1.07) × 100 = (1 - 0.321) × 100 = 67.9
    expect(calcNetGpPercent(30)).toBeCloseTo(67.9, 1);
  });

  it("Commission 23% → GP% สุทธิ = 75.39%", () => {
    // (1 - 0.23 × 1.07) × 100 = (1 - 0.2461) × 100 = 75.39
    expect(calcNetGpPercent(23)).toBeCloseTo(75.39, 1);
  });

  it("Commission 0% → GP% สุทธิ = 100%", () => {
    expect(calcNetGpPercent(0)).toBeCloseTo(100, 1);
  });

  it("Commission 100% → GP% สุทธิ เป็นลบ (ขาดทุน)", () => {
    // (1 - 1.00 × 1.07) × 100 = -7
    expect(calcNetGpPercent(100)).toBeCloseTo(-7, 1);
  });

  it("Plus commission ต่ำกว่า normal → GP% สุทธิสูงกว่า", () => {
    const normalGp = calcNetGpPercent(30);
    const plusGp = calcNetGpPercent(23);
    expect(plusGp).toBeGreaterThan(normalGp);
  });
});

describe("calcGpPerOrder (commission-based formula)", () => {
  it("ราคา 150 บาท, Commission 30% → กำไร = 101.85 บาท", () => {
    // 150 × (1 - 0.30 × 1.07) = 150 × 0.679 = 101.85
    expect(calcGpPerOrder(150, 30)).toBeCloseTo(101.85, 1);
  });

  it("ราคา 150 บาท, Commission 23% → กำไร = 113.09 บาท", () => {
    // 150 × (1 - 0.23 × 1.07) = 150 × 0.7539 = 113.09
    expect(calcGpPerOrder(150, 23)).toBeCloseTo(113.09, 1);
  });

  it("ราคา 100 บาท, Commission 30% → กำไร = 67.9 บาท (ตาม Wongnai example)", () => {
    // ยอดขาย 100 บาท, GP 30% = 30 บาท, VAT บน GP = 2.1 บาท
    // ร้านได้รับ = 100 - 30 - 2.1 = 67.9 บาท
    expect(calcGpPerOrder(100, 30)).toBeCloseTo(67.9, 1);
  });

  it("ราคา 0 บาท → กำไร = 0 บาท", () => {
    expect(calcGpPerOrder(0, 30)).toBe(0);
  });
});

// -------------------------------------------------------
// Legacy tests for calculateGP (item-level cost breakdown)
// -------------------------------------------------------

describe("calculateGP (legacy item-level)", () => {
  it("calculates GP correctly for normal commission", () => {
    const result = calculateGP({
      sellingPrice: 100,
      foodCost: 25,
      packagingCost: 5,
      otherCost: 0,
      restaurantDiscount: 0,
      deliverySubsidy: 0,
    });
    // Normal: 100 * 0.30 * 1.07 = 32.1 commission+vat
    // netRevenue = 100 - 32.1 = 67.9
    // grossProfit = 67.9 - 30 = 37.9
    expect(result.grossProfit).toBeCloseTo(37.9, 1);
    expect(result.gpMargin).toBeCloseTo(37.9, 1);
    expect(result.status).toBe("healthy");
  });

  it("calculates GP correctly for Thai Plus commission", () => {
    const result = calculateGP({
      sellingPrice: 100,
      foodCost: 25,
      packagingCost: 5,
      otherCost: 0,
      restaurantDiscount: 0,
      deliverySubsidy: 0,
    });
    // ThaiPlus: 100 * 0.23 * 1.07 = 24.61 commission+vat
    // netRevenue = 100 - 24.61 = 75.39
    // grossProfit = 75.39 - 30 = 45.39
    expect(result.grossProfitThaiPlus).toBeCloseTo(45.39, 1);
    expect(result.gpMarginThaiPlus).toBeCloseTo(45.39, 1);
    expect(result.statusThaiPlus).toBe("healthy");
  });

  it("returns danger status when margin is below 15%", () => {
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

  it("returns warning status when margin is between 15% and 30%", () => {
    const result = calculateGP({
      sellingPrice: 100,
      foodCost: 45,
      packagingCost: 5,
      otherCost: 0,
      restaurantDiscount: 0,
      deliverySubsidy: 0,
    });
    expect(result.status).toBe("warning");
  });

  it("Thai Plus always has higher GP than normal", () => {
    const result = calculateGP({
      sellingPrice: 100,
      foodCost: 25,
      packagingCost: 5,
      otherCost: 0,
      restaurantDiscount: 0,
      deliverySubsidy: 0,
    });
    expect(result.grossProfitThaiPlus).toBeGreaterThan(result.grossProfit);
    expect(result.gpMarginThaiPlus).toBeGreaterThan(result.gpMargin);
  });

  it("recommendedPrice returns correct price for target margin", () => {
    const result = calculateGP({
      sellingPrice: 100,
      foodCost: 25,
      packagingCost: 5,
      otherCost: 0,
      restaurantDiscount: 0,
      deliverySubsidy: 0,
    });
    const recPrice = result.recommendedPrice(30);
    expect(recPrice).toBeGreaterThan(0);
    const verify = calculateGP({
      sellingPrice: recPrice,
      foodCost: 25,
      packagingCost: 5,
      otherCost: 0,
      restaurantDiscount: 0,
      deliverySubsidy: 0,
    });
    expect(verify.gpMarginThaiPlus).toBeCloseTo(30, 0);
  });
});

describe("calculateBreakEven", () => {
  it("calculates break-even correctly", () => {
    const result = calculateBreakEven(30000, 50);
    expect(result.ordersPerMonth).toBe(600);
    expect(result.ordersPerDay).toBe(20);
  });

  it("returns 0 when avgGrossProfit is 0 or negative", () => {
    const result = calculateBreakEven(30000, 0);
    expect(result.ordersPerMonth).toBe(0);
    expect(result.ordersPerDay).toBe(0);
  });
});

describe("simulatePromotion", () => {
  it("detects loss when discount is too high", () => {
    const result = simulatePromotion(100, 80, 0, 30);
    expect(result.isLoss).toBe(true);
  });

  it("no loss with small discount", () => {
    const result = simulatePromotion(100, 5, 0, 30);
    expect(result.isLoss).toBe(false);
  });

  it("maxDiscount is always positive", () => {
    const result = simulatePromotion(100, 0, 0, 30);
    expect(result.maxDiscount).toBeGreaterThan(0);
  });
});
