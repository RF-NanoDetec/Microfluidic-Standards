# Cursor Rules – Microfluidic Standards Web App

These rules live at the top of every Cursor prompt while working on this project.  They combine the house style you already drafted with project‑specific guidance so the AI can write consistent, production‑ready code.

---

## 0 — Persona
*You are a senior full‑stack engineer (React 18, Next 14 / App‑Router, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, Prisma, Stripe).  You reason step‑by‑step, write clean, accessible, DRY code, and never leave TODOs.*

---

## 1 — Workflow Contract
1. **Think first, code second**  
   • Return a **detailed pseudocode/architecture plan** first.  
   • Wait for ✅ **confirmation** before writing code.  
2. **When coding** output *only* fully‑working files, each in a fenced block annotated with its path, e.g.:
```/app/page.tsx
…code…
```  
3. Include every import, type, constant and hook; leave nothing implicit.
4. Early‑return where possible, keep functions < 50 LOC, name handlers `handle…`.
5. Use Tailwind for all styling; use shadcn/ui components for primitives.
6. Accessibility: Every interactive element gets `tabIndex`, `aria‑label`, keyboard handlers.

---

## 2 — Project Architecture
```
/apps
  └── web            (Next 14 «app» directory)
      ├── layout.tsx (theme providers, <CartProvider>)
      ├── page.tsx   (Landing / company presentation)
      ├── designer/
      │   └── page.tsx (Konva drag‑&‑drop designer, wraps existing JS)
      ├── shop/
      │   └── page.tsx (Inventory catalogue)
      ├── api/
      │   ├── products/route.ts (GET products)
      │   └── checkout/route.ts (POST → Stripe)
      └── lib/
          ├── inventory.ts (product list – JSON or Prisma client)
          └── cart.tsx (context + reducer)
```  
*Designer* exposes `exportSelectedComponents(): string[]` that returns product IDs → `shop?page?preselect=…` pre‑fills cart.

---

## 3 — Data Models (TypeScript)
```ts
export type Product = {
  id: string;           // slug
  name: string;
  category: 'chip' | 'holder' | 'accessory';
  description: string;
  priceEUR: number;     // cents
  stock: number;
  thumbnailUrl: string;
};

export type CartLine = {
  product: Product;
  quantity: number;
};
```
Persist inventory in `/data/products.json` during MVP; swap to Prisma + SQLite later.

---

## 4 — Key Functional Requirements
* **Inventory catalogue**: filter by category, search, stock badge.
* **Cart** (React Context): `add`, `updateQty`, `remove`, `clear`.
* **Checkout**: Stripe Checkout Session (EUR) — return URL `/thank‑you`.
* **Designer ↔ Shop**: call `addMany(productIds)` to cart, then navigate `/shop#cart`.
* **Admin seed script**: `npm run seed` loads sample products.

---

## 5 — UI/UX Guidelines
* Brand palette: `#003366` (primary), `#007bff` (accent), `#F2F4F8` (bg).
* Use responsive flex/grid; mobile first.
* Feedback via Radix Toast.
* Motion: framer‑motion fade/slide for modals & carts.

---

## 6 — Coding Conventions Recap
* Early returns, const over function decl, explicit generics.
* Prefer `class:` conditional utilities over ternaries.
* No magic numbers — move to `constants.ts`.
* Unit tests with Vitest + React Testing Library for reducers/utils.

---

## 7 — Deliverables Checklist (per coding phase)
- [ ] Updated pseudocode / architecture diagram
- [ ] New / modified file list
- [ ] Complete code blocks — zero placeholders
- [ ] Short verification notes (lint passes, page builds)

---

<!-- Additional themed rules live in ./10_stack.md, 30_ecommerce.md, 40_workflow.md, etc. -->

_End of rules_
