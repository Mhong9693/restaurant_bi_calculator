import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InfoTooltip } from "./InfoTooltip";
import { Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

// Benchmark จากข้อมูลร้านส่วนใหญ่บน LINE MAN
const ROAS_BENCHMARK = 4.97;
const ADS_PERCENT_MAX = 25; // ค่า Ads ไม่ควรเกิน 10-25% ของยอดขาย

export function AdsCheckSection() {
  const [adsSales, setAdsSales] = useState(0);   // ยอดขายจากโฆษณา
  const [adsCost, setAdsCost] = useState(0);     // ต้นทุนโฆษณา
  const [totalSales, setTotalSales] = useState(0); // ยอดขายรวมทั้งร้าน

  const hasInput = adsSales > 0 && adsCost > 0;

  const roas = hasInput ? adsSales / adsCost : 0;
  const pctOfAdsSales = hasInput ? (adsCost / adsSales) * 100 : 0;
  const pctOfTotal = hasInput && totalSales > 0 ? (adsCost / totalSales) * 100 : null;

  // ตัดสินผลจาก % เทียบยอดขายรวมถ้ามี ไม่งั้นใช้ ROAS
  const verdict = (() => {
    if (!hasInput) return null;
    const pct = pctOfTotal ?? pctOfAdsSales;
    if (roas >= ROAS_BENCHMARK && pct <= ADS_PERCENT_MAX) {
      return { tone: "good", emoji: "✅", title: "คุ้ม ดันต่อได้เลย", desc: "ผลตอบแทนสูงกว่าค่าเฉลี่ยร้านส่วนใหญ่ ลองเพิ่มงบเพื่อเปิดการรับรู้กับลูกค้าใหม่ต่อเนื่อง" };
    }
    if (roas >= 3 && pct <= ADS_PERCENT_MAX) {
      return { tone: "ok", emoji: "👍", title: "ยังคุ้มอยู่", desc: "ผลตอบแทนอยู่ในเกณฑ์ใช้ได้ ลองปรับเมนูแนะนำหรือรูปภาพหน้าร้านเพื่อดัน ROAS ให้สูงขึ้น" };
    }
    return { tone: "warn", emoji: "⚠️", title: "เริ่มแพงไป ควรปรับ", desc: "ค่าโฆษณากินสัดส่วนยอดขายมากเกินเกณฑ์ ลองพักดูผล ปรับช่วงเวลายิง หรือเช็คว่าเมนูหน้าร้านน่ากดพอไหม" };
  })();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-[#EB4700]">
            <Megaphone className="w-4 h-4" />
            เช็คความคุ้มค่าโฆษณา LINE MAN
            <InfoTooltip content={"โฆษณาบน LINE MAN มี 2 แบบ\\nCPC (Cost Per Click) จ่ายต่อคลิก เหมาะกับร้านบิลเฉลี่ยต่ำกว่า 200 บาท\\nCPO (Cost Per Order) จ่ายต่อออเดอร์ที่ปิดได้ เหมาะกับร้านบิลเฉลี่ยสูงกว่า 200 บาท\\nกรอกตัวเลขจากหน้า 'โฆษณา' ใน LINE MAN Partner Portal ได้เลย"} />
          </CardTitle>
          <p className="text-xs text-gray-400 -mt-1">
            เปิดดูตัวเลขได้จาก LINE MAN Partner Portal → เมนูโฆษณา → ภาพรวมผลลัพธ์ทั้งหมด
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs font-medium flex items-center gap-1">
              ยอดขายจากโฆษณา
              <InfoTooltip content="ยอดขายทั้งหมดที่เกิดจากโฆษณา ดูจากช่อง 'ยอดขายทั้งหมดจากโฆษณา'" />
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">฿</span>
              <Input
                type="number" min="0" step="1"
                value={adsSales || ""}
                onChange={(e) => setAdsSales(parseFloat(e.target.value) || 0)}
                className="pl-7 text-right font-mono"
                placeholder="164676"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium flex items-center gap-1">
              ต้นทุนโฆษณา
              <InfoTooltip content="งบโฆษณาที่จ่ายไปจริง ดูจากช่อง 'ต้นทุนโฆษณาทั้งหมด' หรือ 'งบที่ใช้ไป'" />
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">฿</span>
              <Input
                type="number" min="0" step="1"
                value={adsCost || ""}
                onChange={(e) => setAdsCost(parseFloat(e.target.value) || 0)}
                className="pl-7 text-right font-mono"
                placeholder="23570"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium flex items-center gap-1">
              ยอดขายรวมทั้งร้าน <span className="text-gray-400 font-normal">(ไม่บังคับ)</span>
              <InfoTooltip content={"ยอดขายรวมทุกช่องทางในช่วงเวลาเดียวกัน\\nสำคัญมาก: ให้มองยอดขายรวม อย่ามองแต่ยอดขายจากโฆษณา เพราะโฆษณาช่วยดันยอดขายปกติด้วย"} />
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">฿</span>
              <Input
                type="number" min="0" step="1"
                value={totalSales || ""}
                onChange={(e) => setTotalSales(parseFloat(e.target.value) || 0)}
                className="pl-7 text-right font-mono"
                placeholder="ใส่เพื่อให้ผลแม่นยำขึ้น"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Results ── */}
      {hasInput && verdict && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {/* ROAS */}
            <Card className={cn("border-2", roas >= ROAS_BENCHMARK ? "border-green-300 bg-green-50/50" : "border-orange-200 bg-orange-50/50")}>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                  ROAS ผลตอบแทนโฆษณา
                  <InfoTooltip content="ROAS = ยอดขายจากโฆษณา ÷ ต้นทุนโฆษณา ยิ่งสูงยิ่งคุ้ม" />
                </p>
                <p className={cn("text-3xl font-bold num mt-1", roas >= ROAS_BENCHMARK ? "text-green-600" : "text-orange-500")}>
                  {roas.toFixed(2)} <span className="text-base font-medium">เท่า</span>
                </p>
                <p className="text-[11px] text-gray-400 mt-1">ค่าเฉลี่ยร้านส่วนใหญ่ {ROAS_BENCHMARK}</p>
                {/* benchmark bar */}
                <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", roas >= ROAS_BENCHMARK ? "bg-green-500" : "bg-orange-400")}
                    style={{ width: `${Math.min(100, (roas / (ROAS_BENCHMARK * 2)) * 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* % of sales */}
            <Card className={cn("border-2", (pctOfTotal ?? pctOfAdsSales) <= ADS_PERCENT_MAX ? "border-green-300 bg-green-50/50" : "border-red-200 bg-red-50/50")}>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                  ค่า Ads เทียบ{pctOfTotal !== null ? "ยอดขายรวม" : "ยอดขายจากโฆษณา"}
                  <InfoTooltip content="ค่าโฆษณาไม่ควรเกิน 10-25% ของยอดขาย" />
                </p>
                <p className={cn("text-3xl font-bold num mt-1", (pctOfTotal ?? pctOfAdsSales) <= ADS_PERCENT_MAX ? "text-green-600" : "text-red-500")}>
                  {(pctOfTotal ?? pctOfAdsSales).toFixed(1)}<span className="text-base font-medium">%</span>
                </p>
                <p className="text-[11px] text-gray-400 mt-1">เกณฑ์แนะนำไม่เกิน 10-25%</p>
                <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", (pctOfTotal ?? pctOfAdsSales) <= ADS_PERCENT_MAX ? "bg-green-500" : "bg-red-400")}
                    style={{ width: `${Math.min(100, ((pctOfTotal ?? pctOfAdsSales) / 50) * 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Verdict */}
          <Card className={cn(
            "border-2",
            verdict.tone === "good" && "border-green-300 bg-green-50",
            verdict.tone === "ok" && "border-yellow-300 bg-yellow-50",
            verdict.tone === "warn" && "border-red-300 bg-red-50",
          )}>
            <CardContent className="py-4">
              <p className="font-bold text-sm">
                {verdict.emoji} {verdict.title}
              </p>
              <p className="text-xs text-gray-600 mt-1">{verdict.desc}</p>
              {pctOfTotal === null && (
                <p className="text-[11px] text-gray-400 mt-2">
                  💡 ใส่ยอดขายรวมทั้งร้านด้วย จะเห็นภาพจริงกว่า เพราะโฆษณาช่วยดันยอดขายช่องทางปกติด้วย
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!hasInput && (
        <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-gray-400 text-sm">
          <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-30" />
          กรอกยอดขายจากโฆษณาและต้นทุนโฆษณา
          <br />
          เพื่อเช็คว่า Ads ที่ยิงไปคุ้มไหม
        </div>
      )}
    </div>
  );
}
