import type { Product } from "@/types/product";

export const products: Product[] = [
  {
    id: "google-review-sign",
    name: "Google Review NFC Sign",
    slug: "google-review-nfc-table-sign",
    description: "Make leaving a Google review as simple as tapping a phone.",
    pricePhp: 899,
    buyOnePrice: 899,
    buyTwoPrice: 1499,
    buyTwoSavings: 299,
    unitLabel: "1 Sign",
    bundlePricePhp: 1499,
    bundleLabel: "2 Signs",
    bundleSavingsLabel: "Save ₱299",
    includedFeatures: [
      "Free nationwide shipping",
      "Google Review integration",
      "Initial NFC setup & programming",
      "Ready-to-use setup",
      "Business link setup",
      "Setup assistance",
      "No monthly subscription",
    ],
    ctaLabel: "Order Google Review Sign",
    ctaHref: "mailto:taptaptap.official@outlook.com?subject=Order%20Google%20Review%20NFC%20Sign",
    image: "/images/products/google-review-sign.png",
    category: "nfc-signs",
    type: "standard",
  },
  {
    id: "facebook-follow-sign",
    name: "Facebook Follow NFC Sign",
    slug: "facebook-follow-nfc-table-sign",
    description: "Let customers instantly open and follow your Facebook Page with one tap.",
    pricePhp: 899,
    buyOnePrice: 899,
    buyTwoPrice: 1499,
    buyTwoSavings: 299,
    unitLabel: "1 Sign",
    bundlePricePhp: 1499,
    bundleLabel: "2 Signs",
    bundleSavingsLabel: "Save ₱299",
    includedFeatures: [
      "Free nationwide shipping",
      "Facebook Page integration",
      "Initial NFC setup & programming",
      "Ready-to-use setup",
      "Business link setup",
      "Setup assistance",
      "No monthly subscription",
    ],
    ctaLabel: "Order Facebook Sign",
    ctaHref: "mailto:taptaptap.official@outlook.com?subject=Order%20Facebook%20NFC%20Sign",
    image: "/images/products/facebook-follow-sign.png",
    category: "nfc-signs",
    type: "standard",
  },
  {
    id: "custom-nfc-sign",
    name: "Custom Branded NFC Sign",
    slug: "custom-nfc-table-sign",
    description:
      "Create an NFC sign using your business logo, colors, branding, and custom artwork.",
    pricePhp: 1099,
    priceLabel: "Starting at ₱1,099",
    buyOnePrice: 1099,
    buyTwoPrice: 1899,
    buyTwoSavings: 299,
    unitLabel: "1 Sign",
    bundlePricePhp: 1899,
    bundleLabel: "2 Signs",
    bundleSavingsLabel: "Save ₱299",
    includedFeatures: [
      "Free nationwide shipping",
      "Initial NFC setup & programming",
      "Business link integration",
      "Ready-to-use setup",
      "Business logo",
      "Business name",
      "Brand colors",
      "Personalized NFC sign design",
      "QR-code backup",
      "Setup assistance",
      "No monthly subscription",
    ],
    ctaLabel: "Customize Yours",
    ctaHref: "/customize",
    image: "/images/products/mockups/blank-nfc-stand.png",
    category: "custom",
    type: "custom",
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function formatProductPrice(product: Product) {
  return product.priceLabel ?? `₱${product.pricePhp.toLocaleString("en-PH")}`;
}

export function formatPhp(value: number) {
  return `₱${value.toLocaleString("en-PH")}`;
}
