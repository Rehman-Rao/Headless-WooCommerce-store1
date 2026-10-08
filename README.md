# Shopcart headless WooCommerce storefront

This Next.js storefront reads products and product categories from the public
WooCommerce Store API and WordPress posts from the WordPress REST API. WooCommerce
is the system of record for product data, stock, orders, and payment processing.

## Configure WordPress and WooCommerce

1. Install WordPress and WooCommerce on a public HTTPS host.
2. Configure the WooCommerce payment gateway(s), shipping, taxes, currency, and
   the customer account page (`/my-account/`) in WordPress.
3. In **WooCommerce → Settings → Advanced → REST API**, create a key with
   **Read/Write** access. Restrict and rotate this key as you would any server
   credential.
4. Copy `.env.example` to `.env.local`, set the WordPress site URL, the REST API
   key and secret, and the configured payment gateway ID (for example, the
   gateway's WooCommerce `payment_method` slug).
5. Start the frontend with `npm run dev`.

The WooCommerce REST key and secret are read only by the Next.js order endpoint;
never prefix them with `NEXT_PUBLIC_` or expose them in browser code. The catalog
uses public Store API endpoints and does not require an API key. WordPress posts
published through `/wp-json/wp/v2/posts` power the blog.

The current checkout creates a pending WooCommerce order using product IDs and
quantities, then redirects to WooCommerce's payment URL. WooCommerce recalculates
the order totals and applies configured tax, shipping, stock, and payment rules.
Customer sign-in and order history are managed by the WordPress `/my-account/`
page; wishlist and cart state remain local to the browser.

## Troubleshooting API 403 responses

The public catalog and blog endpoints must return JSON to server-side requests.
If the response is HTML with a browser-verification page, the WordPress host's
CDN/WAF is challenging the Next.js server instead of allowing API traffic. In
the hosting/CDN security settings, allow requests to
`/wp-json/wc/store/v1/*` and `/wp-json/wp/v2/*`, or disable browser verification
for these API paths. Do not try to solve this by putting WooCommerce credentials
in browser code. Confirm the endpoints return JSON before retrying the app:

- `https://your-store.com/wp-json/wc/store/v1/products?per_page=1`
- `https://your-store.com/wp-json/wp/v2/posts?per_page=1`

## Run and verify

```bash
npm install
npm run dev
```

```bash
npm run build
```
