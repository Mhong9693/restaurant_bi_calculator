# Restaurant GP Calculator - Todo

## Backend
- [x] Database schema: leads table (store_name, phone, province, food_category, pdpa_consent)
- [x] Database schema: menu_items table (name, price, food_cost, packaging_cost, other_cost)
- [x] tRPC router: leads.submit (public) - save lead + notify owner
- [x] tRPC router: leads.checkAccess (public) - check if phone has submitted lead
- [x] tRPC router: menuItems.save / list (session-based)

## Frontend - Core
- [x] Global CSS: green/white theme, IBM Plex Sans Thai font, color tokens
- [x] Landing / Main Calculator Page with real-time GP comparison (normal vs ไทยช่วยไทยพลัส)
- [x] Profit amount, Margin %, Recommended selling price display
- [x] Tooltips for GP, Margin, Break-even, Food Cost terms

## Frontend - Dashboard
- [x] Store Dashboard page with Bar chart (profit comparison)
- [x] Donut chart (cost breakdown)
- [x] Color coding: green=healthy, yellow=warning, red=loss

## Frontend - Lead Generation Gate
- [x] Registration form modal: store name, phone, province, food category
- [x] PDPA consent checkbox
- [x] Gate: lock advanced features until form submitted
- [x] Owner notification on new lead submission

## Frontend - Feature-Gated Sections
- [x] Break-even Analysis: monthly fixed costs input, orders/day calculation
- [x] Menu Analysis: add multiple items, compare profit/margin, flag star/adjust items
- [x] Monthly Overview: actual order count, total profit, avg GP, net profit
- [x] Promotion & Discount Simulator: discount impact, max discount without loss

## UI/UX Polish
- [x] Fully responsive (mobile + desktop)
- [x] Inline financial term explanations
- [x] Dynamic color feedback on all calculated values
- [x] Smooth animations and transitions
- [x] Hero banner with live stats

## Testing
- [x] Vitest: GP calculation logic tests (11 tests passing)
- [x] Vitest: auth.logout router test (1 test passing)

## GP Calculator Redesign + Daily Log + Monthly Summary

- [x] Database: เพิ่ม table gpSettings (avgOrderPrice, gpPercent สำหรับทั้งสองช่องทาง)
- [x] Database: เพิ่ม table dailyLogs (date, normalOrders, plusOrders, sessionId)
- [x] GP Calculator: ปรับให้กรอกราคาขายเฉลี่ย + GP% แทน item-level
- [x] GP Calculator: แสดงกำไรต่อออเดอร์แต่ละช่องทางทันที
- [x] GP Calculator: แสดงผลต่างกำไรต่อออเดอร์ระหว่างสองช่องทาง
- [x] Daily Log: หน้ากรอกออเดอร์รายวัน (ปกติ vs ไทยช่วยไทยพลัส)
- [x] Daily Log: แสดงรายได้รวม + กำไรรวมแต่ละช่องทางต่อวัน
- [x] Daily Log: แสดงสัดส่วน % ออเดอร์แต่ละประเภท
- [x] Monthly Summary: กราฟ Trend 30 วัน (ออเดอร์แต่ละช่องทาง)
- [x] Monthly Summary: Blended GP (กำไรเฉลี่ยรวมทุกออเดอร์)
- [x] Monthly Summary: เปรียบเทียบกำไรรวม ปกติ vs ไทยช่วยไทยพลัส
- [x] Monthly Summary: ยอดขายรวม + ต้นทุนรวมแต่ละช่องทาง
- [x] Monthly Summary: คำนวณออเดอร์ไทยช่วยไทยพลัสที่ต้องได้เพื่อชดเชยออเดอร์ปกติ

## แก้สูตรคำนวณ GP ให้ถูกต้องตาม Wongnai/LINE MAN

- [x] GPCalculator: เปลี่ยน input จาก GP% เป็น Commission% (ที่ LINE MAN หัก)
- [x] GPCalculator: คำนวณ GP% สุทธิอัตโนมัติ = (1 - commission% × 1.07) × 100
- [x] GPCalculator: คำนวณกำไรต่อออเดอร์ = ราคาขาย × (1 - commission% × 1.07)
- [x] GPCalculator: แสดง GP% สุทธิที่คำนวณได้ให้ผู้ใช้เห็น (read-only)
- [x] อัปเดต GPSettings type: เปลี่ยน normalGpPercent/plusGpPercent เป็น normalCommission/plusCommission
- [x] อัปเดต database schema: RENAME normalGpPercent→normalCommission, plusGpPercent→plusCommission
- [x] อัปเดต tests ให้ครอบคลุมสูตรใหม่ (29 tests passing)

## ปรับ GPCalculator ตาม Excel Logic (v3)

- [ ] GPCalculator: เปลี่ยน input เป็น GP% แพลตฟอร์ม, VAT บน GP%, ต้นทุนรวม/ออเดอร์
- [ ] GPCalculator: คำนวณ "รายรับสุทธิหลัง GP" = ราคาขาย × (1 - GP% × (1 + VAT%))
- [ ] GPCalculator: คำนวณ "กำไรหลัง GP" = รายรับสุทธิหลัง GP - ต้นทุนรวม
- [ ] GPCalculator: แสดง Margin หลัง GP = กำไรหลัง GP / ราคาขาย × 100
- [ ] GPCalculator: แยก 2 ช่อง — ปกติ (GP 30%) และ ไทยช่วยไทยพลัส (GP ต่ำกว่า)
- [ ] อัปเดต GPSettings type และ DB schema ให้ตรงกับ fields ใหม่
- [ ] อัปเดต tests ให้ครอบคลุมสูตรใหม่

## ปรับ GP Formula (v4) + Banner ไทยช่วยไทยพลัส

- [x] อัปโหลด logo ไทยช่วยไทยพลัส ไปยัง webdev static assets
- [x] แก้สูตร GP ใน shared/gpCalculations.ts (calcGPOrder สูตรถูกต้อง)
- [x] ปรับ GPCalculator UI: input = GP%, VAT%, ต้นทุนรวม/ออเดอร์, ราคาขาย
- [x] แสดงผลลัพธ์: ค่า GP, VAT บน GP, รายรับสุทธิ, กำไรต่อออเดอร์, Margin%
- [x] เพิ่ม Banner/CTA สมัครไทยช่วยไทยพลัส พร้อม logo และลิงก์ https://bit.ly/4gbvUY3
- [x] อัปเดต DB schema: RENAME normalCommission→normalGpPercent, เพิ่ม normalVatOnGp, normalTotalCost, plusVatOnGp, plusTotalCost
- [x] อัปเดต tests: 32 tests passing
