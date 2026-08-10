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
    <div className="rounded-lg border p-5 theme-card">
      <div className="rounded-md border border-[#00A8C0]/35 bg-[#00A8C0]/10 p-4">
        <p className="text-sm font-bold theme-text">Custom NFC Stand</p>
        <p className="mt-1 text-3xl font-black text-[#00A8C0]">₱1,099</p>
        <p className="mt-2 text-xs leading-5 theme-text-muted">
          Final price may depend on quantity and customization.
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        <button
          type="button"
          onClick={handleRequest}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-[var(--accent)] bg-[var(--accent)] px-5 text-sm font-bold text-[var(--button-primary-text)] transition hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <Send className="h-4 w-4" aria-hidden />
          Request This Design
        </button>
        {!canRequest ? (
          <p className="text-xs leading-5 theme-text-muted">
            Add a valid destination URL before requesting this design.
          </p>
        ) : null}
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border theme-border px-5 text-sm font-bold theme-text transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Reset Customization
        </button>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center px-4"
          style={{ background: "var(--overlay)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="request-ready-title"
        >
          <div className="w-full max-w-lg rounded-lg border p-6 theme-card-elevated">
            <h2 id="request-ready-title" className="text-2xl font-black theme-text">
              Your customization preview is ready.
            </h2>
            <p className="mt-4 text-sm leading-6 theme-text-secondary">
              Online ordering will be available soon. For now, contact
              TapTapTap to place this custom order.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a
                href={`mailto:${email}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[var(--accent)] bg-[var(--accent)] px-4 text-sm font-bold text-[var(--button-primary-text)] transition hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                <Mail className="h-4 w-4" aria-hidden />
                Email TapTapTap
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Message TapTapTap on Facebook, opens in a new tab"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border theme-border px-4 text-sm font-bold theme-text transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Message us on Facebook
              </a>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-md border theme-border px-4 text-sm font-bold theme-text transition hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
