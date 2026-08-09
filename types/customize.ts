export type FitMode = "fit" | "fill";

export type UploadedDesign = {
  url: string;
  fileName: string;
  width?: number;
  height?: number;
};

export type Point = {
  x: number;
  y: number;
};

export type PrintAreaCorners = {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
};

export type MockupProduct = {
  id: string;
  name: string;
  mockupImage: string;
  aspectRatio: string;
  priceLabel: string;
  sourceWidth: number;
  sourceHeight: number;
  printArea: PrintAreaCorners;
};

export type CustomizerState = {
  productId: string;
  uploadedImage: UploadedDesign | null;
  fitMode: FitMode;
  zoom: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  destinationUrl: string;
  quantity: number;
  notes: string;
};
