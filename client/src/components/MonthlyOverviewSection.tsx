import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { InfoTooltip } from "./InfoTooltip";
import { TrendingUp, TrendingDown, Minus, CalendarDays, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, ReferenceLine, Legend, LineChart, Line
} from "recharts";

interface MonthlyOverviewProps {
  sessionId: string;
  normalGpPerOrder: number;
  plusGpPerOrder: number;
  normalAvgPrice: number;
  plusAvgPrice: number;
}

function formatThaiDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

export function MonthlyOverviewSection({
  sessionId,
  normalGpPerOrder,
  plusGpPerOrder,
  normalAvgPrice,
  plusAvgPrice,
}: MonthlyOverviewProps) {
  const [fixedCostMonthly, setFixedCostMonthly] = useState(0);

  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().split("T")[0];
  }, []);

  const { data: rangeData } = trpc.dailyLogs.getRange.useQuery(
    { sessionId, startDate: thirtyDaysAgo, endDate: today },
    { enabled: !!sessionId }
  );

  // 30-day trend chart data (orders per day)
  const trendData = useMemo(() => {
    if (!rangeData || rangeData.length === 0) return [];
    return rangeData.map((log) => ({
      date: formatThaiDate(log.logDate),
      ปกติ: log.normalOrders,
      พลัส: log.plusOrders,
      กำไรรวม: Math.round(log.normalOrders * normalGpPerOrder + log.plusOrders * plusGpPerOrder),
    }));
  }, [rangeData, normalGpPerOrder, plusGpPerOrder]);

  const totals = useMemo(() => {
    if (!rangeData || rangeData.length === 0) return null;
    const normalOrders = rangeData.reduce((s, l) => s + l.normalOrders, 0);
    const plusOrders = rangeData.reduce((s, l) => s + l.plusOrders, 0);
    const normalRevenue = normalOrders * normalAvgPrice;
    const plusRevenue = plusOrders * plusAvgPrice;
    const normalCost = normalRevenue - normalOrders * normalGpPerOrder;
    const plusCost = plusRevenue - plusOrders * plusGpPerOrder;
    const normalProfit = normalOrders * normalGpPerOrder;
    const plusProfit = plusOrders * plusGpPerOrder;
    const totalOrders = normalOrders + plusOrders;
    const totalRevenue = normalRevenue + plusRevenue;
    const totalCost = normalCost + plusCost;
    const totalGrossProfit = normalProfit + plusProfit;
    const netProfit = totalGrossProfit - fixedCostMonthly;
    const blendedGpPerOrder = totalOrders > 0 ? totalGrossProfit / totalOrders : 0;
    const plusRatio = totalOrders > 0 ? (plusOrders / totalOrders) * 100 : 0;

    // How many plus orders needed to replace 1 normal order's profit
    const plusNeededToReplaceNormal =
      normalGpPerOrder > 0 && plusGpPerOrder > 0
        ? normalGpPerOrder / plusGpPerOrder
        : 0;

    // If all normal orders switched to plus, how many plus orders needed to keep same profit
    const plusToOffsetAllNormal =
      plusGpPerOrder > 0 ? Math.ceil((normalOrders * normalGpPerOrder) / plusGpPerOrder) : 0;

    return {
      normalOrders, plusOrders, normalRevenue, plusRevenue,
      normalCost, plusCost, normalProfit, plusProfit,
      totalOrders, totalRevenue, totalCost, totalGrossProfit,
      netProfit, blendedGpPerOrder, plusRatio,
      plusNeededToReplaceNormal, plusToOffsetAllNormal,
    };
  }, [rangeData, normalGpPerOrder, plusGpPerOrder, normalAvgPrice, plusAvgPrice, fixedCostMonthly]);

  const netStatus = totals ? (totals.netProfit > 0 ? "profit" : totals.netProfit === 0 ? "breakeven" : "loss") : null;

  return (
    <div className="space-y-6">
      {/* Fixed Cost Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-gray-800">
            <CalendarDays className="w-5 h-5 text-[#0EC963]" />
            ภาพรวมรายเดือน (30 วันที่ผ่านมา)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-1">
              ต้นทุนคงที่รายเดือน (ไม่บังคับ)
              <InfoTooltip content="ค่าเช่า ค่าแรง ค่าน้ำ ค่าไฟ และค่าใช้จ่ายประจำอื่นๆ ต่อเดือน" />
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">฿</span>
              <Input
                type="number"
                min="0"
                value={fixedCostMonthly || ""}
                onChange={(e) => setFixedCostMonthly(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="pl-7 text-right font-mono"
              />
            </div>
          </div>

          {!totals && (
            <div className="text-center py-8 text-gray-400">
              <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">ยังไม่มีข้อมูลออเดอร์</p>
              <p className="text-xs mt-1">บันทึกออเดอร์รายวันในแท็บ "บันทึกรายวัน" ก่อนครับ</p>
            </div>
          )}
        </CardContent>
      </Card>

      {totals && (
        <>
          {/* Revenue & Cost Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-gray-800">ยอดขายและต้นทุนแต่ละช่องทาง</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-gray-500 font-medium">รายการ</th>
                      <th className="text-right py-2 text-gray-500 font-medium">ออเดอร์ปกติ</th>
                      <th className="text-right py-2 text-[#0aaa54] font-medium">ไทยช่วยไทยพลัส</th>
                      <th className="text-right py-2 text-gray-700 font-medium">รวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <tr>
                      <td className="py-2.5 text-gray-600">จำนวนออเดอร์</td>
                      <td className="py-2.5 text-right font-mono text-gray-700">{totals.normalOrders}</td>
                      <td className="py-2.5 text-right font-mono text-[#0EC963] font-semibold">{totals.plusOrders}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-gray-800">{totals.totalOrders}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-gray-600">ยอดขายรวม</td>
                      <td className="py-2.5 text-right font-mono text-gray-700">฿{totals.normalRevenue.toFixed(0)}</td>
                      <td className="py-2.5 text-right font-mono text-[#0EC963] font-semibold">฿{totals.plusRevenue.toFixed(0)}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-gray-800">฿{totals.totalRevenue.toFixed(0)}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-gray-600">ต้นทุนรวม</td>
                      <td className="py-2.5 text-right font-mono text-red-500">฿{totals.normalCost.toFixed(0)}</td>
                      <td className="py-2.5 text-right font-mono text-red-400">฿{totals.plusCost.toFixed(0)}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-red-500">฿{totals.totalCost.toFixed(0)}</td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="py-2.5 text-gray-700 font-semibold">กำไรขั้นต้น</td>
                      <td className="py-2.5 text-right font-mono font-semibold text-gray-700">฿{totals.normalProfit.toFixed(0)}</td>
                      <td className="py-2.5 text-right font-mono font-semibold text-[#0EC963]">฿{totals.plusProfit.toFixed(0)}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-[#0EC963]">฿{totals.totalGrossProfit.toFixed(0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                <span>Blended GP ต่อออเดอร์</span>
                <span className="font-semibold text-[#0EC963] text-sm">฿{totals.blendedGpPerOrder.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-gray-500 mb-1">ออเดอร์รวม 30 วัน</p>
                <p className="text-2xl font-bold text-gray-800 num">{totals.totalOrders}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge variant="outline" className="text-xs text-gray-500">ปกติ {totals.normalOrders}</Badge>
                  <Badge className="text-xs bg-[#0EC963] text-white">พลัส {totals.plusOrders}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#0EC963]/30 bg-green-50">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-[#0aaa54] mb-1">กำไรขั้นต้นรวม</p>
                <p className="text-2xl font-bold text-[#0EC963] num">฿{totals.totalGrossProfit.toFixed(0)}</p>
                <p className="text-xs text-[#0aaa54] mt-1">
                  สัดส่วนพลัส {totals.plusRatio.toFixed(0)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Net Profit Banner */}
          {fixedCostMonthly > 0 && (
            <Card className={cn(
              "border-2",
              netStatus === "profit" ? "border-[#0EC963] bg-green-50" :
              netStatus === "breakeven" ? "border-yellow-400 bg-yellow-50" :
              "border-red-400 bg-red-50"
            )}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      กำไรสุทธิหลังหักต้นทุนคงที่
                      <InfoTooltip content="กำไรขั้นต้นรวม หักด้วยต้นทุนคงที่รายเดือน (ค่าเช่า ค่าแรง ฯลฯ)" />
                    </p>
                    <p className={cn(
                      "text-3xl font-bold num mt-1",
                      netStatus === "profit" ? "text-[#0EC963]" :
                      netStatus === "breakeven" ? "text-yellow-600" :
                      "text-red-600"
                    )}>
                      {totals.netProfit >= 0 ? "+" : ""}฿{totals.netProfit.toFixed(0)}
                    </p>
                  </div>
                  <div className="text-right">
                    {netStatus === "profit" ? (
                      <TrendingUp className="w-10 h-10 text-[#0EC963]" />
                    ) : netStatus === "breakeven" ? (
                      <Minus className="w-10 h-10 text-yellow-500" />
                    ) : (
                      <TrendingDown className="w-10 h-10 text-red-500" />
                    )}
                    <p className={cn(
                      "text-xs mt-1 font-medium",
                      netStatus === "profit" ? "text-[#0aaa54]" :
                      netStatus === "breakeven" ? "text-yellow-600" :
                      "text-red-500"
                    )}>
                      {netStatus === "profit" ? "กำไร" : netStatus === "breakeven" ? "คุ้มทุน" : "ขาดทุน"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-xs text-gray-500">
                  <span>กำไรขั้นต้น: ฿{totals.totalGrossProfit.toFixed(0)}</span>
                  <span>ต้นทุนคงที่: ฿{fixedCostMonthly.toFixed(0)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plus Offset Calculator */}
          <Card className="border-[#0EC963]/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-gray-800">
                <ArrowRightLeft className="w-5 h-5 text-[#0EC963]" />
                ออเดอร์พลัสที่ต้องชดเชยออเดอร์ปกติ
                <InfoTooltip content="ถ้าออเดอร์ปกติหายไปทั้งหมด ต้องได้ออเดอร์พลัสเพิ่มกี่ออเดอร์เพื่อรักษากำไรเดิม" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-green-50 border border-[#0EC963]/30 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">ออเดอร์พลัสต่อ 1 ออเดอร์ปกติ</span>
                  <span className="font-bold text-[#0EC963] num">
                    {totals.plusNeededToReplaceNormal.toFixed(2)} ออเดอร์
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    ชดเชยออเดอร์ปกติ {totals.normalOrders} ออเดอร์ทั้งหมด
                  </span>
                  <span className="font-bold text-[#0EC963] num text-lg">
                    {totals.plusToOffsetAllNormal} ออเดอร์
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                * คำนวณจากกำไรต่อออเดอร์: ปกติ ฿{normalGpPerOrder.toFixed(2)} | พลัส ฿{plusGpPerOrder.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          {/* 30-Day Trend Chart (Orders) */}
          {trendData.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-gray-800">Trend ออเดอร์ 30 วัน</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <ReTooltip
                      formatter={(v: number, name: string) => [`${v} ออเดอร์`, name]}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="ปกติ" fill="#9ca3af" radius={[2, 2, 0, 0]} stackId="a" />
                    <Bar dataKey="พลัส" fill="#0EC963" radius={[2, 2, 0, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* 30-Day Profit Trend (Line Chart) */}
          {trendData.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-gray-800">Trend กำไรรายวัน 30 วัน</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `฿${v}`} />
                    <ReTooltip
                      formatter={(v: number) => [`฿${v}`, "กำไรรวม"]}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    {fixedCostMonthly > 0 && (
                      <ReferenceLine
                        y={Math.round(fixedCostMonthly / 30)}
                        stroke="#ef4444"
                        strokeDasharray="4 4"
                        label={{ value: "ต้นทุน/วัน", position: "right", fontSize: 9, fill: "#ef4444" }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="กำไรรวม"
                      stroke="#0EC963"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
