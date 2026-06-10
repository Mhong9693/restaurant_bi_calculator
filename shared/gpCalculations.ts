// GP Calculation constants for LINE MAN Thailand
export const GRAB_NORMAL_COMMISSION = 0.30; // 30% normal commission
export const GRAB_THAI_PLUS_COMMISSION = 0.23; // 23% LINE MAN โปรแกรมพิเศษ commission
export const GRAB_VAT_ON_GP = 0.07; // 7% VAT on GP
export const GRAB_DELIVERY_SUBSIDY_DEFAULT = 0; // default delivery subsidy by restaurant

export interface GPInput {
  sellingPrice: number;
  foodCost: number;
  packagingCost: number;
  otherCost: number;
  restaurantDiscount: number; // discount restaurant absorbs
  deliverySubsidy: number; // delivery fee restaurant subsidizes
}

export interface GPResult {
  // Revenue after platform commission
  netRevenue: number;
  netRevenueThaiPlus: number;

  // Total variable cost
  totalVariableCost: number;

  // Gross Profit
  grossProfit: number;
  grossProfitThaiPlus: number;

  // GP Margin %
  gpMargin: number;
  gpMarginThaiPlus: number;

  // After VAT on commission
  netAfterVat: number;
  netAfterVatThaiPlus: number;

  // Recommended selling price to hit target margin
  recommendedPrice: (targetMargin: number) => number;

  // Status
  status: "healthy" | "warning" | "danger";
  statusThaiPlus: "healthy" | "warning" | "danger";
}

export function calculateGP(input: GPInput): GPResult {
  const {
    sellingPrice,
    foodCost,
    packagingCost,
    otherCost,
    restaurantDiscount,
    deliverySubsidy,
  } = input;

  const effectivePrice = sellingPrice - restaurantDiscount;
  const totalVariableCost = foodCost + packagingCost + otherCost + deliverySubsidy;

  // Normal commission (30%)
  const commissionNormal = effectivePrice * GRAB_NORMAL_COMMISSION;
  const vatOnCommissionNormal = commissionNormal * GRAB_VAT_ON_GP;
  const netRevenueNormal = effectivePrice - commissionNormal - vatOnCommissionNormal;
  const grossProfitNormal = netRevenueNormal - totalVariableCost;
  const gpMarginNormal = sellingPrice > 0 ? (grossProfitNormal / sellingPrice) * 100 : 0;

  // LINE MAN special program commission (23%)
  const commissionThaiPlus = effectivePrice * GRAB_THAI_PLUS_COMMISSION;
  const vatOnCommissionThaiPlus = commissionThaiPlus * GRAB_VAT_ON_GP;
  const netRevenueThaiPlus = effectivePrice - commissionThaiPlus - vatOnCommissionThaiPlus;
  const grossProfitThaiPlus = netRevenueThaiPlus - totalVariableCost;
  const gpMarginThaiPlus = sellingPrice > 0 ? (grossProfitThaiPlus / sellingPrice) * 100 : 0;

  const getStatus = (margin: number): "healthy" | "warning" | "danger" => {
    if (margin >= 30) return "healthy";
    if (margin >= 15) return "warning";
    return "danger";
  };

  const recommendedPrice = (targetMargin: number): number => {
    // Solve: (price * (1 - commission * 1.07) - totalVariableCost) / price = targetMargin/100
    // price * (1 - commission * 1.07) - totalVariableCost = price * targetMargin/100
    // price * (1 - commission * 1.07 - targetMargin/100) = totalVariableCost
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
  const commission = effectivePrice * commissionRate * (1 + GRAB_VAT_ON_GP);
  const netRevenue = effectivePrice - commission;
  const grossProfit = netRevenue - totalVariableCost - deliverySubsidy;
  const gpMargin = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;

  // Max discount before loss
  const maxDiscount = (() => {
    // netRevenue(price - d) - totalVariableCost - deliverySubsidy = 0
    // (price - d) * (1 - commission * 1.07) = totalVariableCost + deliverySubsidy
    const factor = 1 - commissionRate * (1 + GRAB_VAT_ON_GP);
    const minEffectivePrice = (totalVariableCost + deliverySubsidy) / factor;
    return Math.max(0, sellingPrice - minEffectivePrice);
  })();

  return {
    grossProfit,
    gpMargin,
    maxDiscount,
    isLoss: grossProfit < 0,
  };
}
