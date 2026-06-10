import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { InfoTooltip } from "./InfoTooltip";
import { Save, CalendarDays, TrendingUp, ShoppingBag, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

interface DailyLogProps {
  sessionId: string;
  normalGpPerOrder: number;
  plusGpPerOrder: number;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatThaiDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

export function DailyLogSection({ sessionId, normalGpPerOrder, plusGpPerOrder }: DailyLogProps) {
  const today = formatDate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [normalOrders, setNormalOrders] = useState(0);
  const [plusOrders, setPlusOrders] = useState(0);

  // Get last 30 days range
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return formatDate(d);
  }, []);

  const { data: todayLog, refetch: refetchToday } = trpc.dailyLogs.getByDate.useQuery(
    { sessionId, logDate: selectedDate },
    { enabled: !!sessionId }
  );

  const { data: rangeData, refetch: refetchRange } = trpc.dailyLogs.getRange.useQuery(
    { sessionId, startDate: thirtyDaysAgo, endDate: today },
    { enabled: !!sessionId }
  );

  // Sync form with loaded data
  useState(() => {
    if (todayLog) {
      setNormalOrders(todayLog.normalOrders);
      setPlusOrders(todayLog.plusOrders);
    }
  });

  const saveMutation = trpc.dailyLogs.save.useMutation({
    onSuccess: () => {
      toast.success(`บันทึกข้อมูลวันที่ ${formatThaiDate(selectedDate)} สำเร็จ`);
      refetchToday();
      refetchRange();
    },
    onError: () => toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่"),
  });

  const handleSave = () => {
    saveMutation.mutate({ sessionId, logDate: selectedDate, normalOrders, plusOrders });
  };

  // Computed values for today
  const normalProfit = normalOrders * normalGpPerOrder;
  const plusProfit = plusOrders * plusGpPerOrder;
  const totalOrders = normalOrders + plusOrders;
  const totalProfit = normalProfit + plusProfit;
  const plusRatio = totalOrders > 0 ? (plusOrders / totalOrders) * 100 : 0;

  // Chart data from range
  const chartData = useMemo(() => {
    if (!rangeData) return [];
    return rangeData.slice(-14).map((log) => ({
      date: formatThaiDate(log.logDate),
      ปกติ: log.normalOrders,
      พลัส: log.plusOrders,
      "กำไรปกติ": Math.round(log.normalOrders * normalGpPerOrder),
      "กำไรพลัส": Math.round(log.plusOrders * plusGpPerOrder),
    }));
  }, [rangeData, normalGpPerOrder, plusGpPerOrder]);

  // Monthly totals from range
  const monthlyTotals = useMemo(() => {
    if (!rangeData) return { normalOrders: 0, plusOrders: 0, normalProfit: 0, plusProfit: 0 };
    return rangeData.reduce((acc, log) => ({
      normalOrders: acc.normalOrders + log.normalOrders,
      plusOrders: acc.plusOrders + log.plusOrders,
      normalProfit: acc.normalProfit + log.normalOrders * normalGpPerOrder,
      plusProfit: acc.plusProfit + log.plusOrders * plusGpPerOrder,
    }), { normalOrders: 0, plusOrders: 0, normalProfit: 0, plusProfit: 0 });
  }, [rangeData, normalGpPerOrder, plusGpPerOrder]);

  const totalMonthlyOrders = monthlyTotals.normalOrders + monthlyTotals.plusOrders;
  const plusMonthlyRatio = totalMonthlyOrders > 0 ? (monthlyTotals.plusOrders / totalMonthlyOrders) * 100 : 0;

  const pieData = [
    { name: "ออเดอร์ปกติ", value: monthlyTotals.normalOrders, color: "#9ca3af" },
    { name: "ไทยช่วยไทยพลัส", value: monthlyTotals.plusOrders, color: "#FF671F" },
  ];

  return (
    <div className="space-y-6">
      {/* Date Picker + Input */}
      <Card className="border-[#FF671F]/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-gray-800">
            <CalendarDays className="w-5 h-5 text-[#FF671F]" />
            บันทึกออเดอร์รายวัน
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">เลือกวันที่</Label>
            <Input
              type="date"
              value={selectedDate}
              max={today}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setNormalOrders(0);
                setPlusOrders(0);
              }}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5 text-gray-500" />
                ออเดอร์ปกติ
                <InfoTooltip content="จำนวนออเดอร์ที่ได้รับจากช่องทางปกติในวันนี้" />
              </Label>
              <Input
                type="number"
                min="0"
                value={normalOrders || ""}
                onChange={(e) => setNormalOrders(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="text-right font-mono text-lg"
              />
              <p className="text-xs text-gray-500 text-right">
                กำไร: <span className="font-medium text-gray-700">฿{normalProfit.toFixed(0)}</span>
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#FF671F]" />
                ออเดอร์ไทยช่วยไทยพลัส
                <InfoTooltip content="จำนวนออเดอร์ที่ได้รับจากโปรแกรมไทยช่วยไทยพลัสในวันนี้" />
              </Label>
              <Input
                type="number"
                min="0"
                value={plusOrders || ""}
                onChange={(e) => setPlusOrders(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="text-right font-mono text-lg border-[#FF671F]/50 focus:border-[#FF671F]"
              />
              <p className="text-xs text-[#EB4700] text-right">
                กำไร: <span className="font-medium">฿{plusProfit.toFixed(0)}</span>
              </p>
            </div>
          </div>

          {/* Daily Summary */}
          {totalOrders > 0 && (
            <div className="rounded-xl bg-orange-50 border border-[#FF671F]/30 p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">ออเดอร์รวมวันนี้</span>
                <span className="font-bold text-gray-800 num">{totalOrders} ออเดอร์</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">กำไรรวมวันนี้</span>
                <span className="font-bold text-[#FF671F] num">฿{totalProfit.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">สัดส่วนออเดอร์พลัส</span>
                <Badge className={cn(
                  "text-xs",
                  plusRatio >= 50 ? "bg-[#FF671F] text-white" : "bg-gray-100 text-gray-600"
                )}>
                  {plusRatio.toFixed(0)}%
                </Badge>
              </div>
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="w-full bg-[#FF671F] hover:bg-[#EB4700] text-white gap-2"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? "กำลังบันทึก..." : "บันทึกข้อมูลวันนี้"}
          </Button>
        </CardContent>
      </Card>

      {/* 14-Day Bar Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-gray-800">
              <TrendingUp className="w-5 h-5 text-[#FF671F]" />
              ออเดอร์ย้อนหลัง 14 วัน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <ReTooltip
                  formatter={(value: number, name: string) => [`${value} ออเดอร์`, name]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="ปกติ" fill="#9ca3af" radius={[3, 3, 0, 0]} />
                <Bar dataKey="พลัส" fill="#FF671F" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Monthly Summary */}
      {totalMonthlyOrders > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-gray-800">สรุป 30 วันที่ผ่านมา</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-xl bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-700 num">{monthlyTotals.normalOrders}</p>
                <p className="text-xs text-gray-500 mt-1">ออเดอร์ปกติ</p>
                <p className="text-sm font-semibold text-gray-600 mt-1">฿{monthlyTotals.normalProfit.toFixed(0)}</p>
              </div>
              <div className="rounded-xl bg-orange-50 border border-[#FF671F]/30 p-3 text-center">
                <p className="text-2xl font-bold text-[#FF671F] num">{monthlyTotals.plusOrders}</p>
                <p className="text-xs text-[#EB4700] mt-1">ออเดอร์พลัส</p>
                <p className="text-sm font-semibold text-[#EB4700] mt-1">฿{monthlyTotals.plusProfit.toFixed(0)}</p>
              </div>
            </div>

            {/* Donut Chart */}
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <ReTooltip
                    formatter={(value: number, name: string) => [`${value} ออเดอร์`, name]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center mt-2">
                <p className="text-sm text-gray-600">สัดส่วนออเดอร์ไทยช่วยไทยพลัส</p>
                <p className={cn(
                  "text-2xl font-bold num mt-1",
                  plusMonthlyRatio >= 50 ? "text-[#FF671F]" : "text-gray-600"
                )}>
                  {plusMonthlyRatio.toFixed(1)}%
                </p>
                {plusMonthlyRatio >= 50 ? (
                  <p className="text-xs text-[#EB4700] mt-1">🎉 ออเดอร์พลัสมากกว่าครึ่ง — ดีมาก!</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">💡 เพิ่มออเดอร์พลัสเพื่อกำไรที่สูงขึ้น</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {chartData.length === 0 && (
        <Card className="border-dashed border-gray-200">
          <CardContent className="py-10 text-center text-gray-400">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">ยังไม่มีข้อมูล</p>
            <p className="text-xs mt-1">เริ่มบันทึกออเดอร์รายวันเพื่อดูกราฟและสรุปผล</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
