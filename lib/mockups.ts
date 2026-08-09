import type { MockupProduct } from "@/types/customize";

export const mockups: Record<string, MockupProduct> = {
  tabletopSign: {
    id: "table-sign",
    name: "NFC Table Sign",
    mockupImage: "/images/products/mockups/blank-nfc-stand.png",
    aspectRatio: "1 / 1",
    priceLabel: "Custom NFC Stand",
    sourceWidth: 1254,
    sourceHeight: 1254,
    printArea: {
      topLeft: { x: 378, y: 215 },
      topRight: { x: 990, y: 203 },
      bottomRight: { x: 888, y: 1048 },
      bottomLeft: { x: 270, y: 1005 },
    },
  },
};

export const mockupList = Object.values(mockups);

export const defaultMockup = mockups.tabletopSign;
