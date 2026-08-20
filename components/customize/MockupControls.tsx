"use client";

import { Maximize2, Minimize2, RotateCcw } from "lucide-react";
import type { FitMode } from "@/types/customize";

type MockupControlsProps = {
  fitMode: FitMode;
  zoom: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  onFitModeChange: (mode: FitMode) => void;
  onZoomChange: (value: number) => void;
  onOffsetXChange: (value: number) => void;
  onOffsetYChange: (value: number) => void;
  onRotationChange: (value: number) => void;
  onCenter: () => void;
  onReset: () => void;
};

export function MockupControls({
  fitMode,
  zoom,
  offsetX,
  offsetY,
  rotation,
  onFitModeChange,
  onZoomChange,
  onOffsetXChange,
  onOffsetYChange,
  onRotationChange,
  onCenter,
  onReset,
}: MockupControlsProps) {
  return (
    <div className="rounded-lg border p-5 theme-card">
      <h2 className="text-base font-bold theme-text">Fit / Fill</h2>
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-md border theme-border bg-[var(--surface-secondary)] p-1">
        {(["fit", "fill"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onFitModeChange(mode)}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
              fitMode === mode
                ? "bg-[var(--accent)] text-[var(--button-primary-text)]"
                : "theme-text hover:bg-[var(--accent-soft)]"
            }`}
          >
            {mode === "fit" ? (
              <Minimize2 className="h-4 w-4" aria-hidden />
            ) : (
              <Maximize2 className="h-4 w-4" aria-hidden />
            )}
            {mode === "fit" ? "Fit" : "Fill"}
          </button>
        ))}
      </div>

      <Slider
        id="zoom"
        label="Zoom"
        value={zoom}
        min={50}
        max={200}
        suffix="%"
        onChange={onZoomChange}
      />
      <Slider
        id="offset-x"
        label="Horizontal position"
        value={offsetX}
        min={-100}
        max={100}
        suffix="%"
        onChange={onOffsetXChange}
      />
      <Slider
        id="offset-y"
        label="Vertical position"
        value={offsetY}
        min={-100}
        max={100}
        suffix="%"
        onChange={onOffsetYChange}
      />
      <Slider
        id="rotation"
        label="Rotation"
        value={rotation}
        min={-15}
        max={15}
        suffix="deg"
        onChange={onRotationChange}
      />

      <div className="mt-5 grid gap-3 min-[390px]:grid-cols-2">
        <button
          type="button"
          onClick={onCenter}
          className="inline-flex min-h-11 items-center justify-center rounded-md border theme-border px-3 text-sm font-bold theme-text transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          Center Design
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border theme-border px-3 text-sm font-bold theme-text transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Reset
        </button>
      </div>
    </div>
  );
}

function Slider({
  id,
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="text-sm font-semibold theme-text">
          {label}
        </label>
        <span className="text-sm font-bold theme-accent">
          {value}
          {suffix}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 h-7 w-full accent-[#00A8C0]"
      />
    </div>
  );
}
