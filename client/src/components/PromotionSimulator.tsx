import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { simulatePromotion } from "@shared/gpCalculations";
import { InfoTooltip } from "./InfoTooltip";
import { Tag, Truck, AlertTriangle, CheckCircle2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromotionSimulatorProps {
  sellingPrice: number;
  totalVariableCost: number;
}

export function PromotionSimulator({ sellingPrice, totalVariableCost }: PromotionSimulatorProps) {
  const [discount, setDiscount] = useState(0);
  const [deliverySubsidy, setDeliverySubsidy] = useState(0);

  const result = simulatePromotion(sellingPrice, discount, deliverySubsidy, totalVariableCost);
  const maxDiscountSafe = Math.floor(result.maxDiscount);

  const discountPercent = sellingPrice > 0 ? (discount / sellingPrice) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* Inputs */}
      <Card className="border-green-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-green-800">
            <Zap className="w-5 h-5 text-green-600" />
            ตั้งค่าโปรโมชัน
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Discount Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <Tag className="w-3.5 h-3.5 text-green-600" />
                ส่วนลดที่ร้านออก
                <InfoTooltip content="ส่วนลดราคาอาหารที่ร้านออกเองเพื่อดึงดูดลูกค้า" />
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative w-24">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">฿</span>
                  <Input
                    type="number"
                    min={0}
                    max={sellingPrice}
                    value={discount === 0 ? "" : discount}
                    onChange={(e) => setDiscount(Math.min(sellingPrice, Number(e.target.value) || 0))}
                    className="pl-6 text-right font-mono text-sm h-8"
                  />
                </div>
                <span className="text-xs text-gray-500 w-12">({discountPercent.toFixed(0)}%)</span>
              </div>
            </div>
            <Slider
              value={[discount]}
              onValueChange={([v]) => setDiscount(v)}
              min={0}
              max={Math.min(sellingPrice, maxDiscountSafe + 20)}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>฿0</span>
              <span className="text-green-600 font-medium">ส่วนลดสูงสุดที่ไม่ขาดทุน: ฿{maxDiscountSafe}</span>
            </div>
          </div>

          {/* Delivery Subsidy */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <Truck className="w-3.5 h-3.5 text-green-600" />
              ค่าส่งที่ร้านช่วยออก
              <InfoTooltip content="ส่วนที่ร้านช่วยออกค่าส่งให้ลูกค้า เช่น โปรฯ ฟรีค่าส่ง ร้านออก ฿15" />
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">฿</span>
              <Input
                type="number"
                min={0}
                value={deliverySubsidy === 0 ? "" : deliverySubsidy}
                onChange={(e) => setDeliverySubsidy(Number(e.target.value) || 0)}
                className="pl-8 text-right font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-2 gap-3">
        <div className={cn(
          "rounded-xl border p-4 text-center",
          result.isLoss ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
        )}>
          <p className="text-xs text-gray-500 mb-1">กำไร GP หลังโปรโมชัน</p>
          <p className={cn("text-2xl font-bold num", result.isLoss ? "text-red-600" : "text-green-700")}>
            ฿{result.grossProfit.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">ต่อออเดอร์</p>
        </div>
        <div className={cn(
          "rounded-xl border p-4 text-center",
          result.gpMargin < 15 ? "bg-red-50 border-red-200" :
          result.gpMargin < 30 ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200"
        )}>
          <p className="text-xs text-gray-500 mb-1">GP Margin</p>
          <p className={cn(
            "text-2xl font-bold num",
            result.gpMargin < 15 ? "text-red-600" :
            result.gpMargin < 30 ? "text-yellow-600" : "text-green-700"
          )}>
            {result.gpMargin.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">หลังโปรโมชัน</p>
        </div>
      </div>

      {/* Warning / OK Banner */}
      <div className={cn(
        "rounded-xl p-4 flex items-start gap-3",
        result.isLoss ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"
      )}>
        {result.isLoss ? (
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
        )}
        <div>
          <p className={cn("font-semibold text-sm", result.isLoss ? "text-red-700" : "text-green-700")}>
            {result.isLoss ? "⚠️ โปรโมชันนี้ทำให้ขาดทุน!" : "✅ โปรโมชันนี้ยังคงกำไร"}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            {result.isLoss
              ? `ส่วนลดสูงสุดที่ทำได้โดยไม่ขาดทุนคือ ฿${maxDiscountSafe} (${((maxDiscountSafe / sellingPrice) * 100).toFixed(0)}% ของราคาขาย)`
              : `คุณสามารถลดราคาได้อีก ฿${(maxDiscountSafe - discount).toFixed(0)} โดยยังไม่ขาดทุน`}
          </p>
        </div>
      </div>

      {/* Max Discount Info */}
      <Card className="border-green-100 bg-green-50/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-800">ส่วนลดสูงสุดที่ไม่ขาดทุน</p>
              <p className="text-xs text-gray-500 mt-0.5">คำนวณจากต้นทุนและค่า Commission ไทยช่วยไทยพลัส</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-700 num">฿{maxDiscountSafe}</p>
              <p className="text-xs text-gray-500">({((maxDiscountSafe / sellingPrice) * 100).toFixed(0)}%)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
