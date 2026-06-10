import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateGP } from "@shared/gpCalculations";
import { getMarginStatus, StatusBadge } from "./StatusBadge";
import { InfoTooltip, TOOLTIPS } from "./InfoTooltip";
import { Plus, Trash2, Star, AlertTriangle, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface MenuItem {
  id?: number;
  name: string;
  sellingPrice: number;
  foodCost: number;
  packagingCost: number;
  otherCost: number;
}

const defaultItem = (): MenuItem => ({
  name: "",
  sellingPrice: 0,
  foodCost: 0,
  packagingCost: 5,
  otherCost: 0,
});

function calcItem(item: MenuItem) {
  return calculateGP({
    sellingPrice: item.sellingPrice,
    foodCost: item.foodCost,
    packagingCost: item.packagingCost,
    otherCost: item.otherCost,
    restaurantDiscount: 0,
    deliverySubsidy: 0,
  });
}

export function MenuAnalysisSection({ sessionId }: { sessionId: string }) {
  const [items, setItems] = useState<MenuItem[]>([
    { name: "เมนูตัวอย่าง 1", sellingPrice: 100, foodCost: 25, packagingCost: 5, otherCost: 0 },
    { name: "เมนูตัวอย่าง 2", sellingPrice: 80, foodCost: 30, packagingCost: 5, otherCost: 0 },
  ]);
  const [newItem, setNewItem] = useState<MenuItem>(defaultItem());
  const [showForm, setShowForm] = useState(false);

  const addMutation = trpc.menuItems.add.useMutation({
    onSuccess: () => toast.success("เพิ่มเมนูสำเร็จ"),
    onError: () => toast.error("เกิดข้อผิดพลาด"),
  });

  const handleAdd = useCallback(() => {
    if (!newItem.name.trim() || newItem.sellingPrice <= 0) {
      toast.error("กรุณากรอกชื่อเมนูและราคาขาย");
      return;
    }
    setItems((prev) => [...prev, { ...newItem }]);
    addMutation.mutate({ ...newItem, sessionId });
    setNewItem(defaultItem());
    setShowForm(false);
  }, [newItem, sessionId, addMutation]);

  const handleRemove = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calcs = items.map(calcItem);
  const maxMargin = Math.max(...calcs.map((c) => c.gpMarginThaiPlus), 0);
  const starIndex = calcs.findIndex((c) => c.gpMarginThaiPlus === maxMargin);

  return (
    <div className="space-y-5">
      {/* Items Table */}
      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item, i) => {
            const calc = calcs[i];
            const status = getMarginStatus(calc.gpMarginThaiPlus);
            const isStar = i === starIndex && calc.gpMarginThaiPlus > 0;
            const shouldAdjust = status === "danger";

            return (
              <Card
                key={i}
                className={cn(
                  "border transition-all duration-200",
                  isStar ? "border-green-300 bg-green-50/30" :
                  shouldAdjust ? "border-red-200 bg-red-50/20" : "border-gray-200"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-800 truncate">{item.name}</h4>
                        {isStar && (
                          <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            เมนูดาวเด่น
                          </span>
                        )}
                        {shouldAdjust && (
                          <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                            <AlertTriangle className="w-3 h-3" />
                            ควรปรับราคา
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">ราคาขาย</span>
                          <p className="font-semibold num">฿{item.sellingPrice}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">ต้นทุน</span>
                          <p className="font-semibold num">฿{(item.foodCost + item.packagingCost + item.otherCost).toFixed(0)}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">GP (ไทยช่วยไทย+)</span>
                          <p className={cn("font-bold num", status === "healthy" ? "text-green-700" : status === "warning" ? "text-yellow-600" : "text-red-600")}>
                            {calc.gpMarginThaiPlus.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">กำไร/ออเดอร์</span>
                          <p className={cn("font-bold num", calc.grossProfitThaiPlus >= 0 ? "text-green-700" : "text-red-600")}>
                            ฿{calc.grossProfitThaiPlus.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={status} />
                      <button
                        onClick={() => handleRemove(i)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                        aria-label="ลบเมนู"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">ยังไม่มีเมนู กดปุ่ม "เพิ่มเมนู" เพื่อเริ่มต้น</p>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-green-800">เพิ่มเมนูใหม่</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-medium text-gray-700">ชื่อเมนู</Label>
                <Input
                  placeholder="เช่น ข้าวมันไก่"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                />
              </div>
              {[
                { key: "sellingPrice" as const, label: "ราคาขาย (฿)" },
                { key: "foodCost" as const, label: "ต้นทุนวัตถุดิบ (฿)" },
                { key: "packagingCost" as const, label: "ค่าบรรจุภัณฑ์ (฿)" },
                { key: "otherCost" as const, label: "ต้นทุนอื่นๆ (฿)" },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">{label}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={newItem[key] === 0 ? "" : newItem[key]}
                    onChange={(e) => setNewItem({ ...newItem, [key]: Number(e.target.value) || 0 })}
                    className="text-right font-mono"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleAdd} className="bg-green-600 hover:bg-green-700 text-white" size="sm">
                บันทึกเมนู
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline" size="sm">
                ยกเลิก
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Button */}
      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          variant="outline"
          className="w-full border-dashed border-green-300 text-green-700 hover:bg-green-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มเมนู
        </Button>
      )}

      {/* Summary */}
      {items.length > 1 && (
        <Card className="border-green-100 bg-green-50/30">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-green-800 mb-3">สรุปภาพรวมเมนู</p>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div>
                <p className="text-gray-500">GP Margin เฉลี่ย</p>
                <p className="text-lg font-bold text-green-700 num">
                  {(calcs.reduce((a, c) => a + c.gpMarginThaiPlus, 0) / calcs.length).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-gray-500">เมนูที่ดี (≥30%)</p>
                <p className="text-lg font-bold text-green-700 num">
                  {calcs.filter((c) => c.gpMarginThaiPlus >= 30).length}/{items.length}
                </p>
              </div>
              <div>
                <p className="text-gray-500">เมนูที่ควรปรับ</p>
                <p className="text-lg font-bold text-red-600 num">
                  {calcs.filter((c) => c.gpMarginThaiPlus < 15).length}/{items.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
