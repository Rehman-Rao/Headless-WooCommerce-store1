export interface ImageResource {
  src: string;
  alt: string;
}

export interface ProductCategory {
  _id: string;
  id: number;
  title: string;
  name: string;
  slug: { current: string };
  image?: string;
  productCount: number;
}

export interface ProductBrand {
  _id: string;
  id: number;
  title: string;
  slug: { current: string };
  image?: string;
}

export interface Product {
  _id: string;
  id: number;
  name: string;
  description: string;
  shortDescription: string;
  slug: { current: string };
  images: string[];
  price: number;
  regularPrice: number;
  salePrice: number | null;
  discount: number;
  stock: number;
  variant: string;
  status: string;
  categories: string[];
  categorySlugs: string[];
  brands: string[];
  brandSlugs: string[];
}

export interface Blog {
  _id: string;
  id: number;
  title: string;
  slug: { current: string };
  mainImage?: string;
  publishedAt: string;
  blogcategories: Array<{ title: string }>;
  author: { name: string };
  content: string;
}

export interface WooOrder {
  id: number;
  number: string;
  status: string;
  date_created: string;
  total: string;
  currency: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
  };
  line_items: Array<{
    id: number;
    name: string;
    quantity: number;
    total: string;
    image?: { src: string };
  }>;
  payment_url?: string;
}
