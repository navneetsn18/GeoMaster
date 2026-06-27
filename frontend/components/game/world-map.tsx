"use client";

import { memo, useState, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Annotation,
  ZoomableGroup,
} from "react-simple-maps";
import { useTheme } from "next-themes";
import { ISO_NUMERIC_TO_ALPHA2, COUNTRY_NAMES } from "@/lib/country-codes";
import { useGameStore } from "@/lib/game-store";
import { getFlagUrl } from "@/lib/utils";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

/** Simple average centroid from GeoJSON geometry — good enough for labels */
function simpleCentroid(geo: { geometry: { type: string; coordinates: unknown } }): [number, number] {
  const pts: number[][] = [];
  const walk = (v: unknown): void => {
    if (!Array.isArray(v)) return;
    if (typeof v[0] === "number") { pts.push(v as number[]); return; }
    v.forEach(walk);
  };
  walk(geo.geometry.coordinates);
  if (!pts.length) return [0, 0];
  return [
    pts.reduce((s, p) => s + p[0], 0) / pts.length,
    pts.reduce((s, p) => s + p[1], 0) / pts.length,
  ];
}

interface WorldMapProps {
  onCountryClick: (alpha2Code: string) => void;
  disabled?: boolean;
  /** If provided, only these alpha2 codes are interactive; others dimmed */
  filterCodes?: Set<string>;
}

function WorldMapInner({ onCountryClick, disabled, filterCodes }: WorldMapProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const guessedCorrectly = useGameStore((s) => s.guessedCorrectly);
  const wrongGuesses = useGameStore((s) => s.wrongGuesses);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleClick = useCallback(
    (geo: { id: string }) => {
      if (disabled) return;
      const alpha2 = ISO_NUMERIC_TO_ALPHA2[geo.id];
      if (!alpha2) return;
      if (filterCodes && !filterCodes.has(alpha2)) return;
      if (guessedCorrectly.has(alpha2)) return;
      onCountryClick(alpha2);
    },
    [disabled, guessedCorrectly, onCountryClick, filterCodes]
  );

  const getFill = useCallback(
    (numericId: string) => {
      const alpha2 = ISO_NUMERIC_TO_ALPHA2[numericId];
      if (!alpha2) return isDark ? "#1e293b" : "#cbd5e1";
      if (filterCodes && !filterCodes.has(alpha2)) return isDark ? "#1a2233" : "#e2e8f0";
      if (guessedCorrectly.has(alpha2)) return "#22c55e";
      if (wrongGuesses.has(alpha2)) return "#ef4444";
      if (hoveredId === numericId) return "#6366f1";
      return isDark ? "#374151" : "#d1d5db";
    },
    [isDark, guessedCorrectly, wrongGuesses, hoveredId, filterCodes]
  );

  const getStroke = useCallback(
    (numericId: string) => {
      const alpha2 = ISO_NUMERIC_TO_ALPHA2[numericId];
      if (!alpha2) return isDark ? "#0f172a" : "#e2e8f0";
      if (guessedCorrectly.has(alpha2)) return "#16a34a";
      if (wrongGuesses.has(alpha2)) return "#dc2626";
      return isDark ? "#1f2937" : "#e5e7eb";
    },
    [isDark, guessedCorrectly, wrongGuesses]
  );

  return (
    <div className="w-full h-full select-none">
      <ComposableMap
        projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup zoom={1} minZoom={0.8} maxZoom={8}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) => (
              <>
                {geographies.map((geo) => {
                  const alpha2 = ISO_NUMERIC_TO_ALPHA2[geo.id as string];
                  const isCorrect = alpha2 ? guessedCorrectly.has(alpha2) : false;
                  const isFiltered = !!(filterCodes && alpha2 && !filterCodes.has(alpha2));

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getFill(geo.id as string)}
                      stroke={getStroke(geo.id as string)}
                      strokeWidth={0.5}
                      style={{
                        default: {
                          outline: "none",
                          cursor: disabled || isCorrect || isFiltered ? "default" : "pointer",
                          transition: "fill 0.2s ease",
                        },
                        hover: {
                          outline: "none",
                          fill: disabled || isCorrect || isFiltered
                            ? getFill(geo.id as string)
                            : "#6366f1",
                          cursor: disabled || isCorrect || isFiltered ? "default" : "pointer",
                        },
                        pressed: { outline: "none", fill: "#4f46e5" },
                      }}
                      onMouseEnter={() => {
                        if (!disabled && !isCorrect && !isFiltered) setHoveredId(geo.id as string);
                      }}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => handleClick({ id: geo.id as string })}
                    />
                  );
                })}

                {/* Name + flag labels on correctly guessed countries */}
                {guessedCorrectly.size > 0 && geographies.map((geo) => {
                  const alpha2 = ISO_NUMERIC_TO_ALPHA2[geo.id as string];
                  if (!alpha2 || !guessedCorrectly.has(alpha2)) return null;

                  const [lon, lat] = simpleCentroid(geo);
                  const name = COUNTRY_NAMES[alpha2] ?? alpha2.toUpperCase();
                  const flagUrl = getFlagUrl(alpha2);
                  const shortName = name.length > 10 ? name.slice(0, 9) + "…" : name;

                  return (
                    <Annotation
                      key={`lbl-${geo.rsmKey}`}
                      subject={[lon, lat]}
                      dx={0}
                      dy={0}
                      connectorProps={{}}
                    >
                      <g
                        transform="translate(-18, -12)"
                        style={{ pointerEvents: "none" }}
                      >
                        <image
                          href={flagUrl}
                          x={0}
                          y={0}
                          width={14}
                          height={10}
                        />
                        <text
                          x={16}
                          y={8}
                          fontSize={6}
                          fontWeight="700"
                          fill="#fff"
                          stroke="#000"
                          strokeWidth={0.4}
                          paintOrder="stroke"
                        >
                          {shortName}
                        </text>
                      </g>
                    </Annotation>
                  );
                })}
              </>
            )}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}

export const WorldMap = memo(WorldMapInner);
