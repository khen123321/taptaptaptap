"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";

const faqs = [
  {
    question: "What is NFC?",
    answer:
      "NFC is short-range wireless technology that lets a compatible phone open a link when it is tapped near an NFC product.",
  },
  {
    question: "Do customers need an app?",
    answer:
      "No. Most compatible smartphones can detect NFC from the phone system without installing a special app.",
  },
  {
    question: "What phones support NFC?",
    answer:
      "Many modern iPhone and Android phones support NFC. For custom NFC signs, an optional QR backup can help customers with older or unsupported phones.",
  },
  {
    question: "Can the NFC link be changed later?",
    answer:
      "Some NFC products can be reprogrammed when your destination changes. We can guide you based on the product you choose.",
  },
  {
    question: "Can you customize the design?",
    answer:
      "Yes. TapTapTap can customize branding, colors, messaging, and product layout for your business.",
  },
  {
    question: "Can I order NFC products in bulk?",
    answer:
      "Yes. Bulk orders are available for branches, companies, events, and resellers.",
  },
  {
    question: "What if a customer's phone does not support NFC?",
    answer:
      "For Custom NFC Sign orders, a printed QR backup can be added so customers can still open the same destination.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="theme-section-alt px-4 py-18 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <SectionHeading title="Questions before you tap?" />
        <div className="mt-10 divide-y divide-[var(--border)] rounded-lg border theme-card">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq.question}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left text-base font-bold theme-text transition hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)] sm:px-6"
                  aria-expanded={isOpen}
                  aria-controls={`faq-${index}`}
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 theme-accent transition ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </button>
                <div
                  id={`faq-${index}`}
                  className={`grid transition-all ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-6 theme-text-secondary sm:px-6">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
