"use client";

import { ChevronDown } from "lucide-react";
import { mockupList } from "@/lib/mockups";

type ProductSelectorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ProductSelector({ value, onChange }: ProductSelectorProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#0A0D0F] p-5">
      <label htmlFor="product-type" className="text-sm font-bold text-white">
        Product Type
      </label>
      <div className="relative mt-3">
        <select
          id="product-type"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-12 w-full appearance-none rounded-md border border-white/10 bg-black/40 px-4 pr-10 text-sm font-semibold text-white outline-none transition focus:border-[#00A8C0] focus:ring-2 focus:ring-[#00A8C0]/25"
        >
          {mockupList.map((mockup) => (
            <option key={mockup.id} value={mockup.id}>
              {mockup.name}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#00A8C0]"
          aria-hidden
        />
      </div>
      <p className="mt-3 text-xs leading-5 text-[#9CA6AD]">
        More product mockups such as PVC NFC cards, wall plates, and stickers
        can be added later.
      </p>
    </div>
  );
}
