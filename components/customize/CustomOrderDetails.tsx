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
    <div className="rounded-lg border border-white/10 bg-[#0A0D0F] p-5">
      <div className="flex items-center gap-3">
        <Link2 className="h-5 w-5 text-[#00A8C0]" aria-hidden />
        <h2 className="text-base font-bold text-white">Order Details</h2>
      </div>

      <div className="mt-5">
        <label htmlFor="destination-url" className="text-sm font-bold text-white">
          Where should the NFC open?
        </label>
        <input
          id="destination-url"
          type="url"
          value={destinationUrl}
          onChange={(event) => onDestinationUrlChange(event.target.value)}
          placeholder="https://..."
          aria-describedby="destination-help destination-error"
          className="mt-3 min-h-12 w-full rounded-md border border-white/10 bg-black/40 px-4 text-sm text-white outline-none transition placeholder:text-[#9CA6AD]/60 focus:border-[#00A8C0] focus:ring-2 focus:ring-[#00A8C0]/25"
        />
        <p id="destination-help" className="mt-2 text-xs leading-5 text-[#9CA6AD]">
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
              className="rounded border border-white/10 bg-black/35 px-2.5 py-1 text-xs font-medium text-[#9CA6AD]"
            >
              {example}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <label className="text-sm font-bold text-white" htmlFor="quantity-display">
          Quantity
        </label>
        <div className="mt-3 inline-flex rounded-md border border-white/10 bg-black/40 p-1">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="inline-flex h-10 w-10 items-center justify-center rounded text-white transition hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00A8C0]"
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <output
            id="quantity-display"
            className="flex h-10 min-w-14 items-center justify-center px-3 text-sm font-bold text-white"
          >
            {quantity}
          </output>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => onQuantityChange(quantity + 1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded text-white transition hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00A8C0]"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="notes" className="text-sm font-bold text-white">
          Special instructions
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Tell us anything we should know about your design or NFC destination."
          rows={4}
          className="mt-3 w-full resize-y rounded-md border border-white/10 bg-black/40 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-[#9CA6AD]/60 focus:border-[#00A8C0] focus:ring-2 focus:ring-[#00A8C0]/25"
        />
      </div>
    </div>
  );
}
