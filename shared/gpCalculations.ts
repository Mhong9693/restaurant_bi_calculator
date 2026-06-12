// GP Calculation — LINE MAN / Delivery Platform
//
// GP% = ค่า Commission ที่แพลตฟอร์มหักจากร้านค้า คำนวณจากราคาขายก่อนส่วนลด
//
// สูตรหลัก:
//   ค่า GP        = ราคาขาย (ก่อนส่วนลด) × GP%
//   VAT บน GP     = ค่า GP × VAT%
//   รายรับสุทธิ   = ราคาขายหลังส่วนลด − ค่า GP − VAT บน GP − ค่าส่งที่ร้านช่วยออก
//   กำไรต่อออเดอร์ = รายรับสุทธิ − ต้นทุนรวม
//   Margin%       = กำไรต่อออเดอร์ ÷ ราคาขายหลังส่วนลด × 100

// -------------------------------------------------------
// Default constants
// -------------------------------------------------------
export const DEFAULT_NORMAL_GP_PERCENT = 30;   // GP% แพลตฟอร์มปกติ
export const DEFAULT_PLUS_GP_PERCENT = 15;     // GP% ไทยช่วยไทยพลัส (60/40)
export const DEFAULT_VAT_ON_GP = 7;            // VAT บน GP (%)
export const DEFAULT_TARGET_MARGIN = 15;       // เป้า Margin หลัง GP (%)
export const DEFAULT_PRICE_STEP = 5;           // ปัดราคาขึ้นทีละ (บาท)

// Legacy constants (kept for backward compat with menu analysis)
export const GRAB_NORMAL_COMMISSION = 0.30;
export const GRAB_THAI_PLUS_COMMISSION = 0.15;
export const GRAB_VAT_ON_GP = 0.07;
export const GRAB_DELIVERY_SUBSIDY_DEFAULT = 0;
export const VAT_ON_COMMISSION = 1.07;

// -------------------------------------------------------
// Core GP formula
// -------------------------------------------------------

export interface GPOrderInput {
  /** ราคาขายก่อนส่วนลด (บาท) */
  sellingPrice: number;
  /** GP% ที่แพลตฟอร์มหัก เช่น 30 หรือ 23 */
  gpPercent: number;
  /** VAT บน GP (%) ปกติ 7 ถ้าแพลตฟอร์มไม่คิดให้ใส่ 0 */
  vatOnGpPercent: number;
  /** ส่วนลดที่ร้านออกเอง (บาท) ถ้าไม่มีใส่ 0 */
  restaurantDiscount?: number;
  /** ค่าส่งที่ร้านช่วยออก (บาท) ถ้าไม่มีใส่ 0 */
  deliverySubsidy?: number;
  /** ต้นทุนรวมต่อออเดอร์ = Food Cost + บรรจุภัณฑ์ + อื่นๆ (บาท) */
  totalCostPerOrder: number;
  /** ร้านจดทะเบียน VAT หรือไม่ — ถ้าจด ราคาขายถือว่ารวม VAT 7% ที่ต้องนำส่ง และ VAT บน GP ขอคืนได้ */
  vatRegistered?: boolean;
}

export interface GPOrderResult {
  /** ราคาขายหลังส่วนลด */
  priceAfterDiscount: number;
  /** ค่า GP (คำนวณจากราคาก่อนส่วนลด) */
  gpAmount: number;
  /** VAT บน GP */
  vatOnGpAmount: number;
  /** ค่า GP รวม VAT */
  gpPlusVat: number;
  /** รายรับสุทธิที่ร้านได้รับ */
  netRevenue: number;
  /** กำไรต่อออเดอร์ */
  profitPerOrder: number;
  /** Margin หลังหัก GP (%) */
  marginPercent: number;
  /** สถานะกำไร */
  status: "healthy" | "warning" | "danger";
}

