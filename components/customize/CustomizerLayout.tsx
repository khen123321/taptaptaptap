"use client";

import { useEffect, useMemo, useState } from "react";
import { CustomOrderActions } from "@/components/customize/CustomOrderActions";
import { CustomOrderDetails } from "@/components/customize/CustomOrderDetails";
import { DesignUploader } from "@/components/customize/DesignUploader";
import { MockupControls } from "@/components/customize/MockupControls";
import { MockupPreview } from "@/components/customize/MockupPreview";
import { ProductSelector } from "@/components/customize/ProductSelector";
import { trackEvent } from "@/lib/analytics/client";
import { defaultMockup, mockups } from "@/lib/mockups";
import type { CustomizerState, FitMode } from "@/types/customize";

const initialState: CustomizerState = {
  productId: defaultMockup.id,
  uploadedImage: null,
  fitMode: "fill",
  zoom: 100,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  destinationUrl: "",
  quantity: 1,
  notes: "",
};

export function CustomizerLayout() {
  const [state, setState] = useState<CustomizerState>(initialState);
  const [urlTouched, setUrlTouched] = useState(false);

  const product = mockups[state.productId] ?? defaultMockup;

  useEffect(() => {
    return () => {
      if (state.uploadedImage?.url) {
        URL.revokeObjectURL(state.uploadedImage.url);
      }
    };
  }, [state.uploadedImage?.url]);

  const urlError = useMemo(() => {
    const value = state.destinationUrl.trim();
    if (!urlTouched && !value) return "";
    if (!value) return "Enter the link you want your NFC product to open.";

    try {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol)) {
        return "Use a valid http:// or https:// link.";
      }
      return "";
    } catch {
      return "Use a valid URL such as https://example.com.";
    }
  }, [state.destinationUrl, urlTouched]);

  const canRequest = state.destinationUrl.trim().length > 0 && !urlError;

  const uploadDesign = async (file: File) => {
    const url = URL.createObjectURL(file);
    const dimensions = await readImageDimensions(url);
    trackEvent("customizer_upload", {
      metadata: { source: "customizer" },
      dedupeKey: `customizer_upload:${Date.now()}`,
    });

    setState((current) => {
      if (current.uploadedImage?.url) {
        URL.revokeObjectURL(current.uploadedImage.url);
      }

      return {
        ...current,
        uploadedImage: {
          url,
          fileName: file.name,
          ...dimensions,
        },
      };
    });
  };

  const removeDesign = () => {
    setState((current) => {
      if (current.uploadedImage?.url) {
        URL.revokeObjectURL(current.uploadedImage.url);
      }
      return { ...current, uploadedImage: null };
    });
  };

  const centerDesign = () => {
    setState((current) => ({ ...current, offsetX: 0, offsetY: 0 }));
  };

  const resetPreview = () => {
    setState((current) => ({
      ...current,
      fitMode: "fill",
      zoom: 100,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
    }));
  };

  const resetAll = () => {
    setState((current) => {
      if (current.uploadedImage?.url) {
        URL.revokeObjectURL(current.uploadedImage.url);
      }
      return initialState;
    });
    setUrlTouched(false);
  };

  const requestDesign = () => {
    setUrlTouched(true);
    if (canRequest) {
      trackEvent("customizer_request", {
        metadata: { source: "customizer" },
        dedupeKey: `customizer_request:${Date.now()}`,
      });
    }
    return canRequest;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start">
      <div className="order-2 space-y-5 lg:order-1">
        <div className="rounded-lg border p-5 theme-card">
          <p className="text-xs font-bold uppercase tracking-[0.2em] theme-accent">
            Customize your NFC
          </p>
          <h2 className="mt-2 text-xl font-bold theme-text">
            Upload, position, and preview your artwork.
          </h2>
        </div>
        <ProductSelector
          value={state.productId}
          onChange={(productId) => setState((current) => ({ ...current, productId }))}
        />
        <DesignUploader
          uploadedImage={state.uploadedImage}
          onUpload={uploadDesign}
          onRemove={removeDesign}
        />
        <MockupControls
          fitMode={state.fitMode}
          zoom={state.zoom}
          offsetX={state.offsetX}
          offsetY={state.offsetY}
          rotation={state.rotation}
          onFitModeChange={(fitMode: FitMode) =>
            setState((current) => ({ ...current, fitMode }))
          }
          onZoomChange={(zoom) => setState((current) => ({ ...current, zoom }))}
          onOffsetXChange={(offsetX) =>
            setState((current) => ({ ...current, offsetX }))
          }
          onOffsetYChange={(offsetY) =>
            setState((current) => ({ ...current, offsetY }))
          }
          onRotationChange={(rotation) =>
            setState((current) => ({ ...current, rotation }))
          }
          onCenter={centerDesign}
          onReset={resetPreview}
        />
        <CustomOrderDetails
          destinationUrl={state.destinationUrl}
          quantity={state.quantity}
          notes={state.notes}
          urlError={urlError}
          onDestinationUrlChange={(destinationUrl) => {
            setUrlTouched(true);
            setState((current) => ({ ...current, destinationUrl }));
          }}
          onQuantityChange={(quantity) =>
            setState((current) => ({ ...current, quantity }))
          }
          onNotesChange={(notes) => setState((current) => ({ ...current, notes }))}
        />
        <CustomOrderActions
          canRequest={canRequest}
          onRequest={requestDesign}
          onReset={resetAll}
        />
      </div>

      <div className="order-1 lg:order-2">
        <MockupPreview
          product={product}
          uploadedImage={state.uploadedImage}
          fitMode={state.fitMode}
          zoom={state.zoom}
          offsetX={state.offsetX}
          offsetY={state.offsetY}
          rotation={state.rotation}
          onOffsetChange={({ x, y }) =>
            setState((current) => ({ ...current, offsetX: x, offsetY: y }))
          }
          onFitModeChange={(fitMode) => setState((current) => ({ ...current, fitMode }))}
          onCenter={centerDesign}
          onReset={resetPreview}
        />
      </div>
    </div>
  );
}

function readImageDimensions(url: string): Promise<{ width?: number; height?: number }> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve({});
    image.src = url;
  });
}
