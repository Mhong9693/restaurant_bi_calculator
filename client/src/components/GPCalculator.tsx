import { useState, useEffect, useCallback } from "react";
import { calcNetGpPercent, calcGpPerOrder } from "@shared/gpCalculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { InfoTooltip } from "./InfoTooltip";
import { StatusBadge, getMarginStatus } from "./StatusBadge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Save, TrendingUp, TrendingDown, Minus, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

// -------------------------------------------------------
// Types
// -------------------------------------------------------

/** ค่าที่ผู้ใช้กรอก: ราคาขายเฉลี่ย + Commission% ที่ LINE MAN หัก */
export interface GPSettings {
  normalAvgPrice: number;
  normalCommission: number; // Commission% ที่ LINE MAN หัก เช่น 30
  plusAvgPrice: number;
  plusCommission: number;   // Commission% โปรแกรมพิเศษ เช่น 23
}

/** ผลการคำนวณที่ส่งออกไปให้ parent */
export interface GPResults {
  normalGpPerOrder: number;   // กำไรสุทธิต่อออเดอร์ (บาท)
  plusGpPerOrder: number;
  normalNetGpPercent: number; // GP% สุทธิที่ร้านได้รับ (หลังหัก VAT บน commission)
  plusNetGpPercent: number;
  diffPerOrder: number;
  diffPercent: number;
}

// Re-export from shared so tests can import from one place
export { calcNetGpPercent, calcGpPerOrder } from "@shared/gpCalculations";

// -------------------------------------------------------
// Component
// -------------------------------------------------------

interface GPCalculatorProps {
  sessionId: string;
  onSettingsChange?: (settings: GPSettings, results: GPResults) => void;
}

