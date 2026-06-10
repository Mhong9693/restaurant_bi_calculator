import { useState, useEffect, useCallback } from "react";
import {
  calcGPOrder,
  calcRecommendedPrice,
  DEFAULT_NORMAL_GP_PERCENT,
  DEFAULT_PLUS_GP_PERCENT,
  DEFAULT_VAT_ON_GP,
  DEFAULT_TARGET_MARGIN,
  DEFAULT_PRICE_STEP,
} from "@shared/gpCalculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { InfoTooltip } from "./InfoTooltip";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Save,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// -------------------------------------------------------
// Types
// -------------------------------------------------------

export interface GPSettings {
  /** ราคาขายเฉลี่ยต่อออเดอร์ (ก่อนส่วนลด) */
  normalAvgPrice: number;
  /** GP% แพลตฟอร์มปกติ เช่น 30 */
  normalGpPercent: number;
  /** VAT บน GP (%) ปกติ 7 */
  normalVatOnGp: number;
  /** ต้นทุนรวมต่อออเดอร์ปกติ (Food Cost + บรรจุ + อื่นๆ) */
  normalTotalCost: number;

  /** ราคาขายเฉลี่ยต่อออเดอร์ไทยช่วยไทยพลัส */
  plusAvgPrice: number;
  /** GP% ไทยช่วยไทยพลัส เช่น 23 */
  plusGpPercent: number;
  /** VAT บน GP ไทยช่วยไทยพลัส */
  plusVatOnGp: number;
  /** ต้นทุนรวมต่อออเดอร์ไทยช่วยไทยพลัส */
  plusTotalCost: number;
}

export interface GPResults {
  normalNetRevenue: number;
  normalProfitPerOrder: number;
  normalMarginPercent: number;
  normalGpAmount: number;
  normalVatAmount: number;
  normalStatus: "healthy" | "warning" | "danger";

  plusNetRevenue: number;
  plusProfitPerOrder: number;
  plusMarginPercent: number;
  plusGpAmount: number;
  plusVatAmount: number;
  plusStatus: "healthy" | "warning" | "danger";

  diffProfit: number;
  diffMargin: number;
}

// -------------------------------------------------------
// Component
// -------------------------------------------------------

interface GPCalculatorProps {
  sessionId: string;
  onSettingsChange?: (settings: GPSettings, results: GPResults) => void;
}

