import { useState, useEffect, useCallback, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GPCalculator, GPSettings, GPResults } from "@/components/GPCalculator";
import { StoreDashboard } from "@/components/StoreDashboard";
import { BreakEvenSection } from "@/components/BreakEvenSection";
import { MenuAnalysisSection } from "@/components/MenuAnalysisSection";
import { MonthlyOverviewSection } from "@/components/MonthlyOverviewSection";
import { PromotionSimulator } from "@/components/PromotionSimulator";
import { LeadGateModal } from "@/components/LeadGateModal";
import { DailyLogSection } from "@/components/DailyLogSection";
import { AdsCheckSection } from "@/components/AdsCheckSection";
import { Lock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";

const GATED_TABS = ["breakeven", "menu", "monthly", "promotion", "daily", "ads"];

const DEFAULT_SETTINGS: GPSettings = {
  normalAvgPrice: 150,
  normalGpPercent: 30,
  normalVatOnGp: 7,
  normalTotalCost: 0,
  plusAvgPrice: 150,
  plusGpPercent: 15,
  plusVatOnGp: 7,
  plusTotalCost: 0,
};

// ปกติ GP 30% + VAT 7%: ราคา 150 → GP=45, VAT=3.15 → รายรับ=101.85
// พลัส GP 15% + VAT 7%: ราคา 150 → GP=22.5, VAT=1.575 → รายรับ=125.925
const DEFAULT_RESULTS: GPResults = {
  normalNetRevenue: 101.85,
  normalProfitPerOrder: 101.85,
  normalMarginPercent: 67.9,
  normalGpAmount: 45,
  normalVatAmount: 3.15,
  normalStatus: "warning",
  plusNetRevenue: 125.925,
  plusProfitPerOrder: 125.925,
  plusMarginPercent: 83.95,
  plusGpAmount: 22.5,
  plusVatAmount: 1.575,
  plusStatus: "healthy",
  diffProfit: 24.075,
  diffMargin: 16.05,
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("calculator");
  const [gateOpen, setGateOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem("gp_session_id");
    if (stored) return stored;
    const id = nanoid();
    localStorage.setItem("gp_session_id", id);
    return id;
  });
  const [gpSettings, setGpSettings] = useState<GPSettings>(DEFAULT_SETTINGS);
  const [gpResults, setGpResults] = useState<GPResults>(DEFAULT_RESULTS);

  useEffect(() => {
    const phone = localStorage.getItem("gp_lead_phone");
    if (phone) setHasAccess(true);
  }, []);

  const handleSettingsChange = useCallback((settings: GPSettings, results: GPResults) => {
    setGpSettings(settings);
    setGpResults(results);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    if (GATED_TABS.includes(tab) && !hasAccess) {
      setPendingTab(tab);
      setGateOpen(true);
      return;
    }
    setActiveTab(tab);
  }, [hasAccess]);

  const tabs = [
    { id: "calculator", label: "ตั้งค่า GP", icon: "🧮", gated: false },
    { id: "dashboard", label: "Dashboard", icon: "📊", gated: false },
    { id: "daily", label: "บันทึกรายวัน", icon: "📝", gated: true },
    { id: "monthly", label: "ภาพรวมเดือน", icon: "📅", gated: true },
    { id: "breakeven", label: "จุดคุ้มทุน", icon: "🎯", gated: true },
    { id: "menu", label: "วิเคราะห์เมนู", icon: "🍽️", gated: true },
    { id: "promotion", label: "โปรโมชัน", icon: "🏷️", gated: true },
    { id: "ads", label: "เช็คค่า Ads", icon: "📣", gated: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/Wongnai Logo_update 2026 (1).png"
              alt="Wongnai"
              className="h-12 w-auto object-contain"
            />
            <div className="hidden sm:block w-px h-6 bg-gray-200" />
            <div className="hidden sm:block">
              <p className="text-xs text-gray-500 leading-tight">เครื่องมือวิเคราะห์กำไรร้านอาหาร</p>
            </div>
          </div>
          {!hasAccess && (
            <Button
              size="sm"
              onClick={() => setGateOpen(true)}
              className="bg-[#FF671F] hover:bg-[#EB4700] text-white text-xs gap-1"
            >
              <Lock className="w-3 h-3" />
              ปลดล็อกฟีเจอร์
            </Button>
          )}
          {hasAccess && (
            <Badge className="bg-orange-50 text-[#EB4700] border-[#FF671F]/30">
              ✓ ปลดล็อกแล้ว
            </Badge>
          )}
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#EB4700] to-[#FF671F] text-white">
        <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-white/20 text-white border-0 text-xs">GP Calculator</Badge>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 leading-tight">
                คำนวณกำไรร้านอาหาร<br className="sm:hidden" /> Delivery
              </h2>
              <p className="text-orange-100 text-sm sm:text-base">
                เปรียบเทียบกำไรออเดอร์ปกติ vs ไทยช่วยไทยพลัส<br />
                พร้อมวิเคราะห์ภาพรวมรายวันและรายเดือน
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
              <div className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
                <p className="text-2xl font-bold num">฿{gpResults.normalProfitPerOrder.toFixed(0)}</p>
                <p className="text-xs text-green-100 mt-0.5">กำไร/ออเดอร์ปกติ</p>
              </div>
              <div className="bg-white/25 rounded-xl p-3 text-center backdrop-blur-sm border border-white/30">
                <p className="text-2xl font-bold num">฿{gpResults.plusProfitPerOrder.toFixed(0)}</p>
                <p className="text-xs text-green-100 mt-0.5">กำไร/ออเดอร์พลัส</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          {/* Tab Navigation */}
          <div className="overflow-x-auto -mx-4 px-4 pb-1">
            <TabsList className="flex w-max gap-1 bg-white border border-gray-200 p-1 rounded-xl shadow-sm mb-6">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm rounded-lg whitespace-nowrap",
                    "data-[state=active]:bg-[#FF671F] data-[state=active]:text-white data-[state=active]:shadow-sm",
                    tab.gated && !hasAccess && "opacity-60"
                  )}
                >
                  <span>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                  {tab.gated && !hasAccess && (
                    <Lock className="w-3 h-3 opacity-50" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="mt-0">
            <div className="max-w-2xl mx-auto">
              <GPCalculator
                sessionId={sessionId}
                onSettingsChange={handleSettingsChange}
              />
            </div>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-0">
            <StoreDashboard
              normalAvgPrice={gpSettings.normalAvgPrice}
              normalGpPercent={gpResults.normalMarginPercent}
              plusAvgPrice={gpSettings.plusAvgPrice}
              plusGpPercent={gpResults.plusMarginPercent}
              normalGpPerOrder={gpResults.normalProfitPerOrder}
              plusGpPerOrder={gpResults.plusProfitPerOrder}
            />
          </TabsContent>

          {/* Daily Log Tab */}
          <TabsContent value="daily" className="mt-0">
            <div className="max-w-2xl mx-auto">
              <DailyLogSection
                sessionId={sessionId}
                normalGpPerOrder={gpResults.normalProfitPerOrder}
                plusGpPerOrder={gpResults.plusProfitPerOrder}
              />
            </div>
          </TabsContent>

          {/* Monthly Overview Tab */}
          <TabsContent value="monthly" className="mt-0">
            <MonthlyOverviewSection
              sessionId={sessionId}
              normalGpPerOrder={gpResults.normalProfitPerOrder}
              plusGpPerOrder={gpResults.plusProfitPerOrder}
              normalAvgPrice={gpSettings.normalAvgPrice}
              plusAvgPrice={gpSettings.plusAvgPrice}
            />
          </TabsContent>

          {/* Break-even Tab */}
          <TabsContent value="breakeven" className="mt-0">
            <div className="max-w-2xl mx-auto">
              <BreakEvenSection avgGrossProfitPerOrder={gpResults.plusProfitPerOrder} />
            </div>
          </TabsContent>

          {/* Menu Analysis Tab */}
          <TabsContent value="menu" className="mt-0">
            <div className="max-w-2xl mx-auto">
              <MenuAnalysisSection sessionId={sessionId} />
            </div>
          </TabsContent>

          {/* Promotion Simulator Tab */}
          <TabsContent value="promotion" className="mt-0">
            <div className="max-w-2xl mx-auto">
              <PromotionSimulator
                sellingPrice={gpSettings.normalAvgPrice}
                totalVariableCost={gpSettings.normalTotalCost}
              />
            </div>
          </TabsContent>

          {/* Ads Check Tab */}
          <TabsContent value="ads" className="mt-0">
            <div className="max-w-2xl mx-auto">
              <AdsCheckSection />
            </div>
          </TabsContent>
        </Tabs>

        {/* Locked Feature CTA */}
        {!hasAccess && (
          <div className="mt-10 rounded-2xl bg-gradient-to-r from-[#EB4700] to-[#FF671F] p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white -translate-y-1/2 translate-x-1/4" />
            </div>
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 opacity-80" />
                  <h3 className="text-lg font-bold">ปลดล็อกฟีเจอร์ขั้นสูงฟรี!</h3>
                </div>
                <p className="text-orange-100 text-sm mb-3">
                  ลงทะเบียนเพื่อใช้งาน: บันทึกรายวัน, ภาพรวมเดือน, จุดคุ้มทุน, วิเคราะห์เมนู และ Simulator โปรโมชัน
                </p>
                <div className="flex flex-wrap gap-2">
                  {["📝 บันทึกรายวัน", "📅 ภาพรวมเดือน", "🎯 จุดคุ้มทุน", "🍽️ วิเคราะห์เมนู", "🏷️ โปรโมชัน", "📣 เช็คค่า Ads"].map((f) => (
                    <span key={f} className="text-xs bg-white/20 px-2.5 py-1 rounded-full">{f}</span>
                  ))}
                </div>
              </div>
              <Button
                onClick={() => setGateOpen(true)}
                className="bg-white text-[#EB4700] hover:bg-orange-50 font-semibold shrink-0"
              >
                ลงทะเบียนฟรี
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Feature Cards */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { icon: "🧮", title: "ตั้งค่า GP", desc: "ปกติ vs พลัส", id: "calculator" },
            { icon: "📊", title: "Dashboard", desc: "กราฟ Bar & Donut", id: "dashboard" },
            { icon: "📝", title: "บันทึกรายวัน", desc: "ออเดอร์แต่ละวัน", id: "daily", gated: true },
            { icon: "📅", title: "ภาพรวมเดือน", desc: "กำไรสุทธิ", id: "monthly", gated: true },
            { icon: "🎯", title: "จุดคุ้มทุน", desc: "ออเดอร์ต่อวัน", id: "breakeven", gated: true },
            { icon: "🍽️", title: "วิเคราะห์เมนู", desc: "หาเมนูดาวเด่น", id: "menu", gated: true },
            { icon: "🏷️", title: "โปรโมชัน", desc: "ส่วนลดสูงสุด", id: "promotion", gated: true },
            { icon: "📣", title: "เช็คค่า Ads", desc: "ROAS คุ้มไหม", id: "ads", gated: true },
          ].map(({ icon, title, desc, id, gated }) => (
            <div
              key={id}
              className={cn(
                "rounded-xl border p-3 text-center cursor-pointer transition-all duration-200 hover:shadow-sm",
                gated && !hasAccess ? "border-gray-200 bg-gray-50 opacity-70" : "border-orange-100 bg-white hover:border-[#FF671F]/40"
              )}
              onClick={() => handleTabChange(id)}
            >
              <div className="text-2xl mb-1">{icon}</div>
              <p className="text-xs font-semibold text-gray-700">{title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              {gated && !hasAccess && <Lock className="w-3 h-3 text-gray-400 mx-auto mt-1" />}
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-12 pb-8 text-center text-xs text-gray-400">
          <p>Wongnai GP Calculator • เครื่องมือวิเคราะห์กำไรสำหรับร้านอาหาร</p>
          <p className="mt-1">ข้อมูลทั้งหมดถูกเก็บไว้ในเบราว์เซอร์ของคุณ ไม่มีการแชร์ข้อมูลโดยไม่ได้รับอนุญาต</p>
        </footer>
      </div>

      {/* Lead Gate Modal */}
      <LeadGateModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        featureName="ฟีเจอร์ขั้นสูง"
        onSuccess={(_phone: string) => {
          setHasAccess(true);
          setGateOpen(false);
          if (pendingTab) {
            setActiveTab(pendingTab);
            setPendingTab(null);
          }
        }}
      />
    </div>
  );
}
