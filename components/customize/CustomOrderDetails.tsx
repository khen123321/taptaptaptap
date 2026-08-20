"use client";

import { Link2, Minus, Plus } from "lucide-react";

type CustomOrderDetailsProps = {
  destinationUrl: string;
  quantity: number;
  notes: string;
  urlError: string;
  onDestinationUrlChange: (value: string) => void;
  onQuantityChange: (value: number) => void;
  onNotesChange: (value: string) => void;
};

const examples = ["Google Review", "Facebook", "Instagram", "TikTok", "Website", "Menu", "Portfolio"];

export function CustomOrderDetails({
  destinationUrl,
  quantity,
  notes,
  urlError,
  onDestinationUrlChange,
  onQuantityChange,
  onNotesChange,
}: CustomOrderDetailsProps) {
  return (
    <div className="rounded-lg border p-5 theme-card">
      <div className="flex items-center gap-3">
        <Link2 className="h-5 w-5 theme-accent" aria-hidden />
        <h2 className="text-base font-bold theme-text">Order Details</h2>
      </div>

      <div className="mt-5">
        <label htmlFor="destination-url" className="text-sm font-bold theme-text">
          Where should the NFC open?
        </label>
        <input
          id="destination-url"
          type="url"
          value={destinationUrl}
          onChange={(event) => onDestinationUrlChange(event.target.value)}
          placeholder="https://..."
          aria-describedby="destination-help destination-error"
          className="mt-3 min-h-12 w-full rounded-md border theme-border bg-[var(--surface-secondary)] px-4 text-sm theme-text outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[#00A8C0]/25"
        />
        <p id="destination-help" className="mt-2 text-xs leading-5 theme-text-muted">
          This is the link we will program into your NFC product.
        </p>
        {urlError ? (
          <p id="destination-error" className="mt-2 text-sm text-red-200">
            {urlError}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {examples.map((example) => (
            <span
              key={example}
              className="rounded border px-2.5 py-1 text-xs font-medium theme-subtle theme-text-muted"
            >
              {example}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <label className="text-sm font-bold theme-text" htmlFor="quantity-display">
          Quantity
        </label>
        <div className="mt-3 inline-flex rounded-md border theme-border bg-[var(--surface-secondary)] p-1">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="inline-flex h-11 w-11 items-center justify-center rounded theme-text transition hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <output
            id="quantity-display"
            className="flex h-11 min-w-14 items-center justify-center px-3 text-sm font-bold theme-text"
          >
            {quantity}
          </output>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => onQuantityChange(quantity + 1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded theme-text transition hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="notes" className="text-sm font-bold theme-text">
          Special instructions
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Tell us anything we should know about your design or NFC destination."
          rows={4}
          className="mt-3 w-full resize-y rounded-md border theme-border bg-[var(--surface-secondary)] px-4 py-3 text-sm leading-6 theme-text outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[#00A8C0]/25"
        />
      </div>
    </div>
  );
}
