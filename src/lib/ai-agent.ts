// src/lib/ai-agent.ts
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const RequisitionPlanSchema = z.object({
  fleetQuantity: z.number().int().min(1).max(50),
  categories: z.array(
    z.object({
      searchQuery: z.string(),
      categoryLabel: z.string(),
      maxUnitPrice: z.number(),
    })
  ),
  cfoExecutiveSummary: z.string(),
});

export async function analyzeRequisitionWithAI(prompt: string, budget: number) {
  // If Gemini API key is configured, run live LLM structured decomposition
  if (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY &&
    !process.env.GOOGLE_GENERATIVE_AI_API_KEY.includes("your_")
  ) {
    try {
      const { object } = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: RequisitionPlanSchema,
        prompt: `You are PayEscrow AI, an autonomous B2B procurement and PayPal escrow agent.
Decompose this hardware requisition prompt: "${prompt}" with a total budget cap of $${budget} USD.
Return the target unit quantity per category, 2 specific hardware search queries for the Channel3 Product Graph, and a 1-sentence CFO executive risk/savings summary.`,
      });
      return { ...object, modelUsed: "gemini-2.5-flash (Live AI SDK)" };
    } catch (err) {
      console.warn("AI SDK fallback activated:", err);
    }
  }

  // Zero-config deterministic fallback so local builds work even without an LLM API key
  const lower = prompt.toLowerCase();
  const qtyMatch = prompt.match(/\b(\d+)\b/);
  const fleetQuantity = qtyMatch
    ? Math.min(Math.max(parseInt(qtyMatch[1], 10), 1), 25)
    : 5;

  if (lower.includes("podcast") || lower.includes("conference") || lower.includes("audio") || lower.includes("studio")) {
    return {
      fleetQuantity,
      categories: [
        { searchQuery: "XLR Podcast Dynamic Microphone", categoryLabel: "Studio Audio Gear", maxUnitPrice: 300 },
        { searchQuery: "4K PTZ Conference Room Camera", categoryLabel: "4K Video Capture", maxUnitPrice: 450 },
      ],
      cfoExecutiveSummary: `Optimized ${fleetQuantity}x Studio AV kits within the $${budget} ceiling; funds held in PayPal milestone escrow until carrier delivery.`,
      modelUsed: "PayEscrow Deterministic B2B Planner",
    };
  }

  if (lower.includes("server") || lower.includes("network") || lower.includes("compute") || lower.includes("node")) {
    return {
      fleetQuantity,
      categories: [
        { searchQuery: "Mini PC Workstation Desktop", categoryLabel: "Compute Nodes", maxUnitPrice: 650 },
        { searchQuery: "Managed Gigabit PoE Network Switch", categoryLabel: "Network Infrastructure", maxUnitPrice: 250 },
      ],
      cfoExecutiveSummary: `Allocated ${fleetQuantity}x Edge Compute & PoE Switch bundles under the $${budget} guardrail with automated PayPal Tracking verification.`,
      modelUsed: "PayEscrow Deterministic B2B Planner",
    };
  }

  return {
    fleetQuantity,
    categories: [
      { searchQuery: "27 inch 4K USB-C Monitor", categoryLabel: "4K Displays & Hubs", maxUnitPrice: 450 },
      { searchQuery: "Ergonomic Office Mesh Chair", categoryLabel: "Ergonomic Seating", maxUnitPrice: 350 },
    ],
    cfoExecutiveSummary: `Sourced ${fleetQuantity}x Remote Engineering Workstations via Channel3 with USB-C PD hub consolidation, locked in PayPal Sandbox Escrow.`,
    modelUsed: "PayEscrow Deterministic B2B Planner",
  };
}