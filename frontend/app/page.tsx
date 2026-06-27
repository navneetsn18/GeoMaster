"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { ArrowRight, ChevronDown } from "lucide-react";
import { getToken } from "@/lib/auth";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ── Projection helpers (matches ComposableMap params below) ──────────────────
const MAP_W = 980, MAP_H = 520, SCALE = 175;
const CENTER_LON = 10, CENTER_LAT = 15;
const PX_PER_DEG = SCALE * Math.PI / 180;
const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const CENTER_MY = mercY(CENTER_LAT);

function project(lon: number, lat: number): [number, number] {
  const x = MAP_W / 2 + PX_PER_DEG * (lon - CENTER_LON);
  const y = MAP_H / 2 - SCALE * (mercY(lat) - CENTER_MY);
  return [x, y];
}

function arcD(lon1: number, lat1: number, lon2: number, lat2: number) {
  const [x1, y1] = project(lon1, lat1);
  const [x2, y2] = project(lon2, lat2);
  const cx = (x1 + x2) / 2;
  const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const cy = (y1 + y2) / 2 - dist * 0.42;
  return { d: `M${x1.toFixed(1)},${y1.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`, x1, y1, x2, y2 };
}

// Route: [lon, lat] pairs + animation params
const ROUTES = [
  { id: "a", from: [-0.12, 51.5],  to: [-74, 40.7],    dur: 5,   delay: 0    }, // London → NYC
  { id: "b", from: [139.7, 35.7],  to: [55.3, 25.2],   dur: 6,   delay: 1.5  }, // Tokyo → Dubai
  { id: "c", from: [72.8, 19.0],   to: [-0.12, 51.5],  dur: 7,   delay: 0.8  }, // Mumbai → London
  { id: "d", from: [-46.6, -23.5], to: [-74, 40.7],    dur: 5.5, delay: 2.5  }, // São Paulo → NYC
  { id: "e", from: [151.2, -33.9], to: [103.8, 1.3],   dur: 4.5, delay: 3.2  }, // Sydney → Singapore
  { id: "f", from: [-118.2, 34.0], to: [139.7, 35.7],  dur: 8,   delay: 1.0  }, // LA → Tokyo
  { id: "g", from: [2.3, 48.9],    to: [37.6, 55.8],   dur: 4,   delay: 0.3  }, // Paris → Moscow
  { id: "h", from: [28.0, -26.2],  to: [3.4, 6.4],     dur: 5,   delay: 4.0  }, // Joburg → Abuja
  { id: "i", from: [-99.1, 19.4],  to: [-0.12, 51.5],  dur: 7.5, delay: 2.0  }, // Mexico → London
  { id: "j", from: [103.8, 1.3],   to: [55.3, 25.2],   dur: 4.5, delay: 5.0  }, // Singapore → Dubai
];

const COUNTRY_IDS = [
  "004","008","012","024","032","036","040","050","056","068","076","100","104","116",
  "120","124","144","152","156","170","178","192","203","208","218","231","246","250",
  "276","288","300","320","332","340","356","360","376","380","392","400","404","410",
  "442","484","504","516","524","528","554","566","578","586","598","604","608","616",
  "620","642","643","682","706","710","724","752","756","764","788","792","800","804",
  "826","834","840","858","862","894",
];

// Scores (not phone codes — pts suffix)
const FLOAT_BUBBLES = [
  "🇫🇷 France 120pts", "🇧🇷 Brazil 95pts",  "🇯🇵 Japan 110pts",  "🇮🇳 India 130pts",
  "🇰🇪 Kenya 85pts",   "🇦🇺 Australia 100pts","🇲🇽 Mexico 90pts", "🇩🇪 Germany 115pts",
  "🇦🇷 Argentina 88pts","🇳🇴 Norway 102pts", "🇨🇳 China 125pts",  "🇵🇹 Portugal 95pts",
  "🇺🇸 USA 140pts",    "🇷🇺 Russia 108pts",  "🇨🇦 Canada 112pts", "🇮🇹 Italy 98pts",
  "🇪🇸 Spain 92pts",   "🇬🇧 UK 118pts",      "🇹🇷 Turkey 87pts",  "🇿🇦 S.Africa 96pts",
  "🇳🇬 Nigeria 78pts", "🇪🇬 Egypt 84pts",    "🇹🇭 Thailand 91pts","🇰🇷 S.Korea 105pts",
  "🇵🇰 Pakistan 82pts","🇸🇦 Saudi 93pts",    "🇮🇩 Indonesia 89pts","🇵🇭 Philippines 76pts",
  "🇻🇳 Vietnam 83pts", "🇳🇿 N.Zealand 101pts","🇨🇭 Switzerland 116pts","🇸🇪 Sweden 107pts",
  "🇵🇱 Poland 88pts",  "🇺🇦 Ukraine 79pts",  "🇳🇱 Netherlands 103pts","🇧🇪 Belgium 94pts",
  "🇬🇷 Greece 86pts",  "🇨🇴 Colombia 89pts", "🇲🇦 Morocco 86pts", "🇱🇰 Sri Lanka 88pts",
  "🇳🇵 Nepal 83pts",   "🇲🇳 Mongolia 90pts", "🇨🇱 Chile 94pts",   "🇵🇪 Peru 81pts",
];