export function calcGPOrder(input: GPOrderInput): GPOrderResult {
  const {
    sellingPrice,
    gpPercent,
    vatOnGpPercent,
    restaurantDiscount = 0,
    deliverySubsidy = 0,
    totalCostPerOrder,
    vatRegistered = false,
  } = input;

  const priceAfterDiscount = sellingPrice - restaurantDiscount;

  // GP คำนวณจากราคาก่อนส่วนลดเสมอ
  const gpAmount = sellingPrice * (gpPercent / 100);
  const vatOnGpAmount = gpAmount * (vatOnGpPercent / 100);
  const gpPlusVat = gpAmount + vatOnGpAmount;

  // ร้านจด VAT: ราคาขายรวม VAT ขาย 7% ที่ต้องนำส่งสรรพากร → ฐานรายรับจริง = ราคา ÷ 1.07
  // และ VAT บน GP เป็นภาษีซื้อที่ขอคืนได้ จึงไม่นับเป็นต้นทุน
  const revenueBase = vatRegistered ? priceAfterDiscount / 1.07 : priceAfterDiscount;
  const gpCost = vatRegistered ? gpAmount : gpPlusVat;

  // รายรับสุทธิ = ฐานรายรับ − ค่า GP (รวม/ไม่รวม VAT ตามสถานะจดทะเบียน) − ค่าส่งที่ร้านช่วยออก
  const netRevenue = revenueBase - gpCost - deliverySubsidy;

  const profitPerOrder = netRevenue - totalCostPerOrder;

  const marginPercent =
    priceAfterDiscount > 0 ? (profitPerOrder / priceAfterDiscount) * 100 : 0;

  const status: GPOrderResult["status"] =
    marginPercent >= 30 ? "healthy" : marginPercent >= 15 ? "warning" : "danger";

  return {
    priceAfterDiscount,
    gpAmount,
    vatOnGpAmount,
    gpPlusVat,
    netRevenue,
    profitPerOrder,
    marginPercent,
    status,
  };
}

/**
 * คำนวณราคาขายต่ำสุดที่ควรตั้ง เพื่อให้ได้ Margin ตามเป้า
 * แก้สมการ: (price - gp×price×(1+vat) - cost) / price = targetMargin/100
 * → price × (1 - gp×(1+vat) - targetMargin/100) = cost
 * → price = cost / (1 - gp×(1+vat) - targetMargin/100)
 */
export function calcRecommendedPrice(
  totalCostPerOrder: number,
  gpPercent: number,
  vatOnGpPercent: number,
  targetMarginPercent: number,
  priceStep: number = DEFAULT_PRICE_STEP
): number {
  const factor =
    1 - (gpPercent / 100) * (1 + vatOnGpPercent / 100) - targetMarginPercent / 100;
  if (factor <= 0) return 0;
  const rawPrice = totalCostPerOrder / factor;
  if (priceStep > 0) {
    return Math.ceil(rawPrice / priceStep) * priceStep;
  }
  return Math.ceil(rawPrice);
}

// -------------------------------------------------------
// Legacy calcNetGpPercent / calcGpPerOrder (kept for compat)
// -------------------------------------------------------
export function calcNetGpPercent(commissionPercent: number): number {
  return (1 - (commissionPercent / 100) * VAT_ON_COMMISSION) * 100;
}

export function calcGpPerOrder(avgPrice: number, commissionPercent: number): number {
  return avgPrice * calcNetGpPercent(commissionPercent) / 100;
}

// -------------------------------------------------------
// Legacy GPInput/GPResult (kept for menu analysis)
// -------------------------------------------------------
export interface GPInput {
  sellingPrice: number;
  foodCost: number;
  packagingCost: number;
  otherCost: number;
  restaurantDiscount: number;
  deliverySubsidy: number;
}

export interface GPResult {
  netRevenue: number;
  netRevenueThaiPlus: number;
  totalVariableCost: number;
  grossProfit: number;
  grossProfitThaiPlus: number;
  gpMargin: number;
  gpMarginThaiPlus: number;
  netAfterVat: number;
  netAfterVatThaiPlus: number;
  recommendedPrice: (targetMargin: number) => number;
  status: "healthy" | "warning" | "danger";
  statusThaiPlus: "healthy" | "warning" | "danger";
}

