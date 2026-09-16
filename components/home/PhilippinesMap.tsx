"use client";

import { useMemo, useState } from "react";
import {
  philippinesBoundaryPaths,
  philippinesMapBounds,
  philippinesMapViewBox,
} from "@/data/philippines-boundary";
import type { PublicMapMarker } from "@/types/map-locations";

type PhilippinesMapProps = {
  markers: PublicMapMarker[];
};

type ProjectedMarker = PublicMapMarker & {
  x: number;
  y: number;
};

const philippinesMapViewport = {
  x: 40,
  y: 0,
  width: 560,
  height: 880,
} as const;

export function PhilippinesMap({ markers }: PhilippinesMapProps) {
  const [activeMarker, setActiveMarker] = useState<ProjectedMarker | null>(null);

  const projectedMarkers = useMemo(
    () => markers.map((marker) => ({ ...marker, ...projectMarker(marker.latitude, marker.longitude) })),
    [markers],
  );

  return (
    <div
      className="relative mx-auto w-full max-w-[430px] sm:max-w-[470px] lg:max-w-[800px] xl:max-w-[900px]"
      onClick={() => setActiveMarker(null)}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(0,168,192,0.08),transparent_44%)]" />
      <div className="relative mx-auto aspect-[8/11] w-full lg:aspect-[7/11]">
        <svg
          className="h-full w-full overflow-visible"
          viewBox={`${philippinesMapViewport.x} ${philippinesMapViewport.y} ${philippinesMapViewport.width} ${philippinesMapViewport.height}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Philippines map showing TapTapTap public locations by city"
        >
          <defs>
            <pattern id="philippines-dot-pattern" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="5" cy="5" r="2.4" className="fill-[color-mix(in_srgb,var(--accent)_45%,var(--text-muted))]" />
            </pattern>
            <filter id="pin-shadow" x="-60%" y="-60%" width="220%" height="220%">
              <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#001014" floodOpacity="0.22" />
            </filter>
          </defs>
          <g opacity="0.96">
            {philippinesBoundaryPaths.map((path) => (
              <path
                key={path}
                d={path}
                fill="url(#philippines-dot-pattern)"
                className="stroke-[color-mix(in_srgb,var(--accent)_42%,var(--border-strong))]"
                strokeWidth="0.8"
              />
            ))}
          </g>

          {projectedMarkers.map((marker) => (
            <g
              key={`${marker.city}-${marker.province ?? "ph"}-${marker.latitude}-${marker.longitude}`}
              role="button"
              tabIndex={0}
              aria-label={`${marker.city}, ${marker.province ?? "Philippines"}: ${marker.count} TapTapTap ${marker.count === 1 ? "location" : "locations"}`}
              className="cursor-pointer outline-none"
              transform={`translate(${marker.x} ${marker.y})`}
              onMouseEnter={() => setActiveMarker(marker)}
              onMouseLeave={() => setActiveMarker(null)}
              onFocus={() => setActiveMarker(marker)}
              onBlur={() => setActiveMarker(null)}
              onClick={(event) => {
                event.stopPropagation();
                setActiveMarker((current) => (current === marker ? null : marker));
              }}
            >
              <circle cx="0" cy="0" r="30" fill="transparent" pointerEvents="all" />
              <path
                d="M0 -22 C12 -22 22 -12 22 0 C22 15 0 32 0 32 C0 32 -22 15 -22 0 C-22 -12 -12 -22 0 -22 Z"
                className="fill-[var(--accent)] stroke-white"
                strokeWidth="3"
                filter="url(#pin-shadow)"
              />
              {activeMarker === marker ? (
                <circle cx="0" cy="0" r="25" className="fill-none stroke-[var(--accent)]" strokeWidth="2" />
              ) : null}
              <circle cx="0" cy="0" r="8" className="fill-white" />
              {marker.count > 1 ? (
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  className="fill-[var(--accent)] text-[10px] font-black"
                >
                  {marker.count > 9 ? "9+" : marker.count}
                </text>
              ) : null}
            </g>
          ))}
        </svg>

        <MapTooltip marker={activeMarker} />
      </div>

      {markers.length === 0 ? (
        <div className="relative mx-auto -mt-2 max-w-xs rounded-md bg-[var(--surface-secondary)]/70 p-3 text-center text-sm theme-text-secondary">
          No locations added yet.
        </div>
      ) : null}
    </div>
  );
}

function MapTooltip({ marker }: { marker: ProjectedMarker | null }) {
  const left = `${(((marker?.x ?? philippinesMapViewport.x + philippinesMapViewport.width / 2) - philippinesMapViewport.x) / philippinesMapViewport.width) * 100}%`;
  const top = `${(((marker?.y ?? philippinesMapViewport.y + philippinesMapViewport.height / 2) - philippinesMapViewport.y) / philippinesMapViewport.height) * 100}%`;
  const alignRight = (marker?.x ?? 0) > philippinesMapViewport.x + philippinesMapViewport.width * 0.68;
  const alignBottom = (marker?.y ?? 0) > philippinesMapViewport.y + philippinesMapViewport.height * 0.72;

  return (
    <div
      className={`pointer-events-none absolute z-10 min-w-[150px] rounded-md border theme-card-elevated px-3 py-2 text-xs shadow-lg transition-opacity duration-150 ${
        marker ? "visible opacity-100" : "invisible opacity-0"
      }`}
      style={{
        left,
        top,
        transform: `translate(${alignRight ? "-100%" : "12px"}, ${alignBottom ? "calc(-100% - 18px)" : "-50%"})`,
      }}
    >
      {marker ? (
        <>
          <p className="font-black theme-text">{marker.city}</p>
          <p className="mt-0.5 theme-text-muted">{marker.province ?? marker.region ?? "Philippines"}</p>
          <p className="mt-1 font-bold theme-accent">
            {marker.count.toLocaleString("en-PH")} {marker.count === 1 ? "location" : "locations"}
          </p>
        </>
      ) : null}
    </div>
  );
}

function projectMarker(latitude: number, longitude: number) {
  return {
    x: clamp(
      philippinesMapBounds.offsetX + (longitude - philippinesMapBounds.minLng) * philippinesMapBounds.scale,
      34,
      philippinesMapViewBox.width - 34,
    ),
    y: clamp(
      philippinesMapBounds.offsetY + (philippinesMapBounds.maxLat - latitude) * philippinesMapBounds.scale,
      34,
      philippinesMapViewBox.height - 34,
    ),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