const BUBBLE_COLORS = [
  "bg-green-500/80 shadow-green-500/20",
  "bg-indigo-500/80 shadow-indigo-500/20",
  "bg-violet-500/80 shadow-violet-500/20",
  "bg-sky-500/80 shadow-sky-500/20",
  "bg-teal-500/80 shadow-teal-500/20",
  "bg-emerald-600/80 shadow-emerald-500/20",
];

const MODES = [
  { emoji: "🌍", label: "World",          sub: "All 195 countries",    href: "/play/world",            bg: "from-indigo-600 to-violet-600" },
  { emoji: "🌍", label: "Africa",         sub: "54 countries",          href: "/play/continent/africa", bg: "from-orange-500 to-rose-600"   },
  { emoji: "🌏", label: "Asia",           sub: "48 countries",          href: "/play/continent/asia",   bg: "from-emerald-500 to-teal-600"  },
  { emoji: "🌍", label: "Europe",         sub: "44 countries",          href: "/play/continent/europe", bg: "from-blue-500 to-cyan-600"     },
  { emoji: "🌎", label: "Americas",       sub: "35 countries",          href: "/play/continent/americas",bg:"from-yellow-500 to-orange-600" },
  { emoji: "🇮🇳", label: "India States",  sub: "36 states & UTs",       href: "/play/india",            bg: "from-orange-400 to-green-500"  },
  { emoji: "🏛️", label: "World Capitals", sub: "Name the capital city", href: "/play/world-capitals",   bg: "from-purple-500 to-pink-600"   },
  { emoji: "🇮🇳", label: "India Capitals",sub: "State capital quiz",    href: "/play/india-capitals",   bg: "from-rose-500 to-purple-600"   },
];

const STEPS = [
  { n: "01", title: "Pick a Mode",    desc: "World, continents, India states or capitals — pick your poison." },
  { n: "02", title: "Click the Map",  desc: "See the country name, find it on the map. Faster = more points." },
  { n: "03", title: "Flex on Friends",desc: "Climb leaderboards. Follow rivals. Become the geography king." },
];

interface BubbleItem { id: number; text: string; x: number; bottom: number; color: string; }

// ── Flight arcs (SVG inside ComposableMap) ───────────────────────────────────
function FlightArcs() {
  return (
    <g>
      {ROUTES.map((r) => {
        const arc = arcD(r.from[0], r.from[1], r.to[0], r.to[1]);
        const pathId = `fp-${r.id}`;
        return (
          <g key={r.id}>
            {/* Faint route ghost */}
            <path
              d={arc.d}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
              strokeDasharray="3 6"
            />
            {/* Glowing arc that draws in then fades */}
            <path
              d={arc.d}
              fill="none"
              stroke="rgba(99,179,237,0.5)"
              strokeWidth="1.2"
              strokeLinecap="round"
            >
              <animate
                attributeName="stroke-dasharray"
                values="0,1000;400,1000;0,1000"
                dur={`${r.dur}s`}
                begin={`${r.delay}s`}
                repeatCount="indefinite"
                calcMode="spline"
                keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
              />
              <animate
                attributeName="stroke-dashoffset"
                values="0;-400"
                dur={`${r.dur}s`}
                begin={`${r.delay}s`}
                repeatCount="indefinite"
                calcMode="linear"
              />
            </path>
            {/* Moving dot */}
            <path id={pathId} d={arc.d} fill="none" />
            <circle r="2.8" fill="white" fillOpacity="0.9">
              <animateMotion
                dur={`${r.dur}s`}
                begin={`${r.delay}s`}
                repeatCount="indefinite"
                rotate="auto"
              >
                <mpath href={`#${pathId}`} />
              </animateMotion>
              <animate
                attributeName="r"
                values="2.8;3.8;2.8"
                dur="1.2s"
                repeatCount="indefinite"
              />
            </circle>
            {/* Trailing glow dot */}
            <circle r="5" fill="rgba(99,179,237,0.25)">
              <animateMotion
                dur={`${r.dur}s`}
                begin={`${r.delay}s`}
                repeatCount="indefinite"
              >
                <mpath href={`#${pathId}`} />
              </animateMotion>
            </circle>
            {/* Origin pulse */}
            <circle
              cx={arc.x1.toFixed(1)}
              cy={arc.y1.toFixed(1)}
              r="3"
              fill="rgba(34,197,94,0.6)"
            >
              <animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite" />
              <animate attributeName="fill-opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle
              cx={arc.x1.toFixed(1)}
              cy={arc.y1.toFixed(1)}
              r="2"
              fill="#22c55e"
              fillOpacity="0.9"
            />
            {/* Destination pulse */}
            <circle
              cx={arc.x2.toFixed(1)}
              cy={arc.y2.toFixed(1)}
              r="2"
              fill="rgba(251,146,60,0.9)"
            >
              <animate attributeName="r" values="2;5;2" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="fill-opacity" values="0.8;0;0.8" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <circle
              cx={arc.x2.toFixed(1)}
              cy={arc.y2.toFixed(1)}
              r="1.8"
              fill="#fb923c"
              fillOpacity="0.9"
            />
          </g>
        );
      })}
    </g>
  );
}

