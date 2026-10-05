import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
import { FileX } from "lucide-react";

const OrdersPage = () => {
  const accountUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL
    ? `${process.env.NEXT_PUBLIC_WORDPRESS_URL.replace(/\/+$/, "")}/my-account/`
    : null;

  return (
    <Container className="flex min-h-[400px] flex-col items-center justify-center py-12 text-center">
      <FileX className="mb-4 h-20 w-20 text-gray-400" />
      <h1 className="text-2xl font-semibold text-gray-900">Your WooCommerce account</h1>
      <p className="mt-2 max-w-md text-sm text-gray-600">
        Sign in on the WordPress store to view your orders and manage your customer account.
      </p>
      {accountUrl ? (
        <Button asChild className="mt-6">
          <a href={accountUrl}>Open my account</a>
        </Button>
      ) : (
        <p className="mt-6 text-sm text-red-700">
          Configure NEXT_PUBLIC_WORDPRESS_URL to enable the store account link.
        </p>
      )}
    </Container>
  );
};

export default OrdersPage;
