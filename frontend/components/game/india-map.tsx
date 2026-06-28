"use client";

import { useState, useCallback, memo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";

const GEO_URL =
  "https://gist.githubusercontent.com/jbrobst/56c13bbbf9d97d187fea01ca62ea5112/raw/e388c4cae20aa53cb5090210a42ebb9b765c0a36/india_states.geojson";

// Map GeoJSON ST_NM property → ISO 3166-2:IN code (lowercase)
// Comprehensive list of name variants found across different GeoJSON sources
const STATE_NAME_TO_CODE: Record<string, string> = {
  "andhra pradesh": "in-ap",
  "arunachal pradesh": "in-ar",
  "assam": "in-as",
  "bihar": "in-br",
  "chhattisgarh": "in-ct",
  "chattisgarh": "in-ct",
  "goa": "in-ga",
  "gujarat": "in-gj",
  "haryana": "in-hr",
  "himachal pradesh": "in-hp",
  "jharkhand": "in-jh",
  "karnataka": "in-ka",
  "kerala": "in-kl",
  "madhya pradesh": "in-mp",
  "maharashtra": "in-mh",
  "manipur": "in-mn",
  "meghalaya": "in-ml",
  "mizoram": "in-mz",
  "nagaland": "in-nl",
  "odisha": "in-or",
  "orissa": "in-or",
  "punjab": "in-pb",
  "rajasthan": "in-rj",
  "sikkim": "in-sk",
  "tamil nadu": "in-tn",
  "tamilnadu": "in-tn",
  "telangana": "in-tg",
  "tripura": "in-tr",
  "uttar pradesh": "in-up",
  "uttarakhand": "in-ut",
  "uttaranchal": "in-ut",
  "west bengal": "in-wb",
  // UTs — all possible spellings
  "andaman & nicobar island": "in-an",
  "andaman and nicobar islands": "in-an",
  "andaman & nicobar islands": "in-an",
  "andaman and nicobar island": "in-an",
  "andaman nicobar": "in-an",
  "a & n islands": "in-an",
  "chandigarh": "in-ch",
  "dadra and nagar haveli and daman and diu": "in-dd",
  "dadra and nagar haveli": "in-dh",
  "dadra & nagar haveli": "in-dh",
  "dadra & nagar haveli and daman & diu": "in-dd",
  "daman & diu": "in-dd",
  "daman and diu": "in-dd",
  "delhi": "in-dl",
  "nct of delhi": "in-dl",
  "national capital territory of delhi": "in-dl",
  "new delhi": "in-dl",
  "jammu & kashmir": "in-jk",
  "jammu and kashmir": "in-jk",
  "j & k": "in-jk",
  "ladakh": "in-la",
  "lakshadweep": "in-ld",
  "lakshwadeep": "in-ld",
  "puducherry": "in-py",
  "pondicherry": "in-py",
  "puducheery": "in-py",
};

function stateNameToCode(name: string): string | null {
  if (!name) return null;
  return STATE_NAME_TO_CODE[name.toLowerCase().trim()] ?? null;
}

interface IndiaMapProps {
  onStateClick: (stateCode: string) => void;
  disabled?: boolean;
  guessedCorrectly: Set<string>;
  wrongGuesses: Set<string>;
  targetCode?: string;
}

const COLORS = {
  default: "#1e3a5f",
  hover: "#2d5a9e",
  correct: "#16a34a",
  wrong: "#9f1239",
  stroke: "#0f2847",
};

function IndiaMapInner({
  onStateClick,
  disabled,
  guessedCorrectly,
  wrongGuesses,
}: IndiaMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [geoError, setGeoError] = useState(false);

  const getFill = useCallback(
    (code: string) => {
      if (guessedCorrectly.has(code)) return COLORS.correct;
      if (wrongGuesses.has(code)) return COLORS.wrong;
      // Do NOT highlight target — that's the answer we're asking for
      if (code === hovered) return COLORS.hover;
      return COLORS.default;
    },
    [guessedCorrectly, wrongGuesses, hovered]
  );

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#0d1526]">
      {hoveredName && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-background/85 backdrop-blur-sm border border-border/40 px-3 py-1 rounded-full text-xs font-semibold pointer-events-none z-20 shadow-lg">
          {hoveredName}
        </div>
      )}
      {geoError ? (
        <div className="text-muted-foreground text-sm">
          Failed to load India map. Check your connection.
        </div>
      ) : (
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [82.5, 22], scale: 800 }}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup center={[82.5, 22]} zoom={1} minZoom={1} maxZoom={10}>
            <Geographies
              geography={GEO_URL}
              onError={() => setGeoError(true)}
            >
              {({ geographies }) =>
                geographies.map((geo) => {
                  const stateName: string =
                    geo.properties?.ST_NM ??
                    geo.properties?.NAME_1 ??
                    geo.properties?.name ??
                    "";
                  const code = stateNameToCode(stateName) ?? "";
                  const fill = getFill(code);

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => {
                        if (disabled || !code) return;
                        onStateClick(code);
                      }}
                      onMouseEnter={() => { if (!disabled) { setHovered(code); setHoveredName(stateName); } }}
                      onMouseLeave={() => { setHovered(null); setHoveredName(null); }}
                      style={{
                        default: {
                          fill,
                          stroke: COLORS.stroke,
                          strokeWidth: 0.5,
                          outline: "none",
                          cursor: disabled || !code ? "default" : "pointer",
                          transition: "fill 0.15s ease",
                        },
                        hover: {
                          fill: disabled ? fill : COLORS.hover,
                          stroke: COLORS.stroke,
                          strokeWidth: 0.5,
                          outline: "none",
                          cursor: disabled || !code ? "default" : "pointer",
                        },
                        pressed: {
                          fill,
                          stroke: COLORS.stroke,
                          strokeWidth: 0.5,
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      )}
    </div>
  );
}

export const IndiaMap = memo(IndiaMapInner);