// ── Translucent world map + flight arcs ──────────────────────────────────────
function AnimatedMap() {
  const [lit, setLit] = useState<Set<string>>(new Set());

  useEffect(() => {
    const flash = () => {
      const picks = new Set<string>();
      const count = 8 + Math.floor(Math.random() * 8);
      while (picks.size < count) picks.add(COUNTRY_IDS[Math.floor(Math.random() * COUNTRY_IDS.length)]);
      setLit(picks);
    };
    flash();
    const id = setInterval(flash, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <ComposableMap
      width={MAP_W}
      height={MAP_H}
      projectionConfig={{ scale: SCALE, center: [CENTER_LON, CENTER_LAT] }}
      style={{ width: "100%", height: "100%" }}
    >
      <Geographies geography={GEO_URL}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const isLit = lit.has(geo.id as string);
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default: {
                    fill: isLit ? "rgba(34,197,94,0.88)" : "rgba(15,35,72,0.78)",
                    stroke: "rgba(255,255,255,0.13)",
                    strokeWidth: 0.6,
                    outline: "none",
                    transition: "fill 0.5s ease",
                  },
                  hover:   { fill: "rgba(15,35,72,0.78)", outline: "none" },
                  pressed: { fill: "rgba(15,35,72,0.78)", outline: "none" },
                }}
              />
            );
          })
        }
      </Geographies>
      <FlightArcs />
    </ComposableMap>
  );
}

