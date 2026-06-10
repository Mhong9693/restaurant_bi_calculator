import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateBreakEven } from "@shared/gpCalculations";
import { InfoTooltip, TOOLTIPS } from "./InfoTooltip";
import { Target, Building2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreakEvenProps {
  avgGrossProfitPerOrder: number;
}

export function BreakEvenSection({ avgGrossProfitPerOrder }: BreakEvenProps) {
  const [fixedCosts, setFixedCosts] = useState({
    rent: 8000,
    salary: 15000,
    utilities: 3000,
    other: 2000,
  });

  const totalFixed = Object.values(fixedCosts).reduce((a, b) => a + b, 0);
  const result = calculateBreakEven(totalFixed, avgGrossProfitPerOrder);

  const costItems = [
    { key: "rent" as const, label: "ค่าเช่าร้าน / เช่าครัว", icon: <Building2 className="w-3.5 h-3.5 text-green-600" /> },
    { key: "salary" as const, label: "ค่าแรงพนักงาน", icon: <TrendingUp className="w-3.5 h-3.5 text-green-600" /> },
    { key: "utilities" as const, label: "ค่าน้ำ ค่าไฟ ค่าแก๊ส", icon: <Building2 className="w-3.5 h-3.5 text-green-600" /> },
    { key: "other" as const, label: "ค่าใช้จ่ายอื่นๆ", icon: <Building2 className="w-3.5 h-3.5 text-green-600" /> },
  ];

  const progressPercent = Math.min(100, (result.ordersPerDay / 50) * 100);

  return (
    <div className="space-y-5">
      {/* Fixed Costs Input */}
      <Card className="border-green-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-green-800">
            <Building2 className="w-5 h-5 text-green-600" />
            ต้นทุนคงที่รายเดือน
            <InfoTooltip content={TOOLTIPS.fixedCost} />
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {costItems.map(({ key, label, icon }) => (
            <div key={key} className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                {icon}
                {label}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">฿</span>
                <Input
                  type="number"
                  min={0}
                  value={fixedCosts[key] === 0 ? "" : fixedCosts[key]}
                  onChange={(e) => setFixedCosts((prev) => ({ ...prev, [key]: Number(e.target.value) || 0 }))}
                  className="pl-8 text-right font-mono"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-green-800">
            <Target className="w-5 h-5 text-green-600" />
            ผลการคำนวณจุดคุ้มทุน
            <InfoTooltip content={TOOLTIPS.breakEven} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-white rounded-xl border border-green-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">ต้นทุนคงที่รวม</p>
              <p className="text-lg font-bold text-gray-800 num">฿{totalFixed.toLocaleString("th-TH")}</p>
              <p className="text-xs text-gray-400">ต่อเดือน</p>
            </div>
            <div className="text-center p-3 bg-white rounded-xl border border-green-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">GP เฉลี่ยต่อออเดอร์</p>
              <p className="text-lg font-bold text-green-700 num">฿{avgGrossProfitPerOrder.toFixed(2)}</p>
              <p className="text-xs text-gray-400">ต่อออเดอร์</p>
            </div>
            <div className={cn(
              "text-center p-3 rounded-xl border shadow-sm",
              result.ordersPerDay <= 20 ? "bg-green-50 border-green-200" :
              result.ordersPerDay <= 40 ? "bg-yellow-50 border-yellow-200" :
              "bg-red-50 border-red-200"
            )}>
              <p className="text-xs text-gray-500 mb-1">ออเดอร์ต่อวัน</p>
              <p className={cn(
                "text-lg font-bold num",
                result.ordersPerDay <= 20 ? "text-green-700" :
                result.ordersPerDay <= 40 ? "text-yellow-700" : "text-red-700"
              )}>
                {result.ordersPerDay}
              </p>
              <p className="text-xs text-gray-400">ออเดอร์</p>
            </div>
          </div>

          {/* Big number */}
          <div className="text-center py-4 border-t border-green-100">
            <p className="text-sm text-gray-500 mb-1">ต้องขายอย่างน้อย</p>
            <p className="text-5xl font-bold text-green-700 num">{result.ordersPerDay}</p>
            <p className="text-lg text-gray-600 mt-1">ออเดอร์ต่อวัน</p>
            <p className="text-sm text-gray-400 mt-1">({result.ordersPerMonth} ออเดอร์ต่อเดือน)</p>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>ง่าย (1-20 ออเดอร์/วัน)</span>
              <span>ท้าทาย (40+ ออเดอร์/วัน)</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  progressPercent <= 40 ? "bg-green-500" :
                  progressPercent <= 80 ? "bg-yellow-500" : "bg-red-500"
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-center text-gray-500">
              {result.ordersPerDay <= 20
                ? "✅ จุดคุ้มทุนอยู่ในระดับที่ทำได้"
                : result.ordersPerDay <= 40
                ? "⚠️ จุดคุ้มทุนค่อนข้างสูง ควรลดต้นทุนคงที่"
                : "🔴 จุดคุ้มทุนสูงมาก ควรทบทวนโครงสร้างต้นทุน"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
