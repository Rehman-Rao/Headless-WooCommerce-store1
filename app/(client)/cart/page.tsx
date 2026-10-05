"use client";

import Container from "@/components/Container";
import EmptyCart from "@/components/EmptyCart";
import PriceFormatter from "@/components/PriceFormatter";
import ProductSideMenu from "@/components/ProductSideMenu";
import QuantityButtons from "@/components/QuantityButtons";
import Title from "@/components/Title";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import useStore from "@/store";
import { imageUrl } from "@/lib/wordpress";
import { ShoppingBag, Trash } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";

interface BillingDetails {
  first_name: string;
  last_name: string;
  email: string;
  address_1: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

const initialBilling: BillingDetails = {
  first_name: "",
  last_name: "",
  email: "",
  address_1: "",
  city: "",
  state: "",
  postcode: "",
  country: "",
};

const CartPage = () => {
  const {
    deleteCartProduct,
    getTotalPrice,
    getItemCount,
    getSubTotalPrice,
    resetCart,
  } = useStore();
  const groupedItems = useStore((state) => state.getGroupedItems());
  const [loading, setLoading] = useState(false);
  const [billing, setBilling] = useState(initialBilling);

  const handleCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!groupedItems.length) return;

    setLoading(true);
    try {
      const response = await fetch("/api/woocommerce/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: groupedItems.map(({ product, quantity }) => ({
            productId: product.id,
            quantity,
          })),
          billing,
        }),
      });
      const result = (await response.json()) as {
        paymentUrl?: string;
        error?: string;
      };
      if (!response.ok || !result.paymentUrl) {
        throw new Error(result.error ?? "Could not start WooCommerce checkout.");
      }
      window.location.assign(result.paymentUrl);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not start checkout.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetCart = () => {
    if (window.confirm("Are you sure you want to reset your cart?")) {
      resetCart();
      toast.success("Cart reset successfully!");
    }
  };

  return (
    <div className="bg-gray-50 pb-10">
      <Container>
        {groupedItems.length ? (
          <>
            <div className="flex items-center gap-2 py-5">
              <ShoppingBag className="text-darkColor" />
              <Title>Shopping Cart</Title>
            </div>
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="rounded-lg border bg-white lg:col-span-2">
                {groupedItems.map(({ product }) => {
                  const itemCount = getItemCount(product._id);
                  return (
                    <div
                      key={product._id}
                      className="flex items-center justify-between gap-5 border-b p-2.5 last:border-b-0"
                    >
                      <div className="flex h-36 flex-1 items-start gap-2 md:h-44">
                        {product.images[0] && (
                          <Link
                            href={`/product/${product.slug.current}`}
                            className="group mr-2 overflow-hidden rounded-md border p-0.5 md:p-1"
                          >
                            <Image
                              src={imageUrl(product.images[0])}
                              alt={product.name}
                              width={160}
                              height={160}
                              unoptimized
                              className="h-32 w-32 object-cover hover:scale-105 md:h-40 md:w-40"
                            />
                          </Link>
                        )}
                        <div className="flex h-full flex-1 flex-col justify-between py-1">
                          <div>
                            <h2 className="line-clamp-1 text-base font-semibold">
                              {product.name}
                            </h2>
                            <p className="text-sm">
                              Category:{" "}
                              <span className="font-semibold">
                                {product.categories.join(", ") || "Product"}
                              </span>
                            </p>
                            <p className="text-sm">
                              Status:{" "}
                              <span className="font-semibold">
                                {product.status}
                              </span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <ProductSideMenu product={product} className="relative top-0 right-0" />
                            <button
                              type="button"
                              aria-label={`Remove ${product.name} from cart`}
                              onClick={() => {
                                deleteCartProduct(product._id);
                                toast.success("Product deleted successfully!");
                              }}
                              className="mr-1 text-gray-500 hover:text-red-600"
                            >
                              <Trash className="h-4 w-4 md:h-5 md:w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <PriceFormatter
                          amount={product.price * itemCount}
                          className="text-lg font-bold"
                        />
                        <QuantityButtons product={product} />
                      </div>
                    </div>
                  );
                })}
                <Button
                  type="button"
                  onClick={handleResetCart}
                  className="m-5 font-semibold"
                  variant="destructive"
                >
                  Reset Cart
                </Button>
              </div>

              <form id="checkout-form" onSubmit={handleCheckout}>
                <div className="rounded-lg border bg-white p-6">
                  <h2 className="mb-4 text-xl font-semibold">Order Summary</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <PriceFormatter amount={getSubTotalPrice()} />
                    </div>
                    <div className="flex justify-between">
                      <span>Discount</span>
                      <PriceFormatter
                        amount={getSubTotalPrice() - getTotalPrice()}
                      />
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <PriceFormatter amount={getTotalPrice()} />
                    </div>
                  </div>
                  <h3 className="mb-3 mt-6 font-semibold">Billing details</h3>
                  <div className="grid gap-3">
                    {(
                      [
                        ["first_name", "First name"],
                        ["last_name", "Last name"],
                        ["email", "Email"],
                        ["address_1", "Street address"],
                        ["city", "City"],
                        ["state", "State / province"],
                        ["postcode", "Postal code"],
                        ["country", "Country code (e.g. US)"],
                      ] as const
                    ).map(([name, label]) => (
                      <label key={name} className="grid gap-1 text-sm">
                        <span>{label}</span>
                        <input
                          required
                          type={name === "email" ? "email" : "text"}
                          autoComplete={name}
                          value={billing[name]}
                          onChange={(event) =>
                            setBilling((current) => ({
                              ...current,
                              [name]: event.target.value,
                            }))
                          }
                          className="rounded-md border px-3 py-2"
                        />
                      </label>
                    ))}
                  </div>
                  <Button
                    type="submit"
                    className="mt-5 w-full rounded-full font-semibold tracking-wide"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? "Please wait..." : "Proceed to Checkout"}
                  </Button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <EmptyCart />
        )}
      </Container>
    </div>
  );
};

export default CartPage;
