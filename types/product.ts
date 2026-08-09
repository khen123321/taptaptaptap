export type ProductType = "ready-made" | "custom";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  pricePhp: number;
  priceLabel?: string;
  image: string;
  category: string;
  type: ProductType;
};
