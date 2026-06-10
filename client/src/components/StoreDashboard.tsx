import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { getMarginStatus, StatusBadge } from "./StatusBadge";
import { InfoTooltip } from "./InfoTooltip";
import { TrendingUp, DollarSign, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardProps {
  normalAvgPrice: number;
  normalGpPercent: number;
  plusAvgPrice: number;
  plusGpPercent: number;
  normalGpPerOrder: number;
  plusGpPerOrder: number;
}

const COLORS = {
  profit: "#0aaa54",
  profitPlus: "#0EC963",
  cost: "#f59e0b",
  commission: "#6b7280",
};

export function StoreDashboard({
  normalAvgPrice,
  normalGpPercent,
  plusAvgPrice,
  plusGpPercent,
  normalGpPerOrder,
  plusGpPerOrder,
}: DashboardProps) {

  const normalCostPerOrder = normalAvgPrice - normalGpPerOrder;
  const plusCostPerOrder = plusAvgPrice - plusGpPerOrder;
  const diffGp = plusGpPerOrder - normalGpPerOrder;
  const diffPercent = plusGpPercent - normalGpPercent;

  const barData = useMemo(() => [
    {
      name: "ออเดอร์ปกติ",
      "กำไร GP": Math.round(normalGpPerOrder),
      "ต้นทุน": Math.round(normalCostPerOrder),
    },
    {
      name: "ไทยช่วยไทยพลัส",
      "กำไร GP": Math.round(plusGpPerOrder),
      "ต้นทุน": Math.round(plusCostPerOrder),
    },
  ], [normalGpPerOrder, plusGpPerOrder, normalCostPerOrder, plusCostPerOrder]);

  const normalPieData = useMemo(() => [
    { name: "กำไร GP", value: Math.round(normalGpPerOrder), color: COLORS.profit },
    { name: "ต้นทุน", value: Math.round(normalCostPerOrder), color: COLORS.cost },
  ], [normalGpPerOrder, normalCostPerOrder]);

  const plusPieData = useMemo(() => [
    { name: "กำไร GP", value: Math.round(plusGpPerOrder), color: COLORS.profitPlus },
    { name: "ต้นทุน", value: Math.round(plusCostPerOrder), color: COLORS.cost },
  ], [plusGpPerOrder, plusCostPerOrder]);

  const normalStatus = getMarginStatus(normalGpPercent);
  const plusStatus = getMarginStatus(plusGpPercent);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-gray-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs text-gray-500">กำไร/ออเดอร์ปกติ</p>
              <StatusBadge status={normalStatus} />
            </div>
            <p className="text-2xl font-bold text-gray-800 num">฿{normalGpPerOrder.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">GP {normalGpPercent.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card className="border-[#0EC963]/40 bg-green-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs text-[#0aaa54]">กำไร/ออเดอร์พลัส</p>
              <StatusBadge status={plusStatus} />
            </div>
            <p className="text-2xl font-bold text-[#0EC963] num">฿{plusGpPerOrder.toFixed(2)}</p>
            <p className="text-xs text-[#0aaa54] mt-1">GP {plusGpPercent.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card className={cn("border-2", diffGp >= 0 ? "border-[#0EC963]/40 bg-green-50" : "border-red-200 bg-red-50")}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs text-gray-500">ผลต่างกำไร/ออเดอร์</p>
              <TrendingUp className={cn("w-4 h-4", diffGp >= 0 ? "text-[#0EC963]" : "text-red-500")} />
            </div>
            <p className={cn("text-2xl font-bold num", diffGp >= 0 ? "text-[#0EC963]" : "text-red-600")}>
              {diffGp >= 0 ? "+" : ""}฿{diffGp.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {diffPercent >= 0 ? "+" : ""}{diffPercent.toFixed(1)}% GP Margin
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs text-gray-500">
                กำไรเพิ่ม 100 ออเดอร์พลัส
                <InfoTooltip content="ถ้าออเดอร์ 100 ออเดอร์เป็นไทยช่วยไทยพลัสทั้งหมด คุณจะได้กำไรเพิ่มขึ้นเท่าไหร่" />
              </p>
              <DollarSign className="w-4 h-4 text-[#0EC963]" />
            </div>
            <p className="text-2xl font-bold text-[#0EC963] num">
              ฿{(diffGp * 100).toFixed(0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">ต่อ 100 ออเดอร์</p>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-gray-800">
            <BarChart2 className="w-5 h-5 text-[#0EC963]" />
            เปรียบเทียบกำไรและต้นทุนต่อออเดอร์
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `฿${v}`} />
              <ReTooltip
                formatter={(value: number, name: string) => [`฿${value}`, name]}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="กำไร GP" fill={COLORS.profitPlus} radius={[4, 4, 0, 0]} />
              <Bar dataKey="ต้นทุน" fill={COLORS.cost} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Donut Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">สัดส่วนต้นทุน — ออเดอร์ปกติ</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={normalPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {normalPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReTooltip formatter={(v: number) => [`฿${v}`, ""]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-center text-xs text-gray-500 mt-1">ราคาขายเฉลี่ย ฿{normalAvgPrice}</p>
          </CardContent>
        </Card>

        <Card className="border-[#0EC963]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#0aaa54]">สัดส่วนต้นทุน — ไทยช่วยไทยพลัส</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={plusPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {plusPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReTooltip formatter={(v: number) => [`฿${v}`, ""]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-center text-xs text-[#0aaa54] mt-1">ราคาขายเฉลี่ย ฿{plusAvgPrice}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
