"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
import { ComposableMap, Geographies, Geography, Sphere, Graticule } from "react-simple-maps";
import { useTheme } from "next-themes";
import { ISO_NUMERIC_TO_ALPHA2, COUNTRY_NAMES } from "@/lib/country-codes";
import { useGameStore } from "@/lib/game-store";
import { getFlagUrl } from "@/lib/utils";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

interface WorldMapProps {
  onCountryClick: (alpha2Code: string) => void;
  disabled?: boolean;
  filterCodes?: Set<string>;
}

function WorldMapInner({ onCountryClick, disabled, filterCodes }: WorldMapProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const guessedCorrectly = useGameStore((s) => s.guessedCorrectly);
  const wrongGuesses = useGameStore((s) => s.wrongGuesses);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Globe rotation + zoom
  const [rotation, setRotation] = useState<[number, number, number]>([-10, -20, 0]);
  const [scale, setScale] = useState(280);
  const dragRef = useRef<{ x: number; y: number; rot: [number, number, number]; moved: boolean } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, rot: rotation, moved: false };
  }, [disabled, rotation]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragRef.current.moved = true;
    const sensitivity = 0.35;
    setRotation([
      dragRef.current.rot[0] + dx * sensitivity,
      Math.max(-90, Math.min(90, dragRef.current.rot[1] - dy * sensitivity)),
      0,
    ]);
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleClick = useCallback(
    (geo: { id: string }) => {
      if (dragRef.current?.moved) return; // ignore click if user was dragging
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
      return isDark ? "#0f172a" : "#e5e7eb";
    },
    [isDark, guessedCorrectly, wrongGuesses]
  );

  // Scroll to zoom — must use addEventListener (passive:false) so preventDefault works
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setScale(s => Math.min(1200, Math.max(100, s - e.deltaY * 0.8)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);


  return (
    <div
      ref={containerRef}
      className="w-full h-full select-none"
      style={{ cursor: dragRef.current ? "grabbing" : "grab" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <ComposableMap
        projection="geoOrthographic"
        projectionConfig={{ rotate: rotation, scale }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Ocean */}
        <Sphere id="globe-sphere" fill={isDark ? "#0d1526" : "#bfdbfe"} stroke={isDark ? "#1e3a5f" : "#93c5fd"} strokeWidth={1} />
        {/* Grid lines */}
        <Graticule stroke={isDark ? "#1e3a5f44" : "#93c5fd44"} strokeWidth={0.4} />

        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const alpha2 = ISO_NUMERIC_TO_ALPHA2[geo.id as string];
              const isCorrect = alpha2 ? guessedCorrectly.has(alpha2) : false;
              const isFiltered = !!(filterCodes && alpha2 && !filterCodes.has(alpha2));

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getFill(geo.id as string)}
                  stroke={getStroke(geo.id as string)}
                  strokeWidth={0.4}
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
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Hovered country name */}
      {hoveredId && (() => {
        const alpha2 = ISO_NUMERIC_TO_ALPHA2[hoveredId];
        const name = alpha2 ? COUNTRY_NAMES[alpha2] : null;
        return name ? (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-background/85 backdrop-blur-sm border border-border/40 px-3 py-1 rounded-full text-xs font-semibold pointer-events-none z-20 shadow-lg">
            {name}
          </div>
        ) : null;
      })()}

      {/* Drag hint */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/50 pointer-events-none select-none">
        Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}

export const WorldMap = memo(WorldMapInner);
