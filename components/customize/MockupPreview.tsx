"use client";

import { Download, Move, Nfc } from "lucide-react";
import type { PointerEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getMatrix3dForQuad, getQuadSize } from "@/lib/perspective";
import type { FitMode, MockupProduct, UploadedDesign } from "@/types/customize";

type MockupPreviewProps = {
  product: MockupProduct;
  uploadedImage: UploadedDesign | null;
  fitMode: FitMode;
  zoom: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  onOffsetChange: (offset: { x: number; y: number }) => void;
  onFitModeChange: (mode: FitMode) => void;
  onCenter: () => void;
  onReset: () => void;
};

export function MockupPreview({
  product,
  uploadedImage,
  fitMode,
  zoom,
  offsetX,
  offsetY,
  rotation,
  onOffsetChange,
  onFitModeChange,
  onCenter,
  onReset,
}: MockupPreviewProps) {
  const mockupFrameRef = useRef<HTMLDivElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ pointerId: 0, x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const [dragging, setDragging] = useState(false);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!mockupFrameRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      setFrameSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(mockupFrameRef.current);

    return () => observer.disconnect();
  }, []);

  const artworkPlane = useMemo(() => {
    if (!frameSize.width || !frameSize.height) return null;

    const scaleX = frameSize.width / product.sourceWidth;
    const scaleY = frameSize.height / product.sourceHeight;
    const quad = [
      scalePoint(product.printArea.topLeft, scaleX, scaleY),
      scalePoint(product.printArea.topRight, scaleX, scaleY),
      scalePoint(product.printArea.bottomRight, scaleX, scaleY),
      scalePoint(product.printArea.bottomLeft, scaleX, scaleY),
    ] as const;
    const size = getQuadSize(quad);

    return {
      width: size.width,
      height: size.height,
      transform: getMatrix3dForQuad(size.width, size.height, [...quad]),
    };
  }, [frameSize.height, frameSize.width, product]);

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!uploadedImage || !printAreaRef.current) return;
    event.preventDefault();
    printAreaRef.current.setPointerCapture(event.pointerId);
    dragStart.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      offsetX,
      offsetY,
    };
    setDragging(true);
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging || !printAreaRef.current) return;
    event.preventDefault();
    const rect = printAreaRef.current.getBoundingClientRect();
    const dx = ((event.clientX - dragStart.current.x) / rect.width) * 100;
    const dy = ((event.clientY - dragStart.current.y) / rect.height) * 100;
    onOffsetChange({
      x: clamp(dragStart.current.offsetX + dx, -100, 100),
      y: clamp(dragStart.current.offsetY + dy, -100, 100),
    });
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!printAreaRef.current || dragStart.current.pointerId !== event.pointerId) {
      return;
    }
    printAreaRef.current.releasePointerCapture(event.pointerId);
    setDragging(false);
  };

  return (
    <section className="rounded-lg border p-4 theme-card-elevated sm:p-6 lg:sticky lg:top-28">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] theme-accent">
            Live Preview
          </p>
          <h2 className="mt-2 text-xl font-bold theme-text">{product.name}</h2>
        </div>
        <div className="rounded-md border theme-border bg-[var(--surface-secondary)] px-3 py-2 text-sm font-bold theme-text">
          Starting at <span className="theme-accent">₱1,099</span>
        </div>
      </div>

      <div
        ref={mockupFrameRef}
        className="relative mx-auto mt-5 w-full max-w-[680px] overflow-hidden bg-black sm:mt-6"
        style={{ aspectRatio: product.aspectRatio }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.mockupImage}
          alt="Blank NFC table sign mockup"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {uploadedImage ? (
          <div
            ref={printAreaRef}
            className="absolute left-0 top-0 z-10 cursor-grab touch-none overflow-hidden active:cursor-grabbing"
            style={{
              width: `${artworkPlane?.width ?? 0}px`,
              height: `${artworkPlane?.height ?? 0}px`,
              borderRadius: "12px",
              transform: artworkPlane?.transform,
              transformOrigin: "0 0",
            }}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            aria-label="Printable design area"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={uploadedImage.url}
              alt="Uploaded artwork preview"
              draggable={false}
              className={`h-full w-full select-none ${
                fitMode === "fit" ? "object-contain" : "object-cover"
              }`}
              style={{
                transform: `translate(${offsetX}%, ${offsetY}%) rotate(${rotation}deg) scale(${zoom / 100})`,
                transformOrigin: "center",
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.24),rgba(255,255,255,0.03)_38%,rgba(0,0,0,0.1)_78%)] mix-blend-soft-light" />
            <div className="pointer-events-none absolute inset-0 border border-black/10" />
          </div>
        ) : null}
      </div>

      {!uploadedImage ? (
        <div className="mt-4 rounded-lg border p-4 text-center theme-subtle">
          <Nfc className="mx-auto h-6 w-6 theme-accent" aria-hidden />
          <p className="mt-2 text-sm font-semibold theme-text">
            Upload your design to preview it here.
          </p>
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <PreviewButton active={fitMode === "fit"} onClick={() => onFitModeChange("fit")}>
          Fit
        </PreviewButton>
        <PreviewButton active={fitMode === "fill"} onClick={() => onFitModeChange("fill")}>
          Fill
        </PreviewButton>
        <PreviewButton onClick={onCenter}>
          <Move className="h-4 w-4" aria-hidden />
          Center
        </PreviewButton>
        <PreviewButton onClick={onReset}>Reset</PreviewButton>
      </div>

      <button
        type="button"
      disabled
        className="mt-3 inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border theme-border bg-[var(--surface-secondary)] px-4 text-sm font-semibold theme-text-muted"
      >
        <Download className="h-4 w-4" aria-hidden />
        Download Preview Coming soon
      </button>
    </section>
  );
}

function PreviewButton({
  children,
  active = false,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00A8C0] ${
        active
          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--button-primary-text)]"
          : "theme-border bg-[var(--surface-secondary)] theme-text hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
      }`}
    >
      {children}
    </button>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function scalePoint(point: { x: number; y: number }, scaleX: number, scaleY: number) {
  return {
    x: point.x * scaleX,
    y: point.y * scaleY,
  };
}
