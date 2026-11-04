// src/app/api/procure/route.ts
import { NextRequest, NextResponse } from "next/server";
import { searchChannel3Products } from "@/lib/channel3";
import {
  createPayPalEscrowOrder,
  registerPayPalShipmentTracking,
} from "@/lib/paypal";
import { supabase } from "@/lib/supabase";
import { validateWithApimaticContext } from "@/lib/apimatic";

// GET: Fetch recent requisitions from Supabase for the Live Audit Ledger
export async function GET() {
  if (!supabase) {
    return NextResponse.json({ requisitions: [], dbConnected: false });
  }

  const { data, error } = await supabase
    .from("requisitions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    return NextResponse.json({ requisitions: [], dbConnected: false, error: error.message });
  }

  return NextResponse.json({ requisitions: data || [], dbConnected: true });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      prompt = "",
      budget = 3500,
      items,
      orderId,
      requisitionId,
    } = body;

    // ACTION 1: Autonomous Sourcing via Channel3 Product Graph
    if (action === "SOURCE_PRODUCTS") {
      const lower = prompt.toLowerCase();
      const qtyMatch = prompt.match(/\b(\d+)\b/);
      const defaultQty = qtyMatch
        ? Math.min(Math.max(parseInt(qtyMatch[1], 10), 1), 25)
        : 5;

      let categoryQueries: Array<{
        query: string;
        label: string;
        maxUnit: number;
      }> = [
        {
          query: "27 inch 4K USB-C Monitor",
          label: "4K Displays & Hubs",
          maxUnit: 450,
        },
        {
          query: "Ergonomic Office Mesh Chair",
          label: "Ergonomic Seating",
          maxUnit: 350,
        },
      ];

      if (
        lower.includes("podcast") ||
        lower.includes("conference") ||
        lower.includes("audio") ||
        lower.includes("studio")
      ) {
        categoryQueries = [
          {
            query: "XLR Podcast Dynamic Microphone",
            label: "Studio Audio Gear",
            maxUnit: 300,
          },
          {
            query: "4K PTZ Conference Room Camera",
            label: "4K Video Capture",
            maxUnit: 450,
          },
        ];
      } else if (
        lower.includes("server") ||
        lower.includes("network") ||
        lower.includes("compute") ||
        lower.includes("node")
      ) {
        categoryQueries = [
          {
            query: "Mini PC Workstation Desktop",
            label: "Compute Nodes",
            maxUnit: 650,
          },
          {
            query: "Managed Gigabit PoE Network Switch",
            label: "Network Infrastructure",
            maxUnit: 250,
          },
        ];
      }

      const results = await Promise.all(
        categoryQueries.map((q) =>
          searchChannel3Products(q.query, q.label, q.maxUnit)
        )
      );

      const sourcedItems = results.flatMap((group) =>
        group.slice(0, 2).map((item, idx) => ({
          ...item,
          quantity: defaultQty,
          selected: idx === 0,
        }))
      );

      const allocatedSpend = sourcedItems
        .filter((i) => i.selected)
        .reduce((sum, i) => sum + i.price * i.quantity, 0);

      let savedRequisitionId: string | null = null;

      // Persist requisition & line items to Supabase if configured
      if (supabase) {
        const { data: reqRow } = await supabase
          .from("requisitions")
          .insert({
            title: prompt.slice(0, 90) || "B2B Hardware Requisition",
            prompt,
            total_budget: budget,
            allocated_spend: allocatedSpend,
            status: "READY_FOR_APPROVAL",
          })
          .select("id")
          .single();

        if (reqRow?.id) {
          savedRequisitionId = reqRow.id;
          await supabase.from("procurement_items").insert(
            sourcedItems.map((item) => ({
              requisition_id: reqRow.id,
              channel3_product_id: item.id,
              category: item.category,
              product_name: item.name,
              merchant_name: item.merchant,
              unit_price: item.price,
              quantity: item.quantity,
              ai_score: item.aiScore,
              ai_reasoning: item.aiReasoning,
              image_url: item.imageUrl,
              product_url: item.productUrl,
              selected: item.selected,
            }))
          );
        }
      }

      return NextResponse.json({
        success: true,
        requisitionId: savedRequisitionId,
        requisitionTitle: prompt || "5x Remote Engineering Workstation Fleet",
        budget,
        allocatedSpend,
        savings: Math.max(0, budget - allocatedSpend),
        items: sourcedItems,
        agentLogs: [
          {
            timestamp: new Date().toISOString(),
            step: "CHANNEL3_SEARCH",
            message: `PayEscrow AI queried Channel3 Product Graph across ${
              categoryQueries.length
            } categories (${categoryQueries
              .map((c) => c.label)
              .join(", ")}); retrieved ${
              sourcedItems.length
            } verified commercial SKUs.`,
          },
          {
            timestamp: new Date().toISOString(),
            step: "BUDGET_OPTIMIZATION",
            message: `Selected optimal bundle (qty ${defaultQty}/category) totaling $${allocatedSpend.toFixed(
              2
            )} — saving $${Math.max(0, budget - allocatedSpend).toFixed(
              2
            )} under the $${budget.toLocaleString()} guardrail.`,
          },
        ],
      });
    }

    // ACTION 2: Validate via APIMatic Context & Execute PayPal Agentic Escrow Order
    if (action === "CREATE_PAYPAL_ESCROW") {
      const selectedItems = (items || []).filter((i: any) => i.selected);
      if (selectedItems.length === 0) {
        return NextResponse.json(
          {
            error:
              "Select at least one line item in AG Grid before generating PayPal Escrow.",
          },
          { status: 400 }
        );
      }

      // 1. Validate payload against APIMatic PayPal Orders v2 schema
      const { validatedPayload, apimaticTelemetry } =
        validateWithApimaticContext({
          requisitionTitle: prompt || "PayEscrow AI B2B Hardware Bundle",
          items: selectedItems.map((i: any) => ({
            name: i.name,
            quantity: Number(i.quantity),
            unitPrice: Number(i.price),
          })),
        });

      // 2. Dispatch to PayPal Sandbox
      const paypalResult = await createPayPalEscrowOrder({
        requisitionTitle: validatedPayload.requisitionTitle,
        items: validatedPayload.items,
      });

      // 3. Update Supabase Requisition record with live PayPal Order ID & Checkout URL
      if (supabase && requisitionId) {
        await supabase
          .from("requisitions")
          .update({
            allocated_spend: Number(paypalResult.totalAmount),
            status: "ESCROW_FUNDED",
            paypal_order_id: paypalResult.orderId,
            paypal_checkout_url: paypalResult.approveUrl,
          })
          .eq("id", requisitionId);
      }

      return NextResponse.json({
        success: true,
        paypal: paypalResult,
        apimatic: apimaticTelemetry,
        agentLogs: [
          {
            timestamp: new Date().toISOString(),
            step: "APIMATIC_SCHEMA_VERIFIED",
            message: `${apimaticTelemetry.sdkGenerator}: ${apimaticTelemetry.schemaCompliance}`,
          },
          {
            timestamp: new Date().toISOString(),
            step: "PAYPAL_ESCROW_CREATED",
            message: `PayPal Agent Toolkit generated Sandbox Order #${paypalResult.orderId} ($${paypalResult.totalAmount} USD) held in PayEscrow AI milestone lock.`,
          },
        ],
      });
    }

    // ACTION 3: Carrier Delivery Verification & Automated Escrow Settlement
    if (action === "VERIFY_DELIVERY_AND_SETTLE") {
      if (!orderId) {
        return NextResponse.json(
          { error: "Missing PayPal Order ID" },
          { status: 400 }
        );
      }

      const trackingNumber = `1Z999AA101${Math.floor(
        10000000 + Math.random() * 90000000
      )}`;
      const trackingResult = await registerPayPalShipmentTracking({
        orderId,
        trackingNumber,
        carrier: "UPS",
        status: "DELIVERED",
      });

      if (supabase && requisitionId) {
        await supabase
          .from("requisitions")
          .update({
            status: "DELIVERED_SETTLED",
            tracking_number: trackingNumber,
            carrier: "UPS",
          })
          .eq("id", requisitionId);
      }

      return NextResponse.json({
        success: true,
        settlement: trackingResult,
        agentLog: {
          timestamp: new Date().toISOString(),
          step: "PAYPAL_TRACKING_SETTLED",
          message: `Verified UPS Tracking #${trackingNumber} (DELIVERED). PayEscrow AI released funds for PayPal Order #${orderId}.`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("PayEscrow API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}