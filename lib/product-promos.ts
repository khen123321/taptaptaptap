import { formatPhp } from "@/lib/format";
import type { Product } from "@/types/product";

export function hasProductPromo(product: Product) {
  return product.buyTwoSavings > 0;
}

export function getProductSavingsLabel(product: Product) {
  if (!hasProductPromo(product)) return null;
  return product.bundleSavingsLabel ?? `Save ${formatPhp(product.buyTwoSavings)}`;
}

export function hasPromotionalProducts(products: Product[]) {
  return products.some(hasProductPromo);
}
