import { NextRequest, NextResponse } from "next/server";

interface CheckoutAddress {
  first_name: string;
  last_name: string;
  address_1: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email: string;
}

interface CheckoutRequest {
  items: Array<{ productId: number; quantity: number }>;
  billing: CheckoutAddress;
}

export async function POST(request: NextRequest) {
  const wordpressUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL?.replace(/\/+$/, "");
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;
  const paymentMethod = process.env.WOOCOMMERCE_PAYMENT_METHOD;

  if (!wordpressUrl || !consumerKey || !consumerSecret || !paymentMethod) {
    return NextResponse.json(
      {
        error:
          "Configure NEXT_PUBLIC_WORDPRESS_URL, WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET and WOOCOMMERCE_PAYMENT_METHOD.",
      },
      { status: 503 }
    );
  }

  let checkout: CheckoutRequest;
  try {
    checkout = (await request.json()) as CheckoutRequest;
  } catch {
    return NextResponse.json({ error: "Invalid checkout request body." }, { status: 400 });
  }

  const address = checkout?.billing;
  const items = checkout?.items;
  if (
    !Array.isArray(items) ||
    items.length < 1 ||
    items.length > 50 ||
    items.some(
      (item) =>
        !Number.isInteger(item?.productId) ||
        item.productId <= 0 ||
        !Number.isInteger(item?.quantity) ||
        item.quantity < 1 ||
        item.quantity > 100
    ) ||
    !address ||
    !address.first_name?.trim() ||
    !address.last_name?.trim() ||
    !address.address_1?.trim() ||
    !address.city?.trim() ||
    !address.postcode?.trim() ||
    !address.country?.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email ?? "")
  ) {
    return NextResponse.json({ error: "Please provide valid items and billing details." }, { status: 400 });
  }

  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const response = await fetch(`${wordpressUrl}/wp-json/wc/v3/orders`, {
    method: "POST",
    headers: {
      authorization: `Basic ${credentials}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      payment_method: paymentMethod,
      payment_method_title: paymentMethod,
      set_paid: false,
      billing: address,
      shipping: {
        first_name: address.first_name.trim(),
        last_name: address.last_name.trim(),
        address_1: address.address_1.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        postcode: address.postcode.trim(),
        country: address.country.trim(),
      },
      line_items: items.map(({ productId, quantity }) => ({
        product_id: productId,
        quantity,
      })),
    }),
    cache: "no-store",
  });

  const result = (await response.json()) as {
    id?: number;
    number?: string;
    payment_url?: string;
    message?: string;
    data?: { message?: string };
  };

  if (!response.ok) {
    return NextResponse.json(
      { error: result.message ?? result.data?.message ?? "WooCommerce could not create the order." },
      { status: response.status >= 500 ? 502 : response.status }
    );
  }

  if (!result.payment_url || !result.number) {
    return NextResponse.json(
      { error: "WooCommerce created an order without a payment URL; check the configured payment gateway." },
      { status: 502 }
    );
  }

  return NextResponse.json({ orderNumber: result.number, paymentUrl: result.payment_url });
}
