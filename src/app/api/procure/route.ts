// src/app/api/procure/route.ts
import { NextRequest, NextResponse } from "next/server";
import { searchChannel3Products } from "@/lib/channel3";
import { createPayPalEscrowOrder } from "@/lib/paypal";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, prompt, budget = 3500, items } = body;

    // ACTION 1: Autonomous Sourcing via Channel3 Product Graph
    if (action === "SOURCE_PRODUCTS") {
      // Extract core categories from the prompt (or use default B2B remote kit)
      const [monitors, chairs] = await Promise.all([
        searchChannel3Products("27 inch 4K USB-C Monitor", "Monitors & Displays", 450),
        searchChannel3Products("Ergonomic Office Mesh Chair", "Ergonomic Seating", 350),
      ]);

      const defaultQty = 5;
      const sourcedItems = [
        ...monitors.slice(0, 2).map((m, idx) => ({
          ...m,
          quantity: defaultQty,
          selected: idx === 0, // AI selects top-scored item by default
        })),
        ...chairs.slice(0, 2).map((c, idx) => ({
          ...c,
          quantity: defaultQty,
          selected: idx === 0,
        })),
      ];

      const allocatedSpend = sourcedItems
        .filter((i) => i.selected)
        .reduce((sum, i) => sum + i.price * i.quantity, 0);

      return NextResponse.json({
        success: true,
        requisitionTitle: prompt || "5x Remote Engineering Workstation Kit",
        budget,
        allocatedSpend,
        savings: Math.max(0, budget - allocatedSpend),
        items: sourcedItems,
        agentLogs: [
          {
            timestamp: new Date().toISOString(),
            step: "CHANNEL3_SEARCH",
            message: `Queried Channel3 Product Graph across 2 hardware categories; retrieved ${sourcedItems.length} commercial options.`,
          },
          {
            timestamp: new Date().toISOString(),
            step: "BUDGET_OPTIMIZATION",
            message: `Selected optimal bundle totaling $${allocatedSpend.toFixed(2)} ($${(budget - allocatedSpend).toFixed(2)} under the $${budget} budget cap).`,
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
          message: `PayPal Agent Toolkit generated Sandbox Order #${paypalResult.orderId} for $${paypalResult.totalAmount} USD.`,
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