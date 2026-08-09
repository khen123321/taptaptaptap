"use client";

import { Mail, MessageCircle, RotateCcw, Send } from "lucide-react";
import { useState } from "react";

const email = "taptaptap.official@outlook.com";
const facebookUrl = "https://www.facebook.com/profile.php?id=61592859069891";

type CustomOrderActionsProps = {
  canRequest: boolean;
  onRequest: () => boolean;
  onReset: () => void;
};

export function CustomOrderActions({
  canRequest,
  onRequest,
  onReset,
}: CustomOrderActionsProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleRequest = () => {
    if (onRequest()) {
      setModalOpen(true);
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-[#0A0D0F] p-5">
      <div className="rounded-md border border-[#00A8C0]/35 bg-[#00A8C0]/10 p-4">
        <p className="text-sm font-bold text-white">Custom NFC Stand</p>
        <p className="mt-1 text-3xl font-black text-[#00A8C0]">₱599</p>
        <p className="mt-2 text-xs leading-5 text-[#9CA6AD]">
          Final price may depend on quantity and customization.
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        <button
          type="button"
          onClick={handleRequest}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-[#00A8C0] bg-[#00A8C0] px-5 text-sm font-bold text-black transition hover:bg-[#26c3d8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00A8C0]"
        >
          <Send className="h-4 w-4" aria-hidden />
          Request This Design
        </button>
        {!canRequest ? (
          <p className="text-xs leading-5 text-[#9CA6AD]">
            Add a valid destination URL before requesting this design.
          </p>
        ) : null}
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-white/10 px-5 text-sm font-bold text-white transition hover:border-[#00A8C0]/60 hover:bg-[#00A8C0]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00A8C0]"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Reset Customization
        </button>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="request-ready-title"
        >
          <div className="w-full max-w-lg rounded-lg border border-white/10 bg-[#0A0D0F] p-6 shadow-2xl">
            <h2 id="request-ready-title" className="text-2xl font-black text-white">
              Your customization preview is ready.
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#9CA6AD]">
              Online ordering will be available soon. For now, contact
              TapTapTap to place this custom order.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a
                href={`mailto:${email}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#00A8C0] bg-[#00A8C0] px-4 text-sm font-bold text-black transition hover:bg-[#26c3d8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00A8C0]"
              >
                <Mail className="h-4 w-4" aria-hidden />
                Email TapTapTap
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Message TapTapTap on Facebook, opens in a new tab"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/10 px-4 text-sm font-bold text-white transition hover:border-[#00A8C0]/60 hover:bg-[#00A8C0]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00A8C0]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Message us on Facebook
              </a>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-md border border-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00A8C0]"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