// ── Floating score bubbles ───────────────────────────────────────────────────
function FloatingBubbles() {
  const [items, setItems] = useState<BubbleItem[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    const spawn = (): BubbleItem => ({
      id: counter.current++,
      text: FLOAT_BUBBLES[Math.floor(Math.random() * FLOAT_BUBBLES.length)],
      x: 4 + Math.random() * 88,
      bottom: 5 + Math.random() * 70,
      color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
    });
    setItems(Array.from({ length: 8 }, spawn));
    const id = setInterval(() => setItems(prev => [...prev.slice(-18), spawn()]), 700);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence>
        {items.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], y: -160, scale: 1 }}
            transition={{ duration: 3.2, ease: "easeOut" }}
            style={{ left: `${item.x}%`, bottom: `${item.bottom}%` }}
            className={`absolute ${item.color} shadow-lg backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap`}
          >
            {item.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── Animated stat counter ────────────────────────────────────────────────────
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let cur = 0;
    const step = Math.ceil(target / 40);
    const id = setInterval(() => {
      cur += step;
      if (cur >= target) { setVal(target); clearInterval(id); }
      else setVal(cur);
    }, 30);
    return () => clearInterval(id);
  }, [inView, target]);

  return <span ref={ref}>{val}{suffix}</span>;
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (getToken()) router.replace("/dashboard");
    else setChecked(true);
  }, [router]);

  if (!checked) return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    // Transparent — Aurora from layout bleeds through everywhere
    <div className="text-white overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

        {/* Layer 1: dim Aurora to ~20% so it peeks through map gaps only */}
        <div className="absolute inset-0 bg-[#07101f]/80" />

        {/* Layer 2: map — opaque countries sit visually in front of Aurora */}
        <div className="absolute inset-0" style={{ margin: "-2px" }}>
          <AnimatedMap />
        </div>

        {/* Layer 3: soft vignette for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

        {/* Country score bubbles */}
        <FloatingBubbles />

        {/* Hero text */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-5xl sm:text-7xl mb-4 sm:mb-6 inline-block select-none"
          >
            🌍
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-5 sm:mb-6"
          >
            How well do you{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
              know
            </span>
            <br />the world?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-base sm:text-xl md:text-2xl text-white/60 max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed"
          >
            Click countries. Beat streaks. Flex on the leaderboard.
            <br />No passport required.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(34,197,94,0.45)" }}
                whileTap={{ scale: 0.97 }}
                className="bg-green-500 hover:bg-green-400 text-black font-black text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 rounded-2xl flex items-center gap-2 transition-colors"
              >
                Play Free <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="border-2 border-white/20 hover:border-white/50 text-white font-bold text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 rounded-2xl transition-colors backdrop-blur-sm"
              >
                Log In
              </motion.button>
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30 text-xs"
        >
          <span>Scroll to explore</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────── */}
      <section className="border-y border-white/10 bg-black/40 backdrop-blur-md py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { n: 195, s: "",  label: "Countries",        emoji: "🌍" },
              { n: 8,   s: "",  label: "Game Modes",       emoji: "🎮" },
              { n: 36,  s: "",  label: "India States & UTs",emoji:"🇮🇳" },
              { n: 100, s: "%", label: "Free to Play",     emoji: "🔥" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-3xl">{stat.emoji}</span>
                <span className="text-4xl font-black text-white">
                  <Counter target={stat.n} suffix={stat.s} />
                </span>
                <span className="text-sm text-white/50 font-medium">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODES ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-black/25 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-green-400 font-bold tracking-widest uppercase text-sm mb-3">Choose Your Arena</p>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight">Pick your challenge</h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {MODES.map((mode, i) => (
              <motion.div
                key={mode.label}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <Link href={mode.href}>
                  <motion.div
                    whileHover={{ scale: 1.04, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    className={`relative overflow-hidden rounded-2xl p-4 sm:p-6 min-h-[140px] sm:min-h-[176px] flex flex-col justify-between cursor-pointer bg-gradient-to-br ${mode.bg} shadow-xl`}
                  >
                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                    <span className="text-3xl sm:text-4xl">{mode.emoji}</span>
                    <div>
                      <p className="font-black text-sm sm:text-lg leading-tight">{mode.label}</p>
                      <p className="text-white/70 text-xs mt-0.5 hidden sm:block">{mode.sub}</p>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-white/10 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-green-400 font-bold tracking-widest uppercase text-sm mb-3">Simple Rules</p>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight">How it works</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                <div className="text-8xl font-black text-white/5 leading-none mb-4 select-none">{step.n}</div>
                <div className="-mt-8">
                  <h3 className="text-2xl font-black mb-3">{step.title}</h3>
                  <p className="text-white/50 leading-relaxed">{step.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-10 -right-4 text-white/20 text-2xl">→</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────── */}
      <section className="py-32 px-4 text-center relative overflow-hidden bg-black/20 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/8 via-transparent to-indigo-500/8" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-green-500/8 rounded-full blur-[120px] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-3xl mx-auto"
        >
          <div className="text-6xl mb-6">🏆</div>
          <h2 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
            Your geography
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
              journey starts here.
            </span>
          </h2>
          <p className="text-white/50 text-xl mb-10">Free forever. No credit card. Just geography.</p>
          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.06, boxShadow: "0 0 60px rgba(34,197,94,0.5)" }}
              whileTap={{ scale: 0.96 }}
              className="bg-green-500 hover:bg-green-400 text-black font-black text-xl px-14 py-5 rounded-2xl inline-flex items-center gap-3 transition-colors"
            >
              Start Playing Now <ArrowRight className="w-6 h-6" />
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/40 backdrop-blur-md py-8 text-center text-white/30 text-sm">
        <p className="mb-1">GeoMaster © 2026 — Learn the world, one click at a time.</p>
        <p>
          Made with ❤️ by{" "}
          <a
            href="https://github.com/navneetsn18"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-white transition-colors underline underline-offset-2"
          >
            @navneetsn18
          </a>
        </p>
      </footer>
    </div>
  );
}
