import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Lock, Unlock, Store, Phone, MapPin, UtensilsCrossed } from "lucide-react";

const PROVINCES = [
  "กรุงเทพมหานคร","กระบี่","กาญจนบุรี","กาฬสินธุ์","กำแพงเพชร","ขอนแก่น","จันทบุรี","ฉะเชิงเทรา",
  "ชลบุรี","ชัยนาท","ชัยภูมิ","ชุมพร","เชียงราย","เชียงใหม่","ตรัง","ตราด","ตาก","นครนายก",
  "นครปฐม","นครพนม","นครราชสีมา","นครศรีธรรมราช","นครสวรรค์","นนทบุรี","นราธิวาส","น่าน",
  "บึงกาฬ","บุรีรัมย์","ปทุมธานี","ประจวบคีรีขันธ์","ปราจีนบุรี","ปัตตานี","พระนครศรีอยุธยา",
  "พะเยา","พังงา","พัทลุง","พิจิตร","พิษณุโลก","เพชรบุรี","เพชรบูรณ์","แพร่","ภูเก็ต",
  "มหาสารคาม","มุกดาหาร","แม่ฮ่องสอน","ยโสธร","ยะลา","ร้อยเอ็ด","ระนอง","ระยอง","ราชบุรี",
  "ลพบุรี","ลำปาง","ลำพูน","เลย","ศรีสะเกษ","สกลนคร","สงขลา","สตูล","สมุทรปราการ",
  "สมุทรสงคราม","สมุทรสาคร","สระแก้ว","สระบุรี","สิงห์บุรี","สุโขทัย","สุพรรณบุรี",
  "สุราษฎร์ธานี","สุรินทร์","หนองคาย","หนองบัวลำภู","อ่างทอง","อำนาจเจริญ","อุดรธานี",
  "อุตรดิตถ์","อุทัยธานี","อุบลราชธานี"
];

const FOOD_CATEGORIES = [
  "อาหารไทย","อาหารอีสาน","อาหารเหนือ","อาหารใต้","อาหารจีน","อาหารญี่ปุ่น","อาหารเกาหลี",
  "อาหารตะวันตก","อาหารทะเล","ก๋วยเตี๋ยว / ข้าวต้ม","ข้าวมันไก่ / ข้าวหมูแดง","ส้มตำ / อาหารยำ",
  "ของทอด / ของกินเล่น","เครื่องดื่ม / ชานม","เบเกอรี่ / ขนม","อื่นๆ"
];

interface LeadGateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (phone: string) => void;
  featureName: string;
}

export function LeadGateModal({ open, onClose, onSuccess, featureName }: LeadGateModalProps) {
  const [form, setForm] = useState({
    storeName: "",
    phone: "",
    province: "",
    foodCategory: "",
    pdpaConsent: false,
    interestedWongnaiPos: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submitMutation = trpc.leads.submit.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        onSuccess(form.phone);
      }
    },
    onError: (err) => {
      toast.error("เกิดข้อผิดพลาด: " + err.message);
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.storeName.trim()) newErrors.storeName = "กรุณากรอกชื่อร้าน";
    if (!form.phone.trim() || form.phone.length < 9) newErrors.phone = "กรุณากรอกเบอร์โทรที่ถูกต้อง";
    if (!form.province) newErrors.province = "กรุณาเลือกจังหวัด";
    if (!form.foodCategory) newErrors.foodCategory = "กรุณาเลือกประเภทอาหาร";
    if (!form.pdpaConsent) newErrors.pdpaConsent = "กรุณายินยอมเงื่อนไข PDPA";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    submitMutation.mutate({
      storeName: form.storeName,
      phone: form.phone,
      province: form.province,
      foodCategory: form.foodCategory,
      pdpaConsent: form.pdpaConsent,
      interestedWongnaiPos: form.interestedWongnaiPos,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Lock className="w-4 h-4 text-green-600" />
            </div>
            <DialogTitle className="text-lg">ปลดล็อก {featureName}</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-500">
            กรอกข้อมูลร้านของคุณเพื่อใช้งานฟีเจอร์นี้ฟรี ข้อมูลจะถูกเก็บเป็นความลับ
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Store Name */}
          <div className="space-y-1">
            <Label htmlFor="storeName" className="flex items-center gap-1.5 text-sm font-medium">
              <Store className="w-3.5 h-3.5 text-green-600" />
              ชื่อร้าน
            </Label>
            <Input
              id="storeName"
              placeholder="เช่น ร้านข้าวมันไก่ป้าแดง"
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              className={errors.storeName ? "border-red-400" : ""}
            />
            {errors.storeName && <p className="text-xs text-red-500">{errors.storeName}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <Label htmlFor="phone" className="flex items-center gap-1.5 text-sm font-medium">
              <Phone className="w-3.5 h-3.5 text-green-600" />
              เบอร์โทรศัพท์
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="เช่น 0812345678"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
              maxLength={10}
              className={errors.phone ? "border-red-400" : ""}
            />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
          </div>

          {/* Province */}
          <div className="space-y-1">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <MapPin className="w-3.5 h-3.5 text-green-600" />
              จังหวัด
            </Label>
            <Select value={form.province} onValueChange={(v) => setForm({ ...form, province: v })}>
              <SelectTrigger className={errors.province ? "border-red-400" : ""}>
                <SelectValue placeholder="เลือกจังหวัด" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {PROVINCES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.province && <p className="text-xs text-red-500">{errors.province}</p>}
          </div>

          {/* Food Category */}
          <div className="space-y-1">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <UtensilsCrossed className="w-3.5 h-3.5 text-green-600" />
              ประเภทอาหาร
            </Label>
            <Select value={form.foodCategory} onValueChange={(v) => setForm({ ...form, foodCategory: v })}>
              <SelectTrigger className={errors.foodCategory ? "border-red-400" : ""}>
                <SelectValue placeholder="เลือกประเภทอาหาร" />
              </SelectTrigger>
              <SelectContent>
                {FOOD_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.foodCategory && <p className="text-xs text-red-500">{errors.foodCategory}</p>}
          </div>

          {/* Wongnai POS Interest */}
          <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5">
            <Checkbox
              id="wongnaiPos"
              checked={form.interestedWongnaiPos}
              onCheckedChange={(v) => setForm({ ...form, interestedWongnaiPos: !!v })}
              className="mt-0.5"
            />
            <Label htmlFor="wongnaiPos" className="text-xs text-green-800 leading-relaxed cursor-pointer font-medium">
              ⭐ สนใจ Demo Wongnai POS พร้อมรับโปรโมชันราคาพิเศษ
            </Label>
          </div>

          {/* PDPA */}
          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <Checkbox
                id="pdpa"
                checked={form.pdpaConsent}
                onCheckedChange={(v) => setForm({ ...form, pdpaConsent: !!v })}
                className="mt-0.5"
              />
              <Label htmlFor="pdpa" className="text-xs text-gray-600 leading-relaxed cursor-pointer">
                ฉันยินยอมให้เก็บรวบรวมและใช้ข้อมูลส่วนบุคคลเพื่อวัตถุประสงค์ในการให้บริการและติดต่อกลับ
                ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA)
              </Label>
            </div>
            {errors.pdpaConsent && <p className="text-xs text-red-500">{errors.pdpaConsent}</p>}
          </div>

          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังลงทะเบียน...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Unlock className="w-4 h-4" />
                ลงทะเบียนฟรี — ปลดล็อกทันที
              </span>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
