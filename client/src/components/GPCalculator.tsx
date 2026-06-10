import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { InfoTooltip, TOOLTIPS } from "./InfoTooltip";
import { StatusBadge, getStatusColor, getStatusBg, getMarginStatus } from "./StatusBadge";
import { calculateGP, GRAB_NORMAL_COMMISSION, GRAB_THAI_PLUS_COMMISSION } from "@shared/gpCalculations";
import { cn } from "@/lib/utils";
import { Calculator, TrendingUp, Package, Tag, Truck, Percent } from "lucide-react";

function NumInput({
  label,
  value,
  onChange,
  icon,
  tooltip,
  placeholder,
  prefix = "฿",
  suffix,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  icon?: React.ReactNode;
  tooltip?: string;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  min?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
        {icon}
        {label}
        {tooltip && <InfoTooltip content={tooltip} />}
      </Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium pointer-events-none">
            {prefix}
          </span>
        )}
        <Input
          type="number"
          min={min}
          step="1"
          placeholder={placeholder ?? "0"}
          value={value === 0 ? "" : value}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
          className={cn("text-right pr-10 font-mono", prefix ? "pl-8" : "")}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function ResultCard({
  label,
  value,
  isPercent,
  status,
  highlight,
  tooltip,
}: {
  label: string;
  value: number;
  isPercent?: boolean;
  status?: "healthy" | "warning" | "danger";
  highlight?: boolean;
  tooltip?: string;
}) {
  const colorClass = status ? getStatusColor(status) : "text-gray-800";
  const bgClass = status ? getStatusBg(status) : "bg-gray-50 border-gray-200";

  return (
    <div className={cn("rounded-xl border p-3 transition-all duration-300", bgClass, highlight && "shadow-sm")}>
      <div className="flex items-center gap-1 mb-1">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        {tooltip && <InfoTooltip content={tooltip} />}
      </div>
      <p className={cn("text-xl font-bold num", colorClass)}>
        {isPercent
          ? `${value.toFixed(1)}%`
          : `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      </p>
      {status && <StatusBadge status={status} className="mt-1" />}
    </div>
  );
}

interface GPCalculatorProps {
  onInputsChange?: (inputs: {
    sellingPrice: number;
    foodCost: number;
    packagingCost: number;
    otherCost: number;
    restaurantDiscount: number;
    deliverySubsidy: number;
  }) => void;
}

export function GPCalculator({ onInputsChange }: GPCalculatorProps = {}) {
  const [inputs, setInputs] = useState({
    sellingPrice: 100,
    foodCost: 25,
    packagingCost: 5,
    otherCost: 0,
    restaurantDiscount: 0,
    deliverySubsidy: 0,
  });
  const [targetMargin, setTargetMargin] = useState(30);

  const set = useCallback((key: keyof typeof inputs) => (v: number) => {
    setInputs((prev) => {
      const next = { ...prev, [key]: v };
      onInputsChange?.(next);
      return next;
    });
  }, [onInputsChange]);

  const result = calculateGP(inputs);
  const recommendedPrice = result.recommendedPrice(targetMargin);

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="border-green-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-green-800">
            <Calculator className="w-5 h-5 text-green-600" />
            ข้อมูลเมนู
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumInput
            label="ราคาขาย"
            value={inputs.sellingPrice}
            onChange={set("sellingPrice")}
            icon={<Tag className="w-3.5 h-3.5 text-green-600" />}
            tooltip="ราคาที่ลูกค้าจ่ายบน GrabFood"
            placeholder="100"
          />
          <NumInput
            label="ต้นทุนวัตถุดิบ"
            value={inputs.foodCost}
            onChange={set("foodCost")}
            icon={<Package className="w-3.5 h-3.5 text-green-600" />}
            tooltip={TOOLTIPS.foodCost}
            placeholder="25"
          />
          <NumInput
            label="ค่าบรรจุภัณฑ์"
            value={inputs.packagingCost}
            onChange={set("packagingCost")}
            icon={<Package className="w-3.5 h-3.5 text-green-600" />}
            tooltip="ค่ากล่อง ถุง ช้อน ส้อม และอุปกรณ์บรรจุภัณฑ์"
            placeholder="5"
          />
          <NumInput
            label="ต้นทุนอื่นๆ ต่อออเดอร์"
            value={inputs.otherCost}
            onChange={set("otherCost")}
            icon={<Package className="w-3.5 h-3.5 text-green-600" />}
            tooltip="ต้นทุนอื่นๆ ที่เกิดขึ้นต่อออเดอร์ เช่น ค่าแก๊ส ค่าน้ำ"
            placeholder="0"
          />
          <NumInput
            label="ส่วนลดที่ร้านออก"
            value={inputs.restaurantDiscount}
            onChange={set("restaurantDiscount")}
            icon={<Percent className="w-3.5 h-3.5 text-green-600" />}
            tooltip="ส่วนลดที่ร้านออกเองเพื่อดึงดูดลูกค้า (ไม่รวมส่วนลดที่ Grab ออกให้)"
            placeholder="0"
          />
          <NumInput
            label="ค่าส่งที่ร้านช่วยออก"
            value={inputs.deliverySubsidy}
            onChange={set("deliverySubsidy")}
            icon={<Truck className="w-3.5 h-3.5 text-green-600" />}
            tooltip="ส่วนที่ร้านช่วยออกค่าส่งให้ลูกค้า เช่น โปรฯ ฟรีค่าส่ง"
            placeholder="0"
          />
        </CardContent>
      </Card>

      {/* Comparison Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Normal */}
        <Card className="border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
              Commission ปกติ ({(GRAB_NORMAL_COMMISSION * 100).toFixed(0)}%)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <ResultCard
              label="กำไรขั้นต้น (GP)"
              value={result.grossProfit}
              status={getMarginStatus(result.gpMargin)}
              tooltip={TOOLTIPS.gp}
            />
            <ResultCard
              label="GP Margin"
              value={result.gpMargin}
              isPercent
              status={getMarginStatus(result.gpMargin)}
              tooltip={TOOLTIPS.gpMargin}
            />
          </CardContent>
        </Card>

        {/* Thai Plus */}
        <Card className="border-green-200 bg-gradient-to-br from-green-50/50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-green-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              ไทยช่วยไทยพลัส ({(GRAB_THAI_PLUS_COMMISSION * 100).toFixed(0)}%)
              <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                ประหยัดกว่า
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <ResultCard
              label="กำไรขั้นต้น (GP)"
              value={result.grossProfitThaiPlus}
              status={getMarginStatus(result.gpMarginThaiPlus)}
              highlight
              tooltip={TOOLTIPS.gp}
            />
            <ResultCard
              label="GP Margin"
              value={result.gpMarginThaiPlus}
              isPercent
              status={getMarginStatus(result.gpMarginThaiPlus)}
              highlight
              tooltip={TOOLTIPS.gpMargin}
            />
          </CardContent>
        </Card>
      </div>

      {/* Savings Banner */}
      {result.grossProfitThaiPlus > result.grossProfit && (
        <div className="bg-green-600 text-white rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">ไทยช่วยไทยพลัส ช่วยเพิ่มกำไร</p>
            <p className="text-2xl font-bold num">
              +฿{(result.grossProfitThaiPlus - result.grossProfit).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">ต่อออเดอร์</p>
            <p className="text-lg font-bold">
              +{(result.gpMarginThaiPlus - result.gpMargin).toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Recommended Price */}
      <Card className="border-green-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-green-800">
            <TrendingUp className="w-5 h-5 text-green-600" />
            ราคาขายแนะนำ
            <InfoTooltip content={TOOLTIPS.recommendedPrice} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">เป้าหมาย GP Margin</span>
              <span className="font-bold text-green-700">{targetMargin}%</span>
            </div>
            <Slider
              value={[targetMargin]}
              onValueChange={([v]) => setTargetMargin(v)}
              min={10}
              max={60}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>10%</span>
              <span>60%</span>
            </div>
          </div>
          <div className={cn(
            "rounded-xl border p-4 text-center",
            recommendedPrice > 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          )}>
            {recommendedPrice > 0 ? (
              <>
                <p className="text-xs text-gray-500 mb-1">ราคาขายขั้นต่ำที่ควรตั้ง (ไทยช่วยไทยพลัส)</p>
                <p className="text-3xl font-bold text-green-700 num">
                  ฿{recommendedPrice.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-400 mt-1">เพื่อให้ได้ GP Margin {targetMargin}%</p>
              </>
            ) : (
              <p className="text-sm text-red-600">ไม่สามารถคำนวณได้ กรุณาลดต้นทุนหรือลดเป้าหมาย Margin</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
