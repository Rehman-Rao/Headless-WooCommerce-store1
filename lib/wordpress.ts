import type {
  Blog,
  Product,
  ProductBrand,
  ProductCategory,
} from "@/lib/wordpress-types";

type StoreProduct = {
  id: number;
  name: string;
  description?: string;
  short_description?: string;
  slug: string;
  prices?: {
    price: string;
    regular_price: string;
    sale_price: string;
    currency_minor_unit: number;
  };
  is_on_sale?: boolean;
  is_in_stock?: boolean;
  low_stock_remaining?: number | null;
  categories?: Array<{ id: number; name: string; slug: string }>;
  images?: Array<{ src: string; alt?: string }>;
  attributes?: Array<{
    name: string;
    terms?: Array<{ name: string; slug: string }>;
  }>;
};

type StoreCategory = {
  id: number;
  name: string;
  slug: string;
  count?: number;
  image?: { src: string };
};

type WordPressPost = {
  id: number;
  slug: string;
  date: string;
  title: { rendered: string };
  content: { rendered: string };
  _embedded?: {
    author?: Array<{ name?: string }>;
    "wp:featuredmedia"?: Array<{ source_url?: string; alt_text?: string }>;
    "wp:term"?: Array<Array<{ name?: string }>>;
  };
};

const wordpressUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL?.replace(/\/+$/, "");

function apiUrl(path: string, query?: URLSearchParams) {
  if (!wordpressUrl) {
    throw new Error("Missing environment variable: NEXT_PUBLIC_WORDPRESS_URL");
  }
  return `${wordpressUrl}/wp-json/${path}${query?.size ? `?${query}` : ""}`;
}

async function fetchResource<T>(
  path: string,
  query?: URLSearchParams
): Promise<T> {
  const url =
    typeof window === "undefined"
      ? apiUrl(path, query)
      : `/api/wordpress/${path}${query?.toString() ? `?${query}` : ""}`;

  const response = await fetch(url, { cache: "no-store" });
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("application/json")) {
    const detail = await response.text();
    if (
      response.status === 403 &&
      /checking your browser before accessing|hcdn-cgi\/jschallenge/i.test(detail)
    ) {
      throw new Error(
        "The WordPress host's CDN is blocking API access with a browser-verification challenge. Allow server-side requests to /wp-json/wc/store/v1/* and /wp-json/wp/v2/*, or disable browser verification for those REST API paths in the hosting/CDN security settings. Then retry the storefront."
      );
    }
    throw new Error(
      `WordPress API request failed (${response.status}, ${contentType || "unknown content type"}): ${detail.slice(0, 300)}`
    );
  }
  return (await response.json()) as T;
}

function money(value: string | undefined, minorUnit: number | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed / 10 ** (minorUnit ?? 2) : 0;
}

function mapProduct(raw: StoreProduct): Product {
  const minorUnit = raw.prices?.currency_minor_unit ?? 2;
  const price = money(raw.prices?.price, minorUnit);
  const regularPrice = money(raw.prices?.regular_price, minorUnit);
  const salePrice = raw.is_on_sale ? price : null;
  const brands =
    raw.attributes
      ?.filter((attribute) => attribute.name.toLowerCase().includes("brand"))
      .flatMap((attribute) => attribute.terms?.map((term) => term.name) ?? []) ??
    [];

  return {
    _id: String(raw.id),
    id: raw.id,
    name: raw.name,
    description: raw.description ?? "",
    shortDescription: raw.short_description ?? "",
    slug: { current: raw.slug },
    images: raw.images?.map((image) => image.src).filter(Boolean) ?? [],
    price,
    regularPrice,
    salePrice,
    discount:
      regularPrice > 0 && salePrice !== null
        ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
        : 0,
    stock: raw.is_in_stock
      ? (raw.low_stock_remaining ?? null)
      : 0,
    variant:
      raw.attributes?.find((attribute) => !attribute.name.toLowerCase().includes("brand"))
        ?.terms?.[0]?.name ?? "",
    status: salePrice !== null ? "sale" : "regular",
    categories: raw.categories?.map((category) => category.name) ?? [],
    categorySlugs: raw.categories?.map((category) => category.slug) ?? [],
    brands,
    brandSlugs:
      raw.attributes
        ?.filter((attribute) => attribute.name.toLowerCase().includes("brand"))
        .flatMap((attribute) => attribute.terms?.map((term) => term.slug) ?? []) ??
      [],
  };
}

