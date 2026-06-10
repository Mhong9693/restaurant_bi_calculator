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
