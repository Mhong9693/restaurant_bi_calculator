import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateMonthlyOverview } from "@shared/gpCalculations";
import { InfoTooltip, TOOLTIPS } from "./InfoTooltip";
import { Calendar, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthlyOverviewProps {
  avgGrossProfitPerOrder: number;
}

export function MonthlyOverviewSection({ avgGrossProfitPerOrder }: MonthlyOverviewProps) {
  const [actualOrders, setActualOrders] = useState(300);
  const [fixedCostMonthly, setFixedCostMonthly] = useState(28000);

  const overview = calculateMonthlyOverview(actualOrders, avgGrossProfitPerOrder, fixedCostMonthly);
  const isProfit = overview.netProfit >= 0;

  return (
    <div className="space-y-5">
      {/* Inputs */}
      <Card className="border-green-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-green-800">
            <Calendar className="w-5 h-5 text-green-600" />
            ข้อมูลรายเดือน
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              จำนวนออเดอร์จริงในเดือนนี้
              <InfoTooltip content="จำนวนออเดอร์ที่ขายได้จริงในเดือนนี้ รวมทุกแพลตฟอร์ม" />
            </Label>
            <div className="relative">
              <Input
                type="number"
                min={0}
                value={actualOrders === 0 ? "" : actualOrders}
                onChange={(e) => setActualOrders(Number(e.target.value) || 0)}
                className="text-right font-mono pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">ออเดอร์</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              ต้นทุนคงที่รายเดือน
              <InfoTooltip content={TOOLTIPS.fixedCost} />
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">฿</span>
              <Input
                type="number"
                min={0}
                value={fixedCostMonthly === 0 ? "" : fixedCostMonthly}
                onChange={(e) => setFixedCostMonthly(Number(e.target.value) || 0)}
                className="pl-8 text-right font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={<DollarSign className="w-4 h-4" />}
          label="กำไรขั้นต้นรวม"
          value={`฿${overview.totalGrossProfit.toLocaleString("th-TH", { minimumFractionDigits: 0 })}`}
          sub="ก่อนหักต้นทุนคงที่"
          color="blue"
          tooltip={TOOLTIPS.gp}
        />
        <MetricCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="GP เฉลี่ยต่อออเดอร์"
          value={`฿${overview.avgGPPerOrder.toFixed(2)}`}
          sub="ต่อออเดอร์"
          color="green"
          tooltip={TOOLTIPS.gpMargin}
        />
        <MetricCard
          icon={<DollarSign className="w-4 h-4" />}
          label="ต้นทุนคงที่"
          value={`฿${fixedCostMonthly.toLocaleString("th-TH")}`}
          sub="ต่อเดือน"
          color="orange"
          tooltip={TOOLTIPS.fixedCost}
        />
        <MetricCard
          icon={isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          label="กำไรสุทธิ"
          value={`${isProfit ? "+" : ""}฿${overview.netProfit.toLocaleString("th-TH", { minimumFractionDigits: 0 })}`}
          sub={isProfit ? "กำไร 🎉" : "ขาดทุน ⚠️"}
          color={isProfit ? "green" : "red"}
          tooltip={TOOLTIPS.netProfit}
          highlight
        />
      </div>

      {/* Net Profit Banner */}
      <div className={cn(
        "rounded-xl p-5 text-center",
        isProfit ? "bg-green-600 text-white" : "bg-red-500 text-white"
      )}>
        <p className="text-sm opacity-90 mb-1">กำไรสุทธิประจำเดือน</p>
        <p className="text-4xl font-bold num">
          {isProfit ? "+" : ""}฿{overview.netProfit.toLocaleString("th-TH", { minimumFractionDigits: 0 })}
        </p>
        <p className="text-sm opacity-80 mt-2">
          {isProfit
            ? `ยอดดี! ขายได้ ${actualOrders} ออเดอร์ กำไรสุทธิ ฿${overview.netProfit.toLocaleString("th-TH")}`
            : `ขาดทุน ฿${Math.abs(overview.netProfit).toLocaleString("th-TH")} ต้องเพิ่มออเดอร์หรือลดต้นทุน`}
        </p>
      </div>

      {/* Monthly breakdown */}
      <Card className="border-green-100">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">รายละเอียดรายเดือน</p>
          <div className="space-y-2 text-sm">
            {[
              { label: "รายได้ GP รวม", value: overview.totalGrossProfit, color: "text-green-700" },
              { label: "หัก: ต้นทุนคงที่", value: -fixedCostMonthly, color: "text-red-600" },
              { label: "กำไรสุทธิ", value: overview.netProfit, color: isProfit ? "text-green-700 font-bold" : "text-red-600 font-bold", border: true },
            ].map(({ label, value, color, border }) => (
              <div key={label} className={cn("flex justify-between py-1", border && "border-t border-gray-200 mt-1 pt-2")}>
                <span className="text-gray-600">{label}</span>
                <span className={cn("num font-medium", color)}>
                  {value >= 0 ? "+" : ""}฿{value.toLocaleString("th-TH", { minimumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon, label, value, sub, color, tooltip, highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: "green" | "blue" | "orange" | "red";
  tooltip?: string;
  highlight?: boolean;
}) {
  const colorMap = {
    green: "bg-green-50 text-green-700 border-green-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <div className={cn("rounded-xl border p-3 space-y-1", colorMap[color], highlight && "shadow-md")}>
      <div className="flex items-center gap-1 text-xs opacity-70">
        {icon}
        {label}
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>
      <p className="text-lg font-bold num">{value}</p>
      <p className="text-xs opacity-60">{sub}</p>
    </div>
  );
}
