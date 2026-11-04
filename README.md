# 🛡️ PayEscrow AI
**Autonomous B2B Micro-Procurement, Budget Guardrail & Carrier-Verified PayPal Escrow Engine**

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![PayPal Agent Toolkit](https://img.shields.io/badge/PayPal-Agent%20Toolkit%20%2B%20Orders%20v2-00457C?logo=paypal)](https://developer.paypal.com)
[![AG Grid v33](https://img.shields.io/badge/UI-AG%20Grid%20v33%20Enterprise%20Matrix-blue)](https://www.ag-grid.com/)
[![Channel3 Product Graph](https://img.shields.io/badge/Sourcing-Channel3%20API-indigo)](https://trychannel3.com)
[![APIMatic Validated](https://img.shields.io/badge/Schema-APIMatic%20Context%20Guard-amber)](https://www.apimatic.io/)

---

## 🎯 1. Problem Statement & Industry Friction

Small-to-medium enterprises (SMEs), hardware startups, and distributed engineering teams lose hundreds of hours every quarter to **fragmented micro-procurement** ($500 – $10,000 requisitions):
1. **Manual Multi-Vendor Sourcing:** Operations teams manually compare unit prices, power-delivery specs, and warranties across dozens of consumer and B2B tabs.
2. **Spreadsheet-to-Invoice Drift:** Approved spreadsheet quantities rarely sync cleanly with payment links, causing budget overruns and manual CFO approvals.
3. **Upfront Payment Risk:** Buyers paying B2B invoices upfront bear fulfillment risk, while suppliers struggle with delayed net-30 settlements.

**PayEscrow AI** eliminates all three bottlenecks by combining **autonomous product discovery (Channel3)**, **real-time spreadsheet-grade financial controls (AG Grid)**, **strict API schema validation (APIMatic)**, and **programmable milestone escrow + carrier tracking verification (PayPal Agent Toolkit & Sandbox APIs)**.

---

## 🏗️ 2. System Architecture & Autonomous Workflow

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
| 3. SCHEMA GUARDRAIL & ESCROW EXECUTION (APIMatic + PayPal Agent Toolkit)          |
|  • Validates ISO-4217 currency & itemized breakdown via APIMatic Zod specification|
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

## 🛠️ 3. Local Development & Reproduction Steps

### Prerequisites
* Node.js `v18.18+` or `v20+`
* PayPal Developer Sandbox Credentials (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`)
* Channel3 API Key (`CHANNEL3_API_KEY`)
* Optional: Supabase Project (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### Installation

```bash
# 1. Clone the repository
git clone [https://github.com/mynameisprem-pj/payescrow-ai.git](https://github.com/mynameisprem-pj/payescrow-ai.git)
cd payescrow-ai

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
```

Populate `.env.local` with your credentials:

```env
PAYPAL_CLIENT_ID="your_paypal_sandbox_client_id"
PAYPAL_CLIENT_SECRET="your_paypal_sandbox_client_secret"
PAYPAL_ENVIRONMENT="sandbox"
CHANNEL3_API_KEY="your_trychannel3_api_key"
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
```

### Database Setup & Run

If using Supabase cloud persistence, execute the SQL migration in `supabase/migrations/001_initial_schema.sql` inside your Supabase SQL Editor. Then launch the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for full details.