export type Category = {
  id: string;
  name: string;
  slug: string;
  isFeatured: boolean;
  createdAt: string;
};

export type SiteSettings = {
  id: string;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroImageUrl: string | null;
  heroAdditionalImageUrls?: string[] | null;
  heroPrimaryLabel: string | null;
  heroPrimaryHref: string | null;
  heroSecondaryLabel: string | null;
  heroSecondaryHref: string | null;
  heroBannerText: string | null;
  aboutLabel?: string | null;
  aboutEnabled?: boolean | null;
  aboutTitle?: string | null;
  aboutBody?: string | null;
  aboutImage1Url?: string | null;
  aboutImage2Url?: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddressLine1: string | null;
  contactAddressLine2: string | null;
  contactCity: string | null;
  contactCountry: string | null;
  contactInstagramUrl?: string | null;
  contactFacebookUrl?: string | null;
  contactTiktokUrl?: string | null;
  shippingFlatFeeCents?: number | null;
  themeKey?: string | null;
  createdAt: string;
};

export type ProductSizeStock = {
  size: string;
  stock: number;
};

export type ProductColorStock = {
  color: string;
  hex?: string | null;
  stock: number;
  imageUrl?: string | null;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  description: string | null;
  longDescription?: string | null;
  sizeChart?: string | null;
  price: number;
  originalPrice?: number | null;
  salePrice?: number | null;
  images: string[];
  sizes: string[];
  sizeStock?: ProductSizeStock[] | null;
  colors?: string[];
  colorStock?: ProductColorStock[] | null;
  stock: number;
  categoryId: string | null;
  category?: Category | null;
  isFeatured: boolean;
  isNewArrival?: boolean;
  isArchived?: boolean;
  createdAt: string;
};

export type OrderStatus = "pending" | "processing" | "paid" | "shipped" | "delivered" | "cancelled";

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  size?: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type ShippingAddress = {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  country: string;
};

export type Order = {
  id: string;
  userId: string | null;
  email: string;
  total: number;
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  stripePaymentIntentId?: string | null;
};

export type UserRole = "customer" | "admin";

export type UserProfile = {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
   phone?: string | null;
  role: UserRole;
  createdAt: string;
};
