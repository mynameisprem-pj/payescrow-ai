# 🛡️ PayEscrow AI
**Autonomous B2B Micro-Procurement, Budget Guardrail & Carrier-Verified PayPal Escrow Engine**

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![PayPal Agent Toolkit](https://img.shields.io/badge/PayPal-Agent%20Toolkit%20%2B%20Orders%20v2-00457C?logo=paypal)](https://developer.paypal.com)
[![AG Grid v33](https://img.shields.io/badge/UI-AG%20Grid%20v33%20Enterprise%20Matrix-blue)](https://www.ag-grid.com/)
[![Channel3 Product Graph](https://img.shields.io/badge/Sourcing-Channel3%20API-indigo)](https://trychannel3.com)
[![APIMatic Validated](https://img.shields.io/badge/Schema-APIMatic%20Spec%20Guard-amber)](https://www.apimatic.io/)

**PayEscrow AI** is an autonomous B2B procurement and milestone-escrow command center. It transforms natural language hardware requisitions into verified multi-supplier bundles, enforces strict CFO budget guardrails inside an interactive spreadsheet matrix, and executes itemized **PayPal Sandbox Orders** whose funds remain locked until carrier delivery is verified via the **PayPal Shipping Trackers API**.

---

## 🎯 1. Problem Statement

Small-to-medium enterprises (SMEs) and distributed engineering teams lose significant operational time to **fragmented micro-procurement** ($500 – $10,000 requisitions):
* **Manual Multi-Vendor Sourcing:** Operations teams manually compare unit prices, power-delivery specs, and commercial warranties across fragmented suppliers.
* **Spreadsheet-to-Invoice Drift:** Approved spreadsheet quantities rarely stay synchronized with payment checkouts, causing budget overruns and manual reconciliation.
* **Upfront B2B Payment Risk:** Buyers paying invoices upfront absorb fulfillment risk, while suppliers face delayed net-30 settlements.

---

## 🏗️ 2. System Architecture & Autonomous Execution Flow

```text
+-----------------------------------------------------------------------------------+
|                        USER / CFO REQUISITION SPECIFICATION                       |
|    "Outfit 5 remote engineers with 27-inch 4K USB-C monitors & ergonomic chairs   |
|     strictly under a $3,500.00 total policy budget ceiling."                      |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 1. AUTONOMOUS SOURCING ENGINE (Channel3 Product Graph API)                        |
|  • Decomposes natural language prompt into hardware categories & target unit caps |
|  • Queries `[https://api.trychannel3.com/v1/search](https://api.trychannel3.com/v1/search)` for live B2B SKUs & pricing    |
|  • Computes AI Fit Score (0-100) based on unit economics & bundle savings         |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 2. INTERACTIVE B2B EVALUATION MATRIX (AG Grid v33 React Workspace)                |
|  • Inline editable quantities (`agNumberCellEditor`) with instant recalculation   |
|  • Pinned Bottom Summary Row enforcing real-time CFO Budget Guardrail compliance  |
|  • Custom cell renderers for SKU thumbnails, supplier links & one-click CSV audit |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 3. SCHEMA GUARDRAIL & ESCROW EXECUTION (APIMatic Spec + PayPal Agent Toolkit)     |
|  • Validates ISO-4217 currency & itemized breakdown prior to API execution        |
|  • Invokes PayPal Orders v2 (`/v2/checkout/orders`) & `@paypal/agent-toolkit`     |
|  • Generates verifiable PayPal Sandbox Order ID + live Payer Checkout URL         |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 4. CARRIER DELIVERY VERIFICATION & AUTO-SETTLEMENT (PayPal Shipping Trackers v1)  |
|  • Registers UPS/FedEx tracking via `/v1/shipping/trackers-batch`                 |
|  • Upon `DELIVERED` state verification, releases held escrow & logs to Supabase   |
+-----------------------------------------------------------------------------------+
```

---

## ⚙️ 3. Core Technical Integrations & Codebase Map

| Subsystem | Implementation Details | Source Module |
| :--- | :--- | :--- |
| **PayPal Agentic Commerce & Escrow** | Integrates `@paypal/agent-toolkit`, **PayPal Orders v2** (`/v2/checkout/orders`) for itemized B2B checkout generation, and **PayPal Shipping Trackers v1** (`/v1/shipping/trackers-batch`) for carrier-verified escrow release. | [`src/lib/paypal.ts`](./src/lib/paypal.ts)<br>[`src/app/api/procure/route.ts`](./src/app/api/procure/route.ts) |
| **AG Grid v33 Financial Matrix** | Built with `ag-grid-react` (`AllCommunityModule`) featuring inline numeric quantity editing, custom SKU/score cell renderers, pinned bottom CFO summary rows (`pinnedBottomRowData`), quick-filter search, and instant CSV audit export. | [`src/components/ProcurementGrid.tsx`](./src/components/ProcurementGrid.tsx) |
| **Channel3 Product Graph** | Queries the **Channel3 Semantic Search API** (`/v1/search`) to retrieve commercial hardware SKUs, merchant metadata, unit pricing, and product URLs, paired with resilient B2B catalog fallbacks. | [`src/lib/channel3.ts`](./src/lib/channel3.ts) |
| **APIMatic Payload Guardrail** | Enforces strict ISO-4217 currency formatting, SKU character limits, and line-item breakdown validation modeled on **APIMatic's PayPal OpenAPI specification** before dispatching tool calls. | [`src/lib/apimatic.ts`](./src/lib/apimatic.ts) |
| **Supabase Audit Ledger** | Persists requisitions, line items, PayPal Sandbox Order IDs, and UPS tracking numbers in PostgreSQL with automatic local-session fallback. | [`src/lib/supabase.ts`](./src/lib/supabase.ts)<br>[`supabase/migrations/001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql) |

---

## 🔄 4. Interactive Application Workflow

1. **Natural Language Requisition:** Select one of the built-in B2B procurement presets (e.g., *5x Remote Dev Workstations*, *4x Podcast & Studio AV Suite*, or *3x Edge Server & PoE Network Kit*) or enter a custom hardware prompt and USD budget ceiling.
2. **Real-Time Matrix Customization (AG Grid):**
   * Double-click any cell in the **`Qty (Editable)`** column to adjust unit quantities and observe instantaneous recalculation in the **Pinned Bottom Summary Row** and **Net Procurement Savings KPI**.
   * Toggle line items in the **`Include`** column or export a compliance snapshot via **`Export Audit CSV (AG Grid)`**.
3. **PayPal Sandbox Escrow Creation:**
   * Click **`Approve & Create PayPal Escrow Order`** to validate the bundle and generate a live **PayPal Sandbox Order ID** with an itemized checkout approval URL on `sandbox.paypal.com`.
4. **Carrier Delivery Verification & Settlement:**
   * Click **`Simulate UPS Delivery & Release Escrow`** to invoke the PayPal Shipping Trackers endpoint, attach a verified UPS tracking number, and transition the order state to **`DELIVERED & SETTLED`**.

---

## 🛠️ 5. Local Setup & Installation

### Prerequisites
* Node.js `v18.18+` or `v20+`
* PayPal Developer Sandbox Credentials (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`)
* Channel3 API Key (`CHANNEL3_API_KEY`)
* *Optional:* Supabase Project (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) — runs seamlessly in Local Session Mode if omitted.

### Step-by-Step Setup

```bash
# 1. Clone the repository
git clone [https://github.com/mynameisprem-pj/payescrow-ai.git](https://github.com/mynameisprem-pj/payescrow-ai.git)
cd payescrow-ai

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
```

Add your API keys inside `.env.local`:

```env
PAYPAL_CLIENT_ID="your_paypal_sandbox_client_id"
PAYPAL_CLIENT_SECRET="your_paypal_sandbox_client_secret"
PAYPAL_ENVIRONMENT="sandbox"
CHANNEL3_API_KEY="your_trychannel3_api_key"

# Optional: Supabase PostgreSQL persistence
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
```

### Launch Local Server

```bash
npm run dev
```

Open [`http://localhost:3000`](http://localhost:3000) in your browser.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for details.