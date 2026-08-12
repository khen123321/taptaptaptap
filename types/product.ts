export type ProductType = "standard" | "custom";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  pricePhp: number;
  priceLabel?: string;
  buyOnePrice: number;
  buyTwoPrice: number;
  buyTwoSavings: number;
  unitLabel: string;
  bundlePricePhp?: number;
  bundleLabel?: string;
  bundleSavingsLabel?: string;
  includedFeatures: string[];
  ctaLabel: string;
  ctaHref: string;
  cardImage?: string;
  image: string;
  mockupImage?: string;
  category: string;
  type: ProductType;
};
