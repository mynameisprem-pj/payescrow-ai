// src/lib/paypal.ts
import { PayPalAgentToolkit, ALL_TOOLS_ENABLED } from "@paypal/agent-toolkit/ai-sdk";

const PAYPAL_BASE_URL =
  process.env.PAYPAL_ENVIRONMENT === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

/**
 * 1. Official PayPal Agent Toolkit instance for Vercel AI SDK tool-calling
 */
export function getPayPalToolkit() {
  return new PayPalAgentToolkit({
    clientId: process.env.PAYPAL_CLIENT_ID || "",
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
    configuration: {
      actions: ALL_TOOLS_ENABLED,
      context: {
        sandbox: process.env.PAYPAL_ENVIRONMENT !== "live",
      },
    },
  });
}

/**
 * 2. Generate OAuth2 Bearer Token from PayPal Sandbox
 */
export async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET in environment");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`PayPal Auth Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * 3. Create an Itemized PayPal Sandbox Order with Escrow (AUTHORIZE or CAPTURE intent)
 * Returns a verifiable PayPal Order ID + Sandbox Payer Approval Link
 */
export async function createPayPalEscrowOrder(params: {
  requisitionTitle: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
}) {
  const accessToken = await getPayPalAccessToken();

  const itemTotal = params.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const formattedTotal = itemTotal.toFixed(2);

  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        description: `B2B Escrow Requisition: ${params.requisitionTitle}`,
        amount: {
          currency_code: "USD",
          value: formattedTotal,
          breakdown: {
            item_total: {
              currency_code: "USD",
              value: formattedTotal,
            },
          },
        },
        items: params.items.map((item) => ({
          name: item.name.slice(0, 120),
          quantity: String(item.quantity),
          unit_amount: {
            currency_code: "USD",
            value: item.unitPrice.toFixed(2),
          },
          category: "PHYSICAL_GOODS",
        })),
      },
    ],
    application_context: {
      brand_name: "ProcureFlow AI B2B Escrow",
      shipping_preference: "NO_SHIPPING",
      user_action: "PAY_NOW",
      return_url: "https://example.com/procureflow/success",
      cancel_url: "https://example.com/procureflow/cancel",
    },
  };

  const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `procureflow-${Date.now()}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`PayPal Order Creation Failed: ${JSON.stringify(data)}`);
  }

  const approveLink =
    data.links?.find((l: any) => l.rel === "approve" || l.rel === "payer-action")?.href ||
    `https://www.sandbox.paypal.com/checkoutnow?token=${data.id}`;

  return {
    orderId: data.id as string,
    status: data.status as string,
    approveUrl: approveLink,
    totalAmount: formattedTotal,
    rawResponse: data,
  };
}