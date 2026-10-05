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
  stock: number | null;
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
