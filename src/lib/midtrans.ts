// Midtrans Snap payment integration
// Docs: https://docs.midtrans.com/reference/snap-api

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? "";
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";
const SNAP_URL = IS_PRODUCTION
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";

interface SnapItem {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

interface SnapCustomerDetails {
  first_name: string;
  email: string;
  phone: string;
}

export interface SnapTransactionResponse {
  token: string;
  redirect_url: string;
}

export async function createSnapTransaction(params: {
  orderId: string;
  orderNumber: string;
  grossAmount: number;
  items: SnapItem[];
  customer: SnapCustomerDetails;
}): Promise<SnapTransactionResponse | null> {
  if (!MIDTRANS_SERVER_KEY || MIDTRANS_SERVER_KEY.includes("placeholder")) {
    console.log("[Midtrans] Mock snap transaction for:", params.orderNumber);
    return {
      token: "mock-token",
      redirect_url: `https://app.sandbox.midtrans.com/snap/v2/vtweb/mock-${params.orderId}`,
    };
  }

  const auth = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64");

  const body = {
    transaction_details: {
      order_id: params.orderNumber,
      gross_amount: Math.round(params.grossAmount),
    },
    item_details: params.items.map((item) => ({
      id: item.id,
      price: Math.round(item.price),
      quantity: item.quantity,
      name: item.name.substring(0, 50),
    })),
    customer_details: params.customer,
  };

  try {
    const res = await fetch(SNAP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Midtrans] API error:", err);
      return null;
    }

    return await res.json() as SnapTransactionResponse;
  } catch (error) {
    console.error("[Midtrans] Request failed:", error);
    return null;
  }
}

export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  // SHA512(order_id + status_code + gross_amount + ServerKey)
  const crypto = require("crypto") as typeof import("crypto");
  const hash = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${MIDTRANS_SERVER_KEY}`)
    .digest("hex");
  return hash === signatureKey;
}