export function calculateGP(input: GPInput): GPResult {
  const { sellingPrice, foodCost, packagingCost, otherCost, restaurantDiscount, deliverySubsidy } = input;
  const effectivePrice = sellingPrice - restaurantDiscount;
  const totalVariableCost = foodCost + packagingCost + otherCost + deliverySubsidy;

  const commissionNormal = sellingPrice * GRAB_NORMAL_COMMISSION;
  const vatOnCommissionNormal = commissionNormal * GRAB_VAT_ON_GP;
  const netRevenueNormal = effectivePrice - commissionNormal - vatOnCommissionNormal;
  const grossProfitNormal = netRevenueNormal - totalVariableCost;
  const gpMarginNormal = effectivePrice > 0 ? (grossProfitNormal / effectivePrice) * 100 : 0;

  const commissionThaiPlus = sellingPrice * GRAB_THAI_PLUS_COMMISSION;
  const vatOnCommissionThaiPlus = commissionThaiPlus * GRAB_VAT_ON_GP;
  const netRevenueThaiPlus = effectivePrice - commissionThaiPlus - vatOnCommissionThaiPlus;
  const grossProfitThaiPlus = netRevenueThaiPlus - totalVariableCost;
  const gpMarginThaiPlus = effectivePrice > 0 ? (grossProfitThaiPlus / effectivePrice) * 100 : 0;

  const getStatus = (margin: number): "healthy" | "warning" | "danger" => {
    if (margin >= 30) return "healthy";
    if (margin >= 15) return "warning";
    return "danger";
  };

  const recommendedPrice = (targetMargin: number): number => {
    const commissionRate = GRAB_THAI_PLUS_COMMISSION * (1 + GRAB_VAT_ON_GP);
    const denominator = 1 - commissionRate - targetMargin / 100;
    if (denominator <= 0) return 0;
    return totalVariableCost / denominator;
  };

  return {
    netRevenue: netRevenueNormal,
    netRevenueThaiPlus,
    totalVariableCost,
    grossProfit: grossProfitNormal,
    grossProfitThaiPlus,
    gpMargin: gpMarginNormal,
    gpMarginThaiPlus,
    netAfterVat: grossProfitNormal,
    netAfterVatThaiPlus: grossProfitThaiPlus,
    recommendedPrice,
    status: getStatus(gpMarginNormal),
    statusThaiPlus: getStatus(gpMarginThaiPlus),
  };
}

export function calculateBreakEven(
  fixedCostMonthly: number,
  avgGrossProfitPerOrder: number
): { ordersPerMonth: number; ordersPerDay: number } {
  if (avgGrossProfitPerOrder <= 0) return { ordersPerMonth: 0, ordersPerDay: 0 };
  const ordersPerMonth = fixedCostMonthly / avgGrossProfitPerOrder;
  const ordersPerDay = ordersPerMonth / 30;
  return { ordersPerMonth: Math.ceil(ordersPerMonth), ordersPerDay: Math.ceil(ordersPerDay) };
}

export function calculateMonthlyOverview(
  actualOrders: number,
  avgGrossProfitPerOrder: number,
  fixedCostMonthly: number
) {
  const totalRevenue = actualOrders * avgGrossProfitPerOrder;
  const netProfit = totalRevenue - fixedCostMonthly;
  const avgGP = actualOrders > 0 ? totalRevenue / actualOrders : 0;
  return {
    totalGrossProfit: totalRevenue,
    netProfit,
    avgGPPerOrder: avgGP,
    profitStatus: netProfit >= 0 ? "healthy" : "danger",
  };
}

export function simulatePromotion(
  sellingPrice: number,
  discountAmount: number,
  deliverySubsidy: number,
  totalVariableCost: number,
  commissionRate: number = GRAB_THAI_PLUS_COMMISSION
) {
  const effectivePrice = sellingPrice - discountAmount;
  // GP คำนวณจากราคาก่อนส่วนลด
  const commission = sellingPrice * commissionRate * (1 + GRAB_VAT_ON_GP);
  const netRevenue = effectivePrice - commission;
  const grossProfit = netRevenue - totalVariableCost - deliverySubsidy;
  const gpMargin = effectivePrice > 0 ? (grossProfit / effectivePrice) * 100 : 0;

  const maxDiscount = (() => {
    const factor = 1 - commissionRate * (1 + GRAB_VAT_ON_GP);
    const minEffectivePrice = (totalVariableCost + deliverySubsidy) / factor;
    return Math.max(0, sellingPrice - minEffectivePrice);
  })();

  return { grossProfit, gpMargin, maxDiscount, isLoss: grossProfit < 0 };
}
