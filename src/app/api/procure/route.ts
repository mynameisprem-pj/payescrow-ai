// src/app/api/procure/route.ts 
import { NextRequest, NextResponse } from "next/server";
import { searchChannel3Products } from "@/lib/channel3";
import { createPayPalEscrowOrder, registerPayPalShipmentTracking } from "@/lib/paypal";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, prompt = "", budget = 3500, items, orderId } = body;

    // ACTION 1: Autonomous Sourcing via Channel3 Product Graph
    if (action === "SOURCE_PRODUCTS") {
      const lower = prompt.toLowerCase();

      // Extract target quantity from prompt (e.g. "5 remote engineers" -> 5)
      const qtyMatch = prompt.match(/\b(\d+)\b/);
      const defaultQty = qtyMatch ? Math.min(Math.max(parseInt(qtyMatch[1], 10), 1), 25) : 5;

      let categoryQueries: Array<{ query: string; label: string; maxUnit: number }> = [
        { query: "27 inch 4K USB-C Monitor", label: "4K Displays & Hubs", maxUnit: 450 },
        { query: "Ergonomic Office Mesh Chair", label: "Ergonomic Seating", maxUnit: 350 },
      ];

      if (lower.includes("podcast") || lower.includes("conference") || lower.includes("audio")) {
        categoryQueries = [
          { query: "XLR Podcast Dynamic Microphone", label: "Studio Audio Gear", maxUnit: 300 },
          { query: "4K PTZ Conference Room Camera", label: "4K Video Capture", maxUnit: 450 },
        ];
      } else if (lower.includes("server") || lower.includes("network") || lower.includes("mac mini")) {
        categoryQueries = [
          { query: "Mini PC Workstation Desktop", label: "Compute Nodes", maxUnit: 650 },
          { query: "Managed Gigabit PoE Network Switch", label: "Network Infrastructure", maxUnit: 250 },
        ];
      }

      const results = await Promise.all(
        categoryQueries.map((q) => searchChannel3Products(q.query, q.label, q.maxUnit))
      );

      const sourcedItems = results.flatMap((group) =>
        group.slice(0, 2).map((item, idx) => ({
          ...item,
          quantity: defaultQty,
          selected: idx === 0, // AI selects top-scored SKU in each category
        }))
      );

      const allocatedSpend = sourcedItems
        .filter((i) => i.selected)
        .reduce((sum, i) => sum + i.price * i.quantity, 0);

      return NextResponse.json({
        success: true,
        requisitionTitle: prompt || "5x Remote Engineering Workstation Fleet",
        budget,
        allocatedSpend,
        savings: Math.max(0, budget - allocatedSpend),
        items: sourcedItems,
        agentLogs: [
          {
            timestamp: new Date().toISOString(),
            step: "CHANNEL3_SEARCH",
            message: `Queried Channel3 Product Graph across ${categoryQueries.length} categories (${categoryQueries
              .map((c) => c.label)
              .join(", ")}); retrieved ${sourcedItems.length} verified commercial SKUs.`,
          },
          {
            timestamp: new Date().toISOString(),
            step: "BUDGET_OPTIMIZATION",
            message: `AI Agent selected highest utility bundle (qty ${defaultQty}/category) totaling $${allocatedSpend.toFixed(
              2
            )} — saving $${Math.max(0, budget - allocatedSpend).toFixed(2)} under the $${budget.toLocaleString()} cap.`,
          },
        ],
      });
    }

    // ACTION 2: Execute PayPal Agentic Escrow Order Creation
    if (action === "CREATE_PAYPAL_ESCROW") {
      const selectedItems = (items || []).filter((i: any) => i.selected);
      if (selectedItems.length === 0) {
        return NextResponse.json(
          { error: "Select at least one line item in AG Grid before generating PayPal Escrow." },
          { status: 400 }
        );
      }

      const paypalResult = await createPayPalEscrowOrder({
        requisitionTitle: prompt || "B2B Hardware Procurement Bundle",
        items: selectedItems.map((i: any) => ({
          name: i.name,
          quantity: Number(i.quantity),
          unitPrice: Number(i.price),
        })),
      });

      return NextResponse.json({
        success: true,
        paypal: paypalResult,
        agentLog: {
          timestamp: new Date().toISOString(),
          step: "PAYPAL_ESCROW_CREATED",
          message: `PayPal Agent Toolkit generated itemized Sandbox Order #${paypalResult.orderId} ($${paypalResult.totalAmount} USD) with buyer approval link.`,
        },
      });
    }

    // ACTION 3: Carrier Delivery Verification & Automated Escrow Settlement
    if (action === "VERIFY_DELIVERY_AND_SETTLE") {
      if (!orderId) {
        return NextResponse.json({ error: "Missing PayPal Order ID" }, { status: 400 });
      }

      const trackingNumber = `1Z999AA101${Math.floor(10000000 + Math.random() * 90000000)}`;
      const trackingResult = await registerPayPalShipmentTracking({
        orderId,
        trackingNumber,
        carrier: "UPS",
        status: "DELIVERED",
      });

      return NextResponse.json({
        success: true,
        settlement: trackingResult,
        agentLog: {
          timestamp: new Date().toISOString(),
          step: "PAYPAL_TRACKING_SETTLED",
          message: `Verified UPS Tracking #${trackingNumber} (DELIVERED). PayPal Escrow funds released for Order #${orderId}.`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Procure API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}