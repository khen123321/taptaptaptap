"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type CSSProperties, type PointerEvent } from "react";
import type { PublicBusinessLogo } from "@/types/business-logos";

type PartnersLogoShowcaseProps = {
  logos: PublicBusinessLogo[];
};

type LogoOffset = {
  x: number;
  y: number;
};

export function PartnersLogoShowcase({ logos }: PartnersLogoShowcaseProps) {
  const [offsets, setOffsets] = useState<Record<string, LogoOffset>>({});
  const animationClasses = useMemo(
    () => ["partner-float-a", "partner-float-b", "partner-float-c", "partner-float-d"],
    [],
  );

  if (!logos.length) {
    return (
      <div className="rounded-2xl border theme-card p-8 text-center">
        <p className="text-lg font-black theme-text">No businesses have been added yet.</p>
      </div>
    );
  }

  const updateOffset = (event: PointerEvent<HTMLElement>, logoId: string) => {
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 8;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 8;
    setOffsets((current) => ({ ...current, [logoId]: { x, y } }));
  };

  const clearOffset = (logoId: string) => {
    setOffsets((current) => ({ ...current, [logoId]: { x: 0, y: 0 } }));
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {logos.map((logo, index) => {
        const offset = offsets[logo.id] ?? { x: 0, y: 0 };
        const cardStyle = {
          "--partner-float-delay": `${(index % 6) * -0.6}s`,
          "--partner-hover-x": `${offset.x}px`,
          "--partner-hover-y": `${offset.y}px`,
        } as CSSProperties;
        const content = (
          <PartnerLogoCard
            logo={logo}
            animationClass={animationClasses[index % animationClasses.length]}
            style={cardStyle}
            onPointerMove={(event) => updateOffset(event, logo.id)}
            onPointerLeave={() => clearOffset(logo.id)}
          />
        );

        if (!logo.website_url) return content;

        return (
          <Link
            key={logo.id}
            href={logo.website_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${logo.business_name} website in a new tab`}
            className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}

function PartnerLogoCard({
  logo,
  animationClass,
  style,
  onPointerMove,
  onPointerLeave,
}: {
  logo: PublicBusinessLogo;
  animationClass: string;
  style: CSSProperties;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave: () => void;
}) {
  return (
    <article
      key={logo.id}
      className={`partner-logo-card rounded-2xl border theme-card p-4 ${animationClass}`}
      style={style}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div className="partner-logo-inner grid min-h-32 place-items-center rounded-xl border theme-border bg-white p-4 sm:min-h-36">
        <Image
          src={logo.logo_url}
          alt={`${logo.business_name} logo`}
          width={240}
          height={140}
          unoptimized
          sizes="(min-width: 1280px) 240px, (min-width: 1024px) 28vw, 46vw"
          className="max-h-24 w-full object-contain sm:max-h-28"
        />
      </div>
      <p className="mt-3 text-center text-sm font-bold theme-text">{logo.business_name}</p>
    </article>
  );
}