const STATUS_CONFIG = {
  healthy: { label: "กำไรดี", className: "bg-green-100 text-green-700 border-green-200" },
  warning: { label: "ควรปรับ", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  danger:  { label: "ขาดทุน", className: "bg-red-100 text-red-700 border-red-200" },
};

function calcResults(s: GPSettings): GPResults {
  const normal = calcGPOrder({
    sellingPrice: s.normalAvgPrice,
    gpPercent: s.normalGpPercent,
    vatOnGpPercent: s.normalVatOnGp,
    totalCostPerOrder: s.normalTotalCost,
  });
  const plus = calcGPOrder({
    sellingPrice: s.plusAvgPrice,
    gpPercent: s.plusGpPercent,
    vatOnGpPercent: s.plusVatOnGp,
    totalCostPerOrder: s.plusTotalCost,
  });
  return {
    normalNetRevenue: normal.netRevenue,
    normalProfitPerOrder: normal.profitPerOrder,
    normalMarginPercent: normal.marginPercent,
    normalGpAmount: normal.gpAmount,
    normalVatAmount: normal.vatOnGpAmount,
    normalStatus: normal.status,

    plusNetRevenue: plus.netRevenue,
    plusProfitPerOrder: plus.profitPerOrder,
    plusMarginPercent: plus.marginPercent,
    plusGpAmount: plus.gpAmount,
    plusVatAmount: plus.vatOnGpAmount,
    plusStatus: plus.status,

    diffProfit: plus.profitPerOrder - normal.profitPerOrder,
    diffMargin: plus.marginPercent - normal.marginPercent,
  };
}

const DEFAULT_SETTINGS: GPSettings = {
  normalAvgPrice: 150,
  normalGpPercent: DEFAULT_NORMAL_GP_PERCENT,
  normalVatOnGp: DEFAULT_VAT_ON_GP,
  normalTotalCost: 0,
  plusAvgPrice: 150,
  plusGpPercent: DEFAULT_PLUS_GP_PERCENT,
  plusVatOnGp: DEFAULT_VAT_ON_GP,
  plusTotalCost: 0,
};

export function GPCalculator({ sessionId, onSettingsChange }: GPCalculatorProps) {
  const [inputs, setInputs] = useState<GPSettings>(DEFAULT_SETTINGS);
  const [isSaved, setIsSaved] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { data: savedSettings } = trpc.gpSettings.get.useQuery(
    { sessionId },
    { enabled: !!sessionId }
  );
  const saveMutation = trpc.gpSettings.save.useMutation();

  useEffect(() => {
    if (savedSettings) {
      setInputs({
        normalAvgPrice: savedSettings.normalAvgPrice,
        normalGpPercent: savedSettings.normalGpPercent,
        normalVatOnGp: savedSettings.normalVatOnGp,
        normalTotalCost: savedSettings.normalTotalCost,
        plusAvgPrice: savedSettings.plusAvgPrice,
        plusGpPercent: savedSettings.plusGpPercent,
        plusVatOnGp: savedSettings.plusVatOnGp,
        plusTotalCost: savedSettings.plusTotalCost,
      });
      setIsSaved(true);
    }
  }, [savedSettings]);

  const results = calcResults(inputs);

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

  const normalRec = calcRecommendedPrice(inputs.normalTotalCost, inputs.normalGpPercent, inputs.normalVatOnGp, DEFAULT_TARGET_MARGIN, DEFAULT_PRICE_STEP);
  const plusRec = calcRecommendedPrice(inputs.plusTotalCost, inputs.plusGpPercent, inputs.plusVatOnGp, DEFAULT_TARGET_MARGIN, DEFAULT_PRICE_STEP);

  return (
    <div className="space-y-6">

      {/* ── Banner ไทยช่วยไทยพลัส ── */}
      <a
        href="https://bit.ly/4gbvUY3"
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-2xl overflow-hidden border-2 border-[#0EC963] bg-gradient-to-r from-[#003087] via-[#0047b3] to-[#003087] shadow-lg hover:shadow-xl transition-shadow group"
      >
        <div className="flex items-center gap-4 px-5 py-4">
          <img
            src="/manus-storage/thai-chuay-thai-plus-logo_7c644d49.webp"
            alt="ไทยช่วยไทยพลัส LINE MAN"
            className="h-20 w-auto object-contain flex-shrink-0 drop-shadow-lg"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base leading-tight">
              ยังไม่ได้สมัครโปรแกรม?
            </p>
            <p
              className="text-[#00E64D] font-black text-xl leading-tight tracking-tight"
              style={{ fontFamily: "'LINE Seed Sans TH', sans-serif", fontWeight: 900 }}
            >
              ไทยช่วยไทยพลัส
            </p>
            <p className="text-blue-200 text-xs mt-1">
              ลด GP เหลือ 23% · เพิ่มกำไรต่อออเดอร์ทันที
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-1.5 bg-[#0EC963] text-white text-sm font-bold px-4 py-2 rounded-xl group-hover:bg-[#0aaa54] transition-colors">
            สมัครเลย
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        </div>
      </a>

      {/* ── Formula note ── */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-700 space-y-1">
        <p className="font-semibold">📐 สูตรคำนวณ</p>
        <p>ค่า GP = ราคาขาย (ก่อนส่วนลด) × GP%</p>
        <p>รายรับสุทธิ = ราคาขาย − ค่า GP − VAT บน GP</p>
        <p>กำไรต่อออเดอร์ = รายรับสุทธิ − ต้นทุนรวม</p>
        <p>Margin% = กำไรต่อออเดอร์ ÷ ราคาขาย × 100</p>
      </div>

      {/* ── Input Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Normal Channel */}
        <ChannelCard
          title="ออเดอร์ปกติ"
          subtitle="LINE MAN / Grab / Foodpanda ทั่วไป"
          accentColor="gray"
          avgPrice={inputs.normalAvgPrice}
          gpPercent={inputs.normalGpPercent}
          vatOnGp={inputs.normalVatOnGp}
          totalCost={inputs.normalTotalCost}
          showAdvanced={showAdvanced}
          result={results}
          isPlus={false}
          recPrice={normalRec}
          onChange={(field, val) => handleChange(field as keyof GPSettings, val)}
          fieldPrefix="normal"
        />

        {/* Plus Channel */}
        <ChannelCard
          title="ไทยช่วยไทยพลัส"
          subtitle="โปรแกรมพิเศษ GP ต่ำกว่าปกติ"
          accentColor="green"
          avgPrice={inputs.plusAvgPrice}
          gpPercent={inputs.plusGpPercent}
          vatOnGp={inputs.plusVatOnGp}
          totalCost={inputs.plusTotalCost}
          showAdvanced={showAdvanced}
          result={results}
          isPlus={true}
          recPrice={plusRec}
          onChange={(field, val) => handleChange(field as keyof GPSettings, val)}
          fieldPrefix="plus"
        />
      </div>

      {/* Advanced toggle */}
      <button
        onClick={() => setShowAdvanced((v) => !v)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors mx-auto"
      >
        {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {showAdvanced ? "ซ่อนรายละเอียดการคำนวณ" : "แสดงรายละเอียดการคำนวณ"}
      </button>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending || isSaved}
          className={cn(
            "gap-2 transition-all",
            isSaved
              ? "bg-gray-100 text-gray-500 hover:bg-gray-100"
              : "bg-[#FF671F] hover:bg-[#EB4700] text-white"
          )}
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? "กำลังบันทึก..." : isSaved ? "บันทึกแล้ว ✓" : "บันทึกการตั้งค่า"}
        </Button>
      </div>

      <Separator />

      {/* ── Comparison Banner ── */}
      <Card className={cn(
        "border-2",
        results.diffProfit > 0 ? "border-[#FF671F] bg-orange-50"
          : results.diffProfit < 0 ? "border-red-400 bg-red-50"
          : "border-gray-300 bg-gray-50"
      )}>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {results.diffProfit > 0 ? (
                <TrendingUp className="w-8 h-8 text-[#FF671F]" />
              ) : results.diffProfit < 0 ? (
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
                results.diffProfit > 0 ? "text-[#FF671F]"
                  : results.diffProfit < 0 ? "text-red-600"
                  : "text-gray-600"
              )}>
                {results.diffProfit > 0 ? "+" : ""}{results.diffProfit.toFixed(2)} บาท
              </p>
              <p className={cn(
                "text-sm font-medium",
                results.diffProfit > 0 ? "text-[#EB4700]"
                  : results.diffProfit < 0 ? "text-red-500"
                  : "text-gray-500"
              )}>
                {results.diffMargin > 0 ? "+" : ""}{results.diffMargin.toFixed(1)}% Margin
              </p>
            </div>
          </div>
          {results.diffProfit > 0 && (
            <p className="text-sm text-[#EB4700] mt-3 pt-3 border-t border-[#FF671F]/30">
              💡 ทุก 100 ออเดอร์ที่เป็นไทยช่วยไทยพลัส คุณได้กำไรเพิ่มขึ้น{" "}
              <strong>฿{(results.diffProfit * 100).toFixed(0)}</strong>
            </p>
          )}
          {results.diffProfit <= 0 && inputs.plusGpPercent < inputs.normalGpPercent && (
            <p className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-200">
              💡 ปรับต้นทุนหรือราคาขายไทยช่วยไทยพลัสเพื่อให้ได้กำไรสูงกว่าปกติ
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// -------------------------------------------------------
// ChannelCard sub-component
// -------------------------------------------------------

interface ChannelCardProps {
  title: string;
  subtitle: string;
  accentColor: "gray" | "green";
  avgPrice: number;
  gpPercent: number;
  vatOnGp: number;
  totalCost: number;
  showAdvanced: boolean;
  result: GPResults;
  isPlus: boolean;
  recPrice: number;
  onChange: (field: string, val: string) => void;
  fieldPrefix: "normal" | "plus";
}

function ChannelCard({
  title, subtitle, accentColor, avgPrice, gpPercent, vatOnGp, totalCost,
  showAdvanced, result, isPlus, recPrice, onChange, fieldPrefix,
}: ChannelCardProps) {
  const isGreen = accentColor === "green";
  const profit = isPlus ? result.plusProfitPerOrder : result.normalProfitPerOrder;
  const margin = isPlus ? result.plusMarginPercent : result.normalMarginPercent;
  const netRev = isPlus ? result.plusNetRevenue : result.normalNetRevenue;
  const gpAmt = isPlus ? result.plusGpAmount : result.normalGpAmount;
  const vatAmt = isPlus ? result.plusVatAmount : result.normalVatAmount;
  const status = isPlus ? result.plusStatus : result.normalStatus;

  const STATUS_CONFIG = {
    healthy: { label: "กำไรดี", className: "bg-green-100 text-green-700 border border-green-200" },
    warning: { label: "ควรปรับ", className: "bg-yellow-100 text-yellow-700 border border-yellow-200" },
    danger:  { label: "ขาดทุน/ต่ำ", className: "bg-red-100 text-red-700 border border-red-200" },
  };

  return (
    <Card className={cn("border-2", isGreen ? "border-[#003DA5]" : "border-gray-200")}>
      <CardHeader className="pb-3">
        <CardTitle className={cn("text-base flex items-center gap-2", isGreen ? "text-[#003DA5]" : "text-gray-700")}>
          <div className={cn("w-3 h-3 rounded-full", isGreen ? "bg-[#003DA5]" : "bg-gray-400")} />
          {title}
          {isGreen && (
            <Badge className="bg-[#003DA5] text-white text-xs ml-auto">โปรแกรมพิเศษ</Badge>
          )}
        </CardTitle>
        <p className="text-xs text-gray-400 -mt-1">{subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* ราคาขาย */}
        <div className="space-y-1">
          <Label className="text-xs font-medium flex items-center gap-1">
            ราคาขายเฉลี่ย/ออเดอร์ (ก่อนส่วนลด)
            <InfoTooltip content="ราคาที่ลูกค้าจ่ายก่อนหักส่วนลด ใช้คำนวณค่า GP" />
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">฿</span>
            <Input
              type="number" min="0" step="1"
              value={avgPrice || ""}
              onChange={(e) => onChange(`${fieldPrefix}AvgPrice`, e.target.value)}
              className="pl-7 text-right font-mono"
              placeholder="150"
            />
          </div>
        </div>

        {/* GP% */}
        <div className="space-y-1">
          <Label className="text-xs font-medium flex items-center gap-1">
            GP% ของแพลตฟอร์ม
            <InfoTooltip content={`GP% = ค่า Commission ที่แพลตฟอร์มหักจากร้าน\nเช่น LINE MAN ปกติ = 30%, ไทยช่วยไทยพลัส = 23%\nดูได้จาก LINE MAN Partner Portal`} />
          </Label>
          <div className="relative">
            <Input
              type="number" min="0" max="100" step="0.1"
              value={gpPercent || ""}
              onChange={(e) => onChange(`${fieldPrefix}GpPercent`, e.target.value)}
              className="pr-7 text-right font-mono"
              placeholder={isPlus ? "23" : "30"}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
          </div>
        </div>

        {/* VAT on GP */}
        <div className="space-y-1">
          <Label className="text-xs font-medium flex items-center gap-1">
            VAT บน GP (%)
            <InfoTooltip content="ถ้าแพลตฟอร์มคิด VAT บน GP ให้ใส่ 7 ถ้าไม่คิดให้ใส่ 0" />
          </Label>
          <div className="relative">
            <Input
              type="number" min="0" max="100" step="0.1"
              value={vatOnGp || ""}
              onChange={(e) => onChange(`${fieldPrefix}VatOnGp`, e.target.value)}
              className="pr-7 text-right font-mono"
              placeholder="7"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
          </div>
        </div>

        {/* ต้นทุนรวม */}
        <div className="space-y-1">
          <Label className="text-xs font-medium flex items-center gap-1">
            ต้นทุนรวม/ออเดอร์
            <InfoTooltip content="Food Cost + บรรจุภัณฑ์ + ต้นทุนอื่นๆ ที่ร้านต้องจ่ายเอง (ไม่รวมค่า GP)" />
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">฿</span>
            <Input
              type="number" min="0" step="1"
              value={totalCost || ""}
              onChange={(e) => onChange(`${fieldPrefix}TotalCost`, e.target.value)}
              className="pl-7 text-right font-mono"
              placeholder="0"
            />
          </div>
        </div>

        {/* Result Summary */}
        <div className={cn(
          "rounded-lg px-3 py-3 space-y-2 border",
          isGreen ? "bg-blue-50 border-[#003DA5]/30" : "bg-gray-50 border-gray-200"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">รายรับสุทธิ</span>
            <span className="text-sm font-semibold num text-gray-800">฿{netRev.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={cn("text-xs font-bold", isGreen ? "text-[#003DA5]" : "text-gray-700")}>
              กำไรต่อออเดอร์
            </span>
            <span className={cn(
              "text-lg font-extrabold num",
              profit > 0 ? (isGreen ? "text-[#003DA5]" : "text-gray-800") : "text-red-600"
            )}>
              ฿{profit.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Margin หลัง GP</span>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm font-bold num",
                status === "healthy" ? "text-[#FF671F]" : status === "warning" ? "text-yellow-600" : "text-red-600"
              )}>
                {margin.toFixed(1)}%
              </span>
              <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", STATUS_CONFIG[status].className)}>
                {STATUS_CONFIG[status].label}
              </span>
            </div>
          </div>
        </div>

        {/* Advanced breakdown */}
        {showAdvanced && (
          <div className="rounded-lg bg-white border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-gray-600 mb-1">รายละเอียดการคำนวณ</p>
            <div className="flex justify-between">
              <span>ราคาขาย</span><span className="num">฿{avgPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-500">
              <span>ค่า GP ({gpPercent}%)</span><span className="num">−฿{gpAmt.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-400">
              <span>VAT บน GP ({vatOnGp}%)</span><span className="num">−฿{vatAmt.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 font-medium text-gray-700">
              <span>รายรับสุทธิ</span><span className="num">฿{netRev.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-500">
              <span>ต้นทุนรวม</span><span className="num">−฿{totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 font-bold text-gray-800">
              <span>กำไรต่อออเดอร์</span><span className="num">฿{profit.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Recommended price */}
        {totalCost > 0 && recPrice > 0 && (
          <div className={cn(
            "rounded-lg px-3 py-2 text-xs border",
            isGreen ? "bg-blue-50 border-[#003DA5]/30 text-[#003DA5]" : "bg-orange-50 border-[#FF671F]/30 text-[#EB4700]"
          )}>
            <span className="font-medium">ราคาขายต่ำสุดที่แนะนำ (Margin ≥ {DEFAULT_TARGET_MARGIN}%): </span>
            <span className="font-bold num">฿{recPrice}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