export async function getProducts(): Promise<Product[]> {
  const products: StoreProduct[] = [];
  for (let page = 1; ; page += 1) {
    const query = new URLSearchParams({ per_page: "100", page: String(page) });
    const batch = await fetchResource<StoreProduct[]>("wc/store/v1/products", query);
    products.push(...batch);
    if (batch.length < 100) break;
  }
  return products.map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((product) => product.slug.current === slug) ?? null;
}

export async function getCategories(quantity?: number): Promise<ProductCategory[]> {
  const categories: StoreCategory[] = [];
  for (let page = 1; ; page += 1) {
    const query = new URLSearchParams({ per_page: "100", page: String(page) });
    const batch = await fetchResource<StoreCategory[]>(
      "wc/store/v1/products/categories",
      query
    );
    categories.push(...batch);
    if (batch.length < 100) break;
  }
  const selectedCategories =
    quantity === undefined ? categories : categories.slice(0, quantity);
  return selectedCategories.map((category) => ({
    _id: String(category.id),
    id: category.id,
    title: category.name,
    name: category.name,
    slug: { current: category.slug },
    image: category.image?.src,
    productCount: category.count ?? 0,
  }));
}

export async function getAllBrands(): Promise<ProductBrand[]> {
  const products = await getProducts();
  const brands = new Map<string, ProductBrand>();
  for (const product of products) {
    for (const name of product.brands) {
      const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
      if (!brands.has(slug)) {
        brands.set(slug, {
          _id: slug,
          id: 0,
          title: name,
          slug: { current: slug },
        });
      }
    }
  }
  return [...brands.values()];
}

export async function getBrandForProduct(product: Product) {
  return product.brands[0] ?? "";
}

async function getPosts(quantity = 100): Promise<Blog[]> {
  const query = new URLSearchParams({
    _embed: "1",
    per_page: String(Math.min(quantity, 100)),
    status: "publish",
  });
  const posts = await fetchResource<WordPressPost[]>("wp/v2/posts", query);
  return posts.map((post) => ({
    _id: String(post.id),
    id: post.id,
    title: post.title.rendered.replace(/<[^>]*>/g, ""),
    slug: { current: post.slug },
    mainImage: post._embedded?.["wp:featuredmedia"]?.[0]?.source_url,
    publishedAt: post.date,
    blogcategories:
      post._embedded?.["wp:term"]?.flat().map((term) => ({
        title: term.name ?? "",
      })) ?? [],
    author: { name: post._embedded?.author?.[0]?.name ?? "" },
    content: post.content.rendered,
  }));
}

export async function getLatestBlogs(): Promise<Blog[]> {
  return getPosts(4);
}

export async function getAllBlogs(quantity: number): Promise<Blog[]> {
  return getPosts(quantity);
}

export async function getSingleBlog(slug: string): Promise<Blog | null> {
  const posts = await getPosts(100);
  return posts.find((post) => post.slug.current === slug) ?? null;
}

export async function getOthersBlog(slug: string, quantity: number) {
  return (await getPosts(100))
    .filter((post) => post.slug.current !== slug)
    .slice(0, quantity);
}

export async function getBlogCategories() {
  const posts = await getPosts(100);
  const names = new Set(
    posts.flatMap((post) =>
      post.blogcategories.map((category) => category.title)
    )
  );
  return [...names].map((title) => ({ blogcategories: [{ title }] }));
}

export function imageUrl(image: string | undefined | null) {
  return image ?? "";
}
