import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { calculateGP } from "@shared/gpCalculations";
import { getMarginStatus, StatusBadge } from "./StatusBadge";
import { InfoTooltip, TOOLTIPS } from "./InfoTooltip";
import { TrendingUp, DollarSign, Package, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardProps {
  sellingPrice: number;
  foodCost: number;
  packagingCost: number;
  otherCost: number;
  restaurantDiscount: number;
  deliverySubsidy: number;
}

const COLORS = {
  profit: "#16a34a",
  profitThaiPlus: "#22c55e",
  cost: "#f59e0b",
  commission: "#6b7280",
  delivery: "#3b82f6",
};

export function StoreDashboard(props: DashboardProps) {
  const result = useMemo(() => calculateGP(props), [props]);

  const barData = [
    {
      name: "ปกติ (30%)",
      "กำไร GP": Math.max(0, result.grossProfit),
      "ต้นทุนรวม": result.totalVariableCost,
      "ค่า Commission": props.sellingPrice * 0.30 * 1.07,
    },
    {
      name: "LINE MAN โปรแกรมพิเศษ (23%)",
      "กำไร GP": Math.max(0, result.grossProfitThaiPlus),
      "ต้นทุนรวม": result.totalVariableCost,
      "ค่า Commission": props.sellingPrice * 0.23 * 1.07,
    },
  ];

  const pieDataNormal = [
    { name: "กำไร GP", value: Math.max(0, result.grossProfit), color: COLORS.profit },
    { name: "ต้นทุนวัตถุดิบ", value: props.foodCost, color: COLORS.cost },
    { name: "บรรจุภัณฑ์", value: props.packagingCost, color: "#f97316" },
    { name: "ค่า Commission", value: props.sellingPrice * 0.30 * 1.07, color: COLORS.commission },
    { name: "อื่นๆ", value: props.otherCost + props.deliverySubsidy, color: COLORS.delivery },
  ].filter((d) => d.value > 0);

  const pieDataThaiPlus = [
    { name: "กำไร GP", value: Math.max(0, result.grossProfitThaiPlus), color: COLORS.profitThaiPlus },
    { name: "ต้นทุนวัตถุดิบ", value: props.foodCost, color: COLORS.cost },
    { name: "บรรจุภัณฑ์", value: props.packagingCost, color: "#f97316" },
    { name: "ค่า Commission", value: props.sellingPrice * 0.23 * 1.07, color: COLORS.commission },
    { name: "อื่นๆ", value: props.otherCost + props.deliverySubsidy, color: COLORS.delivery },
  ].filter((d) => d.value > 0);

  const statusNormal = getMarginStatus(result.gpMargin);
  const statusThaiPlus = getMarginStatus(result.gpMarginThaiPlus);

  const formatBaht = (v: number) => `฿${v.toFixed(0)}`;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          icon={<DollarSign className="w-4 h-4" />}
          label="ราคาขาย"
          value={`฿${props.sellingPrice}`}
          sub="ต่อออเดอร์"
          color="blue"
        />
        <KPICard
          icon={<Package className="w-4 h-4" />}
          label="ต้นทุนรวม"
          value={`฿${result.totalVariableCost.toFixed(0)}`}
          sub={`${((result.totalVariableCost / props.sellingPrice) * 100).toFixed(0)}% ของราคาขาย`}
          color="orange"
        />
        <KPICard
          icon={<TrendingUp className="w-4 h-4" />}
          label="GP ปกติ"
          value={`${result.gpMargin.toFixed(1)}%`}
          sub={`฿${result.grossProfit.toFixed(0)}`}
          color={statusNormal === "healthy" ? "green" : statusNormal === "warning" ? "yellow" : "red"}
          badge={<StatusBadge status={statusNormal} />}
        />
        <KPICard
          icon={<TrendingUp className="w-4 h-4" />}
          label="GP LINE MAN โปรพิเศษ"
          value={`${result.gpMarginThaiPlus.toFixed(1)}%`}
          sub={`฿${result.grossProfitThaiPlus.toFixed(0)}`}
          color={statusThaiPlus === "healthy" ? "green" : statusThaiPlus === "warning" ? "yellow" : "red"}
          badge={<StatusBadge status={statusThaiPlus} />}
        />
      </div>

      {/* Bar Chart */}
      <Card className="border-green-100">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-green-800">
            <BarChart2 className="w-5 h-5 text-green-600" />
            เปรียบเทียบกำไรและต้นทุน
            <InfoTooltip content="กราฟแสดงการเปรียบเทียบกำไร GP, ต้นทุนรวม และค่า Commission ระหว่าง Commission ปกติ กับ LINE MAN โปรแกรมพิเศษ" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={formatBaht} />
              <ReTooltip
                formatter={(v: number, name: string) => [`฿${v.toFixed(2)}`, name]}
                contentStyle={{ borderRadius: 8, border: "1px solid #d1fae5", fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="กำไร GP" fill={COLORS.profit} radius={[4, 4, 0, 0]} />
              <Bar dataKey="ต้นทุนรวม" fill={COLORS.cost} radius={[4, 4, 0, 0]} />
              <Bar dataKey="ค่า Commission" fill={COLORS.commission} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Donut Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DonutCard title="สัดส่วนต้นทุน (ปกติ 30%)" data={pieDataNormal} sellingPrice={props.sellingPrice} />
        <DonutCard title="สัดส่วนต้นทุน (LINE MAN โปรพิเศษ 23%)" data={pieDataThaiPlus} sellingPrice={props.sellingPrice} highlight />
      </div>
    </div>
  );
}

function KPICard({
  icon, label, value, sub, color, badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: "green" | "blue" | "orange" | "yellow" | "red";
  badge?: React.ReactNode;
}) {
  const colorMap = {
    green: "bg-green-50 text-green-700 border-green-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };
  const iconColorMap = {
    green: "text-green-500",
    blue: "text-blue-500",
    orange: "text-orange-500",
    yellow: "text-yellow-500",
    red: "text-red-500",
  };
  return (
    <div className={cn("rounded-xl border p-3 space-y-1", colorMap[color])}>
      <div className={cn("flex items-center gap-1.5 text-xs font-medium opacity-70", iconColorMap[color])}>
        {icon}
        {label}
      </div>
      <p className="text-xl font-bold num">{value}</p>
      <p className="text-xs opacity-60">{sub}</p>
      {badge && <div className="mt-1">{badge}</div>}
    </div>
  );
}

function DonutCard({
  title, data, sellingPrice, highlight,
}: {
  title: string;
  data: { name: string; value: number; color: string }[];
  sellingPrice: number;
  highlight?: boolean;
}) {
  return (
    <Card className={cn("border", highlight ? "border-green-200 bg-green-50/30" : "border-gray-200")}>
      <CardHeader className="pb-2">
        <CardTitle className={cn("text-sm font-semibold", highlight ? "text-green-700" : "text-gray-600")}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <ReTooltip
              formatter={(v: number, name: string) => [
                `฿${v.toFixed(2)} (${((v / sellingPrice) * 100).toFixed(1)}%)`,
                name,
              ]}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