export function GPCalculator({ sessionId, onSettingsChange }: GPCalculatorProps) {
  const [inputs, setInputs] = useState<GPSettings>({
    normalAvgPrice: 150,
    normalCommission: 30,
    plusAvgPrice: 150,
    plusCommission: 23,
  });
  const [isSaved, setIsSaved] = useState(false);

  const { data: savedSettings } = trpc.gpSettings.get.useQuery(
    { sessionId },
    { enabled: !!sessionId }
  );
  const saveMutation = trpc.gpSettings.save.useMutation();

  useEffect(() => {
    if (savedSettings) {
      setInputs({
        normalAvgPrice: savedSettings.normalAvgPrice,
        normalCommission: savedSettings.normalCommission,
        plusAvgPrice: savedSettings.plusAvgPrice,
        plusCommission: savedSettings.plusCommission,
      });
      setIsSaved(true);
    }
  }, [savedSettings]);

  const normalNetGpPercent = calcNetGpPercent(inputs.normalCommission);
  const plusNetGpPercent = calcNetGpPercent(inputs.plusCommission);
  const normalGpPerOrder = calcGpPerOrder(inputs.normalAvgPrice, inputs.normalCommission);
  const plusGpPerOrder = calcGpPerOrder(inputs.plusAvgPrice, inputs.plusCommission);

  const results: GPResults = {
    normalGpPerOrder,
    plusGpPerOrder,
    normalNetGpPercent,
    plusNetGpPercent,
    diffPerOrder: plusGpPerOrder - normalGpPerOrder,
    diffPercent: plusNetGpPercent - normalNetGpPercent,
  };

  const handleChange = useCallback((field: keyof GPSettings, value: string) => {
    const num = parseFloat(value) || 0;
    setInputs((prev) => ({ ...prev, [field]: num }));
    setIsSaved(false);
  }, []);

  useEffect(() => {
    onSettingsChange?.(inputs, results);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs]);

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({ sessionId, ...inputs });
      setIsSaved(true);
      toast.success("บันทึกการตั้งค่า GP สำเร็จ");
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
  };

  const normalStatus = getMarginStatus(normalNetGpPercent);
  const plusStatus = getMarginStatus(plusNetGpPercent);

  return (
    <div className="space-y-6">
      {/* Settings Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Normal Channel */}
        <Card className="border-2 border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-gray-700">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              ออเดอร์ปกติ (LINE MAN ทั่วไป)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1">
                ราคาขายเฉลี่ยต่อออเดอร์
                <InfoTooltip content="ราคาเฉลี่ยของออเดอร์ที่ลูกค้าสั่ง เช่น ถ้าออเดอร์ส่วนใหญ่อยู่ที่ 100-200 บาท ให้ใส่ค่าเฉลี่ยประมาณ 150 บาท" />
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">฿</span>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={inputs.normalAvgPrice || ""}
                  onChange={(e) => handleChange("normalAvgPrice", e.target.value)}
                  className="pl-7 text-right font-mono"
                  placeholder="150"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1">
                Commission% ที่ LINE MAN หัก (ปกติ)
                <InfoTooltip content={`Commission คือค่าบริการที่ LINE MAN หักจากยอดขาย เช่น 30% หมายถึง LINE MAN หัก 30% + VAT 7% บน Commission\n\nสูตร: GP% สุทธิ = (1 − Commission% × 1.07) × 100\nตัวอย่าง: Commission 30% → GP% สุทธิ = (1 − 0.30 × 1.07) × 100 = 67.9%\n\nดูค่านี้ได้จาก LINE MAN Partner Portal → รายงาน`} />
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={inputs.normalCommission || ""}
                  onChange={(e) => handleChange("normalCommission", e.target.value)}
                  className="pr-8 text-right font-mono"
                  placeholder="30"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
              <p className="text-xs text-gray-400">ดูค่านี้ได้จาก LINE MAN Partner Portal → รายงาน</p>
            </div>
            {/* Derived GP% display */}
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">GP% สุทธิที่ร้านได้รับ</span>
              <span className={cn(
                "text-sm font-bold num",
                normalStatus === "healthy" ? "text-[#0EC963]" : normalStatus === "warning" ? "text-yellow-600" : "text-red-600"
              )}>
                {normalNetGpPercent.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Plus Channel */}
        <Card className="border-2 border-[#0EC963]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-[#0aaa54]">
              <div className="w-3 h-3 rounded-full bg-[#0EC963]" />
              ออเดอร์ไทยช่วยไทยพลัส
              <Badge className="bg-[#0EC963] text-white text-xs ml-auto">โปรแกรมพิเศษ</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1">
                ราคาขายเฉลี่ยต่อออเดอร์
                <InfoTooltip content="ราคาเฉลี่ยของออเดอร์ในโปรแกรมไทยช่วยไทยพลัส อาจตั้งราคาต่างจากปกติได้" />
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">฿</span>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={inputs.plusAvgPrice || ""}
                  onChange={(e) => handleChange("plusAvgPrice", e.target.value)}
                  className="pl-7 text-right font-mono"
                  placeholder="150"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1">
                Commission% ที่ไทยช่วยไทยพลัสหัก
                <InfoTooltip content={`Commission ของโปรแกรมพิเศษ ซึ่งต่ำกว่าปกติ เช่น 23%\n\nสูตร: GP% สุทธิ = (1 − Commission% × 1.07) × 100\nตัวอย่าง: Commission 23% → GP% สุทธิ = (1 − 0.23 × 1.07) × 100 = 75.4%\n\nดูค่านี้ได้จาก LINE MAN Partner Portal → โปรแกรมพิเศษ`} />
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={inputs.plusCommission || ""}
                  onChange={(e) => handleChange("plusCommission", e.target.value)}
                  className="pr-8 text-right font-mono"
                  placeholder="23"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
              <p className="text-xs text-gray-400">ดูค่านี้ได้จาก LINE MAN Partner Portal → โปรแกรมพิเศษ</p>
            </div>
            {/* Derived GP% display */}
            <div className="rounded-lg bg-green-50 border border-[#0EC963]/40 px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-[#0aaa54]">GP% สุทธิที่ร้านได้รับ</span>
              <span className={cn(
                "text-sm font-bold num",
                plusStatus === "healthy" ? "text-[#0EC963]" : plusStatus === "warning" ? "text-yellow-600" : "text-red-600"
              )}>
                {plusNetGpPercent.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formula explanation */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-700 space-y-1">
        <p className="font-semibold">📐 สูตรคำนวณ (ตาม LINE MAN / Wongnai)</p>
        <p>GP% สุทธิ = (1 − Commission% × 1.07) × 100</p>
        <p>กำไรต่อออเดอร์ = ราคาขายเฉลี่ย × GP% สุทธิ</p>
        <p className="text-blue-500">VAT 7% คำนวณบน Commission เท่านั้น ไม่ใช่บนยอดขายทั้งหมด</p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending || isSaved}
          className={cn(
            "gap-2 transition-all",
            isSaved
              ? "bg-gray-100 text-gray-500 hover:bg-gray-100"
              : "bg-[#0EC963] hover:bg-[#0aaa54] text-white"
          )}
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? "กำลังบันทึก..." : isSaved ? "บันทึกแล้ว ✓" : "บันทึกการตั้งค่า"}
        </Button>
      </div>

      <Separator />

      {/* Results Comparison */}
      <div>
        <h3 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-[#0EC963]" />
          ผลการคำนวณกำไรต่อออเดอร์
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Normal Result */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-medium">ออเดอร์ปกติ</span>
                <StatusBadge status={normalStatus} />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-800 num">
                  ฿{normalGpPerOrder.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">กำไรต่อออเดอร์</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">GP% สุทธิ:</span>
                <span className={cn(
                  "text-sm font-semibold",
                  normalStatus === "healthy" ? "text-[#0EC963]" : normalStatus === "warning" ? "text-yellow-600" : "text-red-600"
                )}>
                  {normalNetGpPercent.toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-gray-500 bg-white rounded p-2 border space-y-0.5">
                <p>฿{inputs.normalAvgPrice} × (1 − {inputs.normalCommission}% × 1.07)</p>
                <p className="font-medium">= ฿{inputs.normalAvgPrice} × {(normalNetGpPercent/100).toFixed(4)} = ฿{normalGpPerOrder.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Plus Result */}
          <Card className="bg-green-50 border-[#0EC963]">
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#0aaa54] font-medium">ไทยช่วยไทยพลัส</span>
                <StatusBadge status={plusStatus} />
              </div>
              <div>
                <p className="text-3xl font-bold text-[#0EC963] num">
                  ฿{plusGpPerOrder.toFixed(2)}
                </p>
                <p className="text-sm text-[#0aaa54]">กำไรต่อออเดอร์</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#0aaa54]">GP% สุทธิ:</span>
                <span className="text-sm font-semibold text-[#0EC963]">
                  {plusNetGpPercent.toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-[#0aaa54] bg-white rounded p-2 border border-[#0EC963]/30 space-y-0.5">
                <p>฿{inputs.plusAvgPrice} × (1 − {inputs.plusCommission}% × 1.07)</p>
                <p className="font-medium">= ฿{inputs.plusAvgPrice} × {(plusNetGpPercent/100).toFixed(4)} = ฿{plusGpPerOrder.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Difference Banner */}
      <Card className={cn(
        "border-2",
        results.diffPerOrder > 0
          ? "border-[#0EC963] bg-green-50"
          : results.diffPerOrder < 0
          ? "border-red-400 bg-red-50"
          : "border-gray-300 bg-gray-50"
      )}>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {results.diffPerOrder > 0 ? (
                <TrendingUp className="w-8 h-8 text-[#0EC963]" />
              ) : results.diffPerOrder < 0 ? (
                <TrendingDown className="w-8 h-8 text-red-500" />
              ) : (
                <Minus className="w-8 h-8 text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-700">ผลต่างกำไรต่อออเดอร์</p>
                <p className="text-xs text-gray-500">ไทยช่วยไทยพลัส เทียบกับ ออเดอร์ปกติ</p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                "text-2xl font-bold num",
                results.diffPerOrder > 0 ? "text-[#0EC963]" : results.diffPerOrder < 0 ? "text-red-600" : "text-gray-600"
              )}>
                {results.diffPerOrder > 0 ? "+" : ""}{results.diffPerOrder.toFixed(2)} บาท
              </p>
              <p className={cn(
                "text-sm font-medium",
                results.diffPerOrder > 0 ? "text-[#0aaa54]" : results.diffPerOrder < 0 ? "text-red-500" : "text-gray-500"
              )}>
                {results.diffPercent > 0 ? "+" : ""}{results.diffPercent.toFixed(1)}% GP สุทธิ
              </p>
            </div>
          </div>
          {results.diffPerOrder > 0 && (
            <p className="text-sm text-[#0aaa54] mt-3 pt-3 border-t border-[#0EC963]/30">
              💡 ทุก 100 ออเดอร์ที่เป็นไทยช่วยไทยพลัส คุณได้กำไรเพิ่มขึ้น{" "}
              <strong>฿{(results.diffPerOrder * 100).toFixed(0)}</strong>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
