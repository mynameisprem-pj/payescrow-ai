-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Requisitions Table (Stores high-level procurement requests & escrow state)
create table public.requisitions (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  prompt text not null,
  recipient_email text not null default 'buyer-demo@procureflow.ai',
  total_budget numeric(12,2) not null,
  allocated_spend numeric(12,2) default 0.00,
  status text not null default 'SOURCING' check (status in ('SOURCING', 'READY_FOR_APPROVAL', 'INVOICED', 'ESCROW_FUNDED', 'SHIPPED', 'DELIVERED_SETTLED', 'DISPUTED')),
  paypal_invoice_id text,
  paypal_order_id text,
  paypal_checkout_url text,
  tracking_number text,
  carrier text default 'UPS',
  created_at timestamptz default now()
);

-- 2. Procurement Items Table (Populates the AG Grid evaluation matrix)
create table public.procurement_items (
  id uuid primary key default uuid_generate_v4(),
  requisition_id uuid references public.requisitions(id) on delete cascade,
  channel3_product_id text not null,
  category text not null,
  product_name text not null,
  merchant_name text not null,
  unit_price numeric(10,2) not null,
  quantity integer not null default 1,
  ai_score integer not null default 92,
  ai_reasoning text,
  image_url text,
  product_url text,
  selected boolean default true,
  created_at timestamptz default now()
);

-- 3. Audit Log Table (Tracks autonomous agent actions & PayPal tool calls)
create table public.agent_logs (
  id uuid primary key default uuid_generate_v4(),
  requisition_id uuid references public.requisitions(id) on delete cascade,
  step_type text not null, -- 'CHANNEL3_SEARCH' | 'BUDGET_OPTIMIZATION' | 'PAYPAL_INVOICE' | 'PAYPAL_ORDER' | 'PAYPAL_TRACKING'
  summary text not null,
  raw_payload jsonb,
  created_at timestamptz default now()
);

-- Enable public read/write for smooth Judge Demo experience
alter table public.requisitions enable row level security;
alter table public.procurement_items enable row level security;
alter table public.agent_logs enable row level security;

create policy "Allow public demo access on requisitions" on public.requisitions for all using (true) with check (true);
create policy "Allow public demo access on procurement_items" on public.procurement_items for all using (true) with check (true);
create policy "Allow public demo access on agent_logs" on public.agent_logs for all using (true) with check (true);