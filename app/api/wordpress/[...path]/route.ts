import { NextRequest, NextResponse } from "next/server";

const ALLOWED_RESOURCES = new Set([
  "wc/store/v1/products",
  "wc/store/v1/products/categories",
  "wp/v2/posts",
]);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const resource = path.join("/");
  if (!ALLOWED_RESOURCES.has(resource)) {
    return NextResponse.json({ error: "WordPress resource not allowed" }, { status: 404 });
  }

  const wordpressUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL?.replace(/\/+$/, "");
  if (!wordpressUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_WORDPRESS_URL is not configured" },
      { status: 500 }
    );
  }

  const upstream = new URL(`${wordpressUrl}/wp-json/${resource}`);
  request.nextUrl.searchParams.forEach((value, key) => upstream.searchParams.set(key, value));

  const response = await fetch(upstream, { cache: "no-store" });
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
    },
  });
}
