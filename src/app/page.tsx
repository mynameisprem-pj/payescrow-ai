// src/app/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import ProcurementGrid, { ProcurementRow } from "@/components/ProcurementGrid";
import {
  ShieldCheck,
  Sparkles,
  PackageCheck,
  ExternalLink,
  Truck,
  CheckCircle2,
  Terminal,
  DollarSign,
  Layers,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface AgentLog {
  timestamp: string;
  step: string;
  message: string;
}

const JUDGE_PRESETS = [
  {
    label: "Preset 1: 5x Remote Dev Workstations ($3,500 Cap)",
    prompt: "Outfit 5 remote software engineers with 27-inch 4K USB-C monitors and ergonomic mesh chairs under $3,500.",
    budget: 3500,
  },
  {
    label: "Preset 2: 4x Podcast & Studio AV Suite ($2,800 Cap)",
    prompt: "Source 4 studio podcast microphones and 4K conference room PTZ cameras for media team under $2,800.",
    budget: 2800,
  },
  {
    label: "Preset 3: 3x Edge Server & PoE Network Kit ($2,600 Cap)",
    prompt: "Procure 3 mini workstation compute nodes and managed Gigabit PoE network switches under $2,600.",
    budget: 2600,
  },
];

export default function HomePage() {
  const [prompt, setPrompt] = useState(JUDGE_PRESETS[0].prompt);
  const [budget, setBudget] = useState<number>(JUDGE_PRESETS[0].budget);
  const [items, setItems] = useState<ProcurementRow[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loadingStep, setLoadingStep] = useState<string | null>(null);

  // PayPal Escrow & Settlement Lifecycle State
  const [escrowState, setEscrowState] = useState<
    "IDLE" | "SOURCED" | "ESCROW_CREATED" | "SETTLED"
  >("IDLE");
  const [paypalOrder, setPaypalOrder] = useState<{
    orderId: string;
    status: string;
    approveUrl: string;
    totalAmount: string;
  } | null>(null);
  const [settlement, setSettlement] = useState<{
    trackingNumber: string;
    carrier: string;
    settledAt: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const allocatedSpend = useMemo(
    () =>
      items
        .filter((i) => i.selected)
        .reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0),
    [items]
  );

  // Run autonomous Channel3 sourcing
  const handleSourceProducts = async (customPrompt?: string, customBudget?: number) => {
    setErrorMsg(null);
    setLoadingStep("SOURCING");
    setPaypalOrder(null);
    setSettlement(null);

    const activePrompt = customPrompt ?? prompt;
    const activeBudget = customBudget ?? budget;

    try {
      const res = await fetch("/api/procure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SOURCE_PRODUCTS",
          prompt: activePrompt,
          budget: activeBudget,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to source products");

      setItems(data.items || []);
      setLogs((prev) => [...(data.agentLogs || []), ...prev]);
      setEscrowState("SOURCED");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoadingStep(null);
    }
  };

  // Trigger PayPal Sandbox Order creation via Agent Toolkit
  const handleCreatePayPalEscrow = async () => {
    setErrorMsg(null);
    setLoadingStep("PAYPAL_ORDER");
    try {
      const res = await fetch("/api/procure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_PAYPAL_ESCROW",
          prompt,
          budget,
          items,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "PayPal Order creation failed");

      setPaypalOrder(data.paypal);
      if (data.agentLog) setLogs((prev) => [data.agentLog, ...prev]);
      setEscrowState("ESCROW_CREATED");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoadingStep(null);
    }
  };

  // Trigger Carrier Delivery Verification & Escrow Settlement
  const handleVerifyDelivery = async () => {
    if (!paypalOrder?.orderId) return;
    setErrorMsg(null);
    setLoadingStep("SETTLING");
    try {
      const res = await fetch("/api/procure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VERIFY_DELIVERY_AND_SETTLE",
          orderId: paypalOrder.orderId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Settlement verification failed");

      setSettlement(data.settlement);
      if (data.agentLog) setLogs((prev) => [data.agentLog, ...prev]);
      setEscrowState("SETTLED");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoadingStep(null);
    }
  };

  // Auto-load initial requisition on first render so judges immediately see data in AG Grid
  useEffect(() => {
    handleSourceProducts(JUDGE_PRESETS[0].prompt, JUDGE_PRESETS[0].budget);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Executive Header */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  ProcureFlow AI
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  PayPal Agentic Commerce + Channel3 + AG Grid
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Autonomous B2B Micro-Procurement, Budget Guardrail & Milestone Escrow Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-medium">
              ● PayPal Sandbox Live
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
              Channel3 Graph Connected
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Section 1: Natural Language Requisition + One-Click Judge Presets */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              1. Autonomous B2B Requisition Prompt (Judge Quick-Test Presets)
            </span>
            <div className="flex flex-wrap gap-2">
              {JUDGE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(preset.prompt);
                    setBudget(preset.budget);
                    handleSourceProducts(preset.prompt, preset.budget);
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-blue-600/20 hover:border-blue-500/40 text-slate-200 border border-slate-700 transition"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-8">
              <label className="block text-xs text-slate-400 mb-1">
                Procurement Specification
              </label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="Describe hardware quantities, specs, and budget..."
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">
                Budget Guardrail (USD)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="lg:col-span-2 flex items-end">
              <button
                type="button"
                disabled={loadingStep === "SOURCING"}
                onClick={() => handleSourceProducts()}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20"
              >
                {loadingStep === "SOURCING" ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sourcing...
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    Source via AI
                  </>
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}
        </section>

        {/* Section 2: Real-Time Financial & Escrow KPI Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400">Policy Budget Ceiling</span>
            <p className="text-2xl font-bold text-white mt-1">
              ${budget.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-slate-400">Hard guardrail enforced by AI</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400">Allocated AG Grid Bundle</span>
            <p
              className={`text-2xl font-bold mt-1 ${
                allocatedSpend <= budget ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              ${allocatedSpend.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-slate-400">
              {items.filter((i) => i.selected).length} selected SKUs across suppliers
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400">Net Procurement Savings</span>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              ${Math.max(0, budget - allocatedSpend).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </p>
            <span className="text-[11px] text-slate-400">
              Optimized via Channel3 unit scoring
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400">PayPal Escrow Lifecycle</span>
            <p className="text-lg font-bold text-amber-300 mt-1 flex items-center gap-1.5">
              {escrowState === "IDLE" && "Awaiting Sourcing"}
              {escrowState === "SOURCED" && "Ready for Escrow Order"}
              {escrowState === "ESCROW_CREATED" && "Order Created (In Escrow)"}
              {escrowState === "SETTLED" && "Delivered & Funds Settled"}
            </p>
            <span className="text-[11px] text-slate-400">
              {paypalOrder ? `Order ID: #${paypalOrder.orderId}` : "No active PayPal order yet"}
            </span>
          </div>
        </section>

        {/* Section 3: AG Grid Interactive B2B Evaluation Matrix */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white">
                2. Interactive Multi-Supplier Evaluation Matrix (AG Grid)
              </h2>
              <p className="text-xs text-slate-400">
                Toggle checkboxes or double-click quantities to customize the requisition before triggering the PayPal Agent Toolkit.
              </p>
            </div>
          </div>

          <ProcurementGrid
            items={items}
            budget={budget}
            onItemsChange={(updated) => setItems(updated)}
          />
        </section>

        {/* Section 4: PayPal Agentic Execution + Carrier Escrow Settlement + Live Telemetry */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: PayPal Escrow State Machine */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-blue-400" />
                3. PayPal Agentic Checkout & Delivery Escrow Controller
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Generates a live itemized PayPal Sandbox Order and holds settlement until carrier delivery is verified via PayPal Shipping Trackers API.
              </p>

              {/* Step Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {/* Step A: Generate PayPal Escrow Order */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                      Step A: PayPal Orders v2 API
                    </span>
                    <h3 className="text-sm font-semibold text-white mt-2">
                      Generate Itemized PayPal Sandbox Escrow
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Dispatches selected AG Grid rows ({items.filter((i) => i.selected).length} SKUs, $
                      {allocatedSpend.toFixed(2)}) into a live PayPal Sandbox Order.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={loadingStep === "PAYPAL_ORDER" || allocatedSpend <= 0}
                    onClick={handleCreatePayPalEscrow}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
                  >
                    {loadingStep === "PAYPAL_ORDER" ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Creating PayPal Sandbox Order...
                      </>
                    ) : (
                      <>
                        Approve & Create PayPal Escrow Order
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Step B: Carrier Delivery & Auto-Settlement */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      Step B: PayPal Tracking API
                    </span>
                    <h3 className="text-sm font-semibold text-white mt-2">
                      Verify Carrier Delivery & Settle Funds
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Simulates UPS carrier `DELIVERED` webhook and registers tracking metadata to release escrow funds.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={!paypalOrder || loadingStep === "SETTLING" || escrowState === "SETTLED"}
                    onClick={handleVerifyDelivery}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
                  >
                    {loadingStep === "SETTLING" ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Verifying UPS Tracking...
                      </>
                    ) : escrowState === "SETTLED" ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Escrow Settled & Released
                      </>
                    ) : (
                      <>
                        <Truck className="w-4 h-4" />
                        Simulate UPS Delivery & Release Escrow
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Live PayPal Sandbox Verification Banner */}
            {paypalOrder && (
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs space-y-1">
                  <div className="font-bold text-blue-300 flex items-center gap-2">
                    <span>PayPal Sandbox Order ID: #{paypalOrder.orderId}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      {escrowState === "SETTLED" ? "DELIVERED & SETTLED" : paypalOrder.status}
                    </span>
                  </div>
                  {settlement ? (
                    <p className="text-emerald-300">
                      Carrier: {settlement.carrier} Tracking #{settlement.trackingNumber} — Funds Released at{" "}
                      {new Date(settlement.settledAt).toLocaleTimeString()}
                    </p>
                  ) : (
                    <p className="text-slate-300">
                      Click the Sandbox link to inspect or approve the live itemized order in PayPal.
                    </p>
                  )}
                </div>

                <a
                  href={paypalOrder.approveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition"
                >
                  Open Live PayPal Sandbox Checkout
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Right 5 Cols: Real-Time Agent Telemetry & Tool-Call Audit Log */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-3">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Autonomous Agent Tool-Call Audit Log
            </h2>
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3.5 overflow-y-auto max-h-[260px] space-y-2.5 font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-slate-500">Initializing agent telemetry...</p>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-blue-400">{log.step}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed">{log.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}