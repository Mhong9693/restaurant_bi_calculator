import { useState, useCallback, useMemo, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GPCalculator } from "@/components/GPCalculator";
import { StoreDashboard } from "@/components/StoreDashboard";
import { BreakEvenSection } from "@/components/BreakEvenSection";
import { MenuAnalysisSection } from "@/components/MenuAnalysisSection";
import { MonthlyOverviewSection } from "@/components/MonthlyOverviewSection";
import { PromotionSimulator } from "@/components/PromotionSimulator";
import { LeadGateModal } from "@/components/LeadGateModal";
import { calculateGP } from "@shared/gpCalculations";
import { Lock, ChefHat, BarChart2, Target, UtensilsCrossed, Calendar, Tag, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";

export interface CalcInputs {
  sellingPrice: number;
  foodCost: number;
  packagingCost: number;
  otherCost: number;
  restaurantDiscount: number;
  deliverySubsidy: number;
}

const DEFAULT_INPUTS: CalcInputs = {
  sellingPrice: 100,
  foodCost: 25,
  packagingCost: 5,
  otherCost: 0,
  restaurantDiscount: 0,
  deliverySubsidy: 0,
};

const GATED_TABS = ["breakeven", "menu", "monthly", "promotion"];

export default function Home() {
  const [activeTab, setActiveTab] = useState("calculator");
  const [gateOpen, setGateOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [sessionId] = useState(() => nanoid());
  const [calcInputs, setCalcInputs] = useState<CalcInputs>(DEFAULT_INPUTS);

  useEffect(() => {
    const phone = localStorage.getItem("gp_lead_phone");
    if (phone) setHasAccess(true);
  }, []);

  const gpResult = useMemo(() => calculateGP(calcInputs), [calcInputs]);

  const handleTabChange = useCallback((tab: string) => {
    if (GATED_TABS.includes(tab) && !hasAccess) {
      setPendingTab(tab);
      setGateOpen(true);
      return;
    }
    setActiveTab(tab);
  }, [hasAccess]);

  const handleLeadSuccess = useCallback((phone: string) => {
    localStorage.setItem("gp_lead_phone", phone);
    setHasAccess(true);
    setGateOpen(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  }, [pendingTab]);

  const tabs = [
    { id: "calculator", label: "คำนวณ GP", icon: <ChefHat className="w-4 h-4" />, gated: false },
    { id: "dashboard", label: "Dashboard", icon: <BarChart2 className="w-4 h-4" />, gated: false },
    { id: "breakeven", label: "จุดคุ้มทุน", icon: <Target className="w-4 h-4" />, gated: true },
    { id: "menu", label: "วิเคราะห์เมนู", icon: <UtensilsCrossed className="w-4 h-4" />, gated: true },
    { id: "monthly", label: "ภาพรวมเดือน", icon: <Calendar className="w-4 h-4" />, gated: true },
    { id: "promotion", label: "โปรโมชัน", icon: <Tag className="w-4 h-4" />, gated: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-green-100 shadow-sm">
        <div className="container py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center shadow-sm">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-tight">ไทยช่วยไทยพลัส</h1>
                <p className="text-xs text-green-600 font-medium leading-tight">GP Calculator & Business Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50 hidden sm:flex">
                <Sparkles className="w-3 h-3 mr-1" />
                GrabFood ไทยช่วยไทยพลัส
              </Badge>
              {!hasAccess && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white text-xs"
                  onClick={() => setGateOpen(true)}
                >
                  <Lock className="w-3 h-3 mr-1" />
                  ปลดล็อกฟีเจอร์
                </Button>
              )}
              {hasAccess && (
                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                  ✅ ปลดล็อกแล้ว
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full bg-white translate-y-1/2" />
        </div>
        <div className="container py-6 sm:py-8 relative">
          <div className="max-w-2xl">
            <p className="text-green-200 text-xs font-medium mb-1.5 uppercase tracking-wider">สำหรับร้านอาหารเดลิเวอรี</p>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2.5 leading-tight">
              คำนวณ GP และวิเคราะห์<br className="hidden sm:block" />ธุรกิจร้านอาหารของคุณ
            </h2>
            <p className="text-green-100 text-sm leading-relaxed mb-4">
              เปรียบเทียบกำไรระหว่าง Commission ปกติ 30% กับโปรแกรม
              <strong className="text-white"> ไทยช่วยไทยพลัส 23%</strong> พร้อมวิเคราะห์จุดคุ้มทุน เมนู และโปรโมชัน
            </p>
            {/* Quick stats */}
            <div className="flex flex-wrap gap-3">
              {[
                { label: "ประหยัด Commission", value: "7%" },
                { label: "GP เพิ่มขึ้น", value: `+฿${(gpResult.grossProfitThaiPlus - gpResult.grossProfit).toFixed(2)}` },
                { label: "GP Margin ไทยช่วยไทย+", value: `${gpResult.gpMarginThaiPlus.toFixed(1)}%` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs">
                  <span className="opacity-80">{label}: </span>
                  <span className="font-bold">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          {/* Tab Navigation */}
          <div className="mb-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
            <TabsList className="inline-flex h-auto gap-1 bg-white border border-green-100 shadow-sm rounded-xl p-1 min-w-max">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm rounded-lg transition-all duration-200",
                    "data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-sm",
                    "data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-green-50"
                  )}
                  onClick={() => handleTabChange(tab.id)}
                >
                  {tab.icon}
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
              <GPCalculator onInputsChange={setCalcInputs} />
            </div>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-0">
            <StoreDashboard {...calcInputs} />
          </TabsContent>

          {/* Break-even Tab */}
          <TabsContent value="breakeven" className="mt-0">
            <div className="max-w-2xl mx-auto">
              <BreakEvenSection avgGrossProfitPerOrder={gpResult.grossProfitThaiPlus} />
            </div>
          </TabsContent>

          {/* Menu Analysis Tab */}
          <TabsContent value="menu" className="mt-0">
            <div className="max-w-2xl mx-auto">
              <MenuAnalysisSection sessionId={sessionId} />
            </div>
          </TabsContent>

          {/* Monthly Overview Tab */}
          <TabsContent value="monthly" className="mt-0">
            <div className="max-w-2xl mx-auto">
              <MonthlyOverviewSection avgGrossProfitPerOrder={gpResult.grossProfitThaiPlus} />
            </div>
          </TabsContent>

          {/* Promotion Simulator Tab */}
          <TabsContent value="promotion" className="mt-0">
            <div className="max-w-2xl mx-auto">
              <PromotionSimulator
                sellingPrice={calcInputs.sellingPrice}
                totalVariableCost={calcInputs.foodCost + calcInputs.packagingCost + calcInputs.otherCost}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Locked Feature CTA */}
        {!hasAccess && (
          <div className="mt-10 rounded-2xl bg-gradient-to-r from-green-700 to-emerald-500 p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white -translate-y-1/2 translate-x-1/4" />
            </div>
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 opacity-80" />
                  <h3 className="text-lg font-bold">ปลดล็อกฟีเจอร์ขั้นสูงฟรี!</h3>
                </div>
                <p className="text-green-100 text-sm mb-3">
                  ลงทะเบียนเพื่อใช้งาน: วิเคราะห์จุดคุ้มทุน, วิเคราะห์เมนู, ภาพรวมรายเดือน และ Simulator โปรโมชัน
                </p>
                <div className="flex flex-wrap gap-2">
                  {["🎯 จุดคุ้มทุน", "🍽️ วิเคราะห์เมนู", "📅 ภาพรวมเดือน", "🏷️ โปรโมชัน"].map((f) => (
                    <span key={f} className="text-xs bg-white/20 px-2.5 py-1 rounded-full">{f}</span>
                  ))}
                </div>
              </div>
              <Button
                onClick={() => setGateOpen(true)}
                className="bg-white text-green-700 hover:bg-green-50 font-semibold shrink-0"
              >
                ลงทะเบียนฟรี
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Feature explanation cards */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { icon: "🧮", title: "คำนวณ GP", desc: "เปรียบเทียบ 30% vs 23%" },
            { icon: "📊", title: "Dashboard", desc: "กราฟ Bar & Donut" },
            { icon: "🎯", title: "จุดคุ้มทุน", desc: "ออเดอร์ต่อวัน", gated: true },
            { icon: "🍽️", title: "วิเคราะห์เมนู", desc: "หาเมนูดาวเด่น", gated: true },
            { icon: "📅", title: "ภาพรวมเดือน", desc: "กำไรสุทธิ", gated: true },
            { icon: "🏷️", title: "โปรโมชัน", desc: "ส่วนลดสูงสุด", gated: true },
          ].map(({ icon, title, desc, gated }) => (
            <div
              key={title}
              className={cn(
                "rounded-xl border p-3 text-center cursor-pointer transition-all duration-200 hover:shadow-sm",
                gated && !hasAccess ? "border-gray-200 bg-gray-50 opacity-70" : "border-green-100 bg-white hover:border-green-200"
              )}
              onClick={() => handleTabChange(tabs.find(t => t.label === title)?.id ?? "calculator")}
            >
              <div className="text-2xl mb-1">{icon}</div>
              <p className="text-xs font-semibold text-gray-700">{title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              {gated && !hasAccess && <Lock className="w-3 h-3 text-gray-400 mx-auto mt-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-green-100 bg-white mt-10">
        <div className="container py-4 text-center text-xs text-gray-400 space-y-1">
          <p>เครื่องมือนี้ใช้สำหรับประมาณการเท่านั้น ตัวเลขจริงอาจแตกต่างตามเงื่อนไขของ GrabFood</p>
          <p>Commission ปกติ 30% | ไทยช่วยไทยพลัส 23% | VAT 7% บน Commission</p>
        </div>
      </footer>

      {/* Lead Gate Modal */}
      <LeadGateModal
        open={gateOpen}
        onClose={() => { setGateOpen(false); setPendingTab(null); }}
        onSuccess={handleLeadSuccess}
        featureName={pendingTab ? tabs.find(t => t.id === pendingTab)?.label ?? "ฟีเจอร์ขั้นสูง" : "ฟีเจอร์ขั้นสูง"}
      />
    </div>
  );
}
