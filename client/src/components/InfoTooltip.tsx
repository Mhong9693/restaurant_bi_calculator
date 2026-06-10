import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface InfoTooltipProps {
  content: string;
  className?: string;
}

export function InfoTooltip({ content, className }: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-center text-green-500 hover:text-green-700 transition-colors ${className ?? ""}`}
          aria-label="ข้อมูลเพิ่มเติม"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs text-xs leading-relaxed bg-gray-900 text-white border-0 shadow-xl"
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

export const TOOLTIPS = {
  gp: "GP (Gross Profit) คือกำไรขั้นต้น = รายได้หลังหักค่า Commission และ VAT ลบด้วยต้นทุนวัตถุดิบและบรรจุภัณฑ์",
  gpMargin: "GP Margin % คือสัดส่วนกำไรต่อราคาขาย เช่น 30% หมายความว่าทุก 100 บาทที่ขายได้ มีกำไร 30 บาท",
  breakEven: "จุดคุ้มทุน คือจำนวนออเดอร์ขั้นต่ำที่ต้องขายเพื่อให้รายได้เท่ากับต้นทุนทั้งหมด (ไม่ขาดทุน ไม่กำไร)",
  foodCost: "ต้นทุนวัตถุดิบ คือค่าใช้จ่ายสำหรับส่วนผสมและวัตถุดิบที่ใช้ทำอาหารในแต่ละออเดอร์",
  commission: "ค่า Commission คือส่วนแบ่งที่ LINE MAN หักจากยอดขายของร้าน ปกติ 30% สำหรับโปรแกรมพิเศษ 23%",
  thaiPlus: "LINE MAN โปรแกรมพิเศษ คือโปรแกรมที่ลดค่า Commission เหลือ 23% เพื่อช่วยร้านอาหารพาร์ทเนอร์",
  netProfit: "กำไรสุทธิ คือกำไรหลังหักต้นทุนคงที่ทั้งหมด เช่น ค่าเช่า ค่าแรง ค่าน้ำไฟ",
  fixedCost: "ต้นทุนคงที่ คือค่าใช้จ่ายที่เกิดขึ้นทุกเดือนไม่ว่าจะขายได้มากหรือน้อย เช่น ค่าเช่าร้าน ค่าแรงพนักงาน",
  vatOnGP: "VAT 7% บน GP คือภาษีที่ LINE MAN หักจากค่า Commission ก่อนจ่ายให้ร้าน",
  recommendedPrice: "ราคาแนะนำ คือราคาขายขั้นต่ำที่ควรตั้งเพื่อให้ได้ GP Margin ตามเป้าหมาย",
};
