import { describe, expect, it } from "vitest";
import { calculateGP, calculateBreakEven, simulatePromotion, GRAB_NORMAL_COMMISSION, GRAB_THAI_PLUS_COMMISSION } from "../shared/gpCalculations";

describe("calculateGP", () => {
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
    // With foodCost=45, packagingCost=5 → totalCost=50
    // Normal: 100 - 100*0.30*1.07 - 50 = 100 - 32.1 - 50 = 17.9 → 17.9%
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
    // Verify: at recommended price, margin should be ~30%
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
