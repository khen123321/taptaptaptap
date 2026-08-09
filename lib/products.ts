import type { Product } from "@/types/product";

export const products: Product[] = [
  {
    id: "google-review-sign",
    name: "Google Review NFC Table Sign",
    slug: "google-review-nfc-table-sign",
    description: "Help customers instantly open your Google review page with one tap.",
    pricePhp: 599,
    image: "/images/products/google-review-sign.png",
    category: "nfc-signs",
    type: "ready-made",
  },
  {
    id: "facebook-follow-sign",
    name: "Facebook Follow NFC Table Sign",
    slug: "facebook-follow-nfc-table-sign",
    description: "Let customers like and follow your Facebook page instantly with one tap.",
    pricePhp: 599,
    image: "/images/products/facebook-follow-sign.png",
    category: "nfc-signs",
    type: "ready-made",
  },
  {
    id: "custom-nfc-sign",
    name: "Custom NFC Table Sign",
    slug: "custom-nfc-table-sign",
    description:
      "Upload your own design and create a fully customized NFC sign for your business.",
    pricePhp: 599,
    priceLabel: "Starting at ₱599",
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
