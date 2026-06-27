"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { ArrowRight, ChevronDown } from "lucide-react";
import { getToken } from "@/lib/auth";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const COUNTRY_IDS = [
  "004","008","012","024","032","036","040","050","056","068","076","100","104","116",
  "120","124","144","152","156","170","178","192","203","208","218","231","246","250",
  "276","288","300","320","332","340","356","360","376","380","392","400","404","410",
  "442","484","504","516","524","528","554","566","578","586","598","604","608","616",
  "620","642","643","682","706","710","724","752","756","764","788","792","800","804",
  "826","834","840","858","862","894",
];

const FLOAT_COUNTRIES = [
  "🇫🇷 France +120", "🇧🇷 Brazil +95", "🇯🇵 Japan +110", "🇮🇳 India +130",
  "🇰🇪 Kenya +85", "🇦🇺 Australia +100", "🇲🇽 Mexico +90", "🇩🇪 Germany +115",
  "🇦🇷 Argentina +88", "🇳🇴 Norway +102", "🇨🇳 China +125", "🇵🇹 Portugal +95",
  "🇺🇸 USA +140", "🇷🇺 Russia +108", "🇨🇦 Canada +112", "🇮🇹 Italy +98",
  "🇪🇸 Spain +92", "🇬🇧 UK +118", "🇹🇷 Turkey +87", "🇿🇦 South Africa +96",
  "🇳🇬 Nigeria +78", "🇪🇬 Egypt +84", "🇹🇭 Thailand +91", "🇰🇷 South Korea +105",
  "🇵🇰 Pakistan +82", "🇸🇦 Saudi Arabia +93", "🇮🇩 Indonesia +89", "🇵🇭 Philippines +76",
  "🇻🇳 Vietnam +83", "🇳🇿 New Zealand +101", "🇨🇭 Switzerland +116", "🇸🇪 Sweden +107",
  "🇵🇱 Poland +88", "🇺🇦 Ukraine +79", "🇳🇱 Netherlands +103", "🇧🇪 Belgium +94",
  "🇦🇹 Austria +98", "🇬🇷 Greece +86", "🇨🇿 Czechia +91", "🇭🇺 Hungary +77",
  "🇷🇴 Romania +83", "🇨🇴 Colombia +89", "🇨🇱 Chile +94", "🇵🇪 Peru +81",
  "🇲🇦 Morocco +86", "🇹🇳 Tunisia +80", "🇬🇭 Ghana +75", "🇸🇳 Senegal +72",
  "🇱🇰 Sri Lanka +88", "🇧🇩 Bangladesh +79", "🇳🇵 Nepal +83", "🇲🇳 Mongolia +90",
];

const BUBBLE_COLORS = [
  "bg-green-500/85 shadow-green-500/30",
  "bg-indigo-500/85 shadow-indigo-500/30",
  "bg-violet-500/85 shadow-violet-500/30",
  "bg-sky-500/85 shadow-sky-500/30",
  "bg-emerald-500/85 shadow-emerald-500/30",
  "bg-teal-500/85 shadow-teal-500/30",
];

// Planes: dir 1 = left→right, -1 = right→left
const PLANES = [
  { id: 1, top: "12%",  dur: 18, delay: 0,  dir: 1,  size: 26, opacity: 0.65 },
  { id: 2, top: "30%",  dur: 26, delay: 5,  dir: -1, size: 20, opacity: 0.45 },
  { id: 3, top: "52%",  dur: 21, delay: 9,  dir: 1,  size: 30, opacity: 0.55 },
  { id: 4, top: "68%",  dur: 32, delay: 2,  dir: -1, size: 18, opacity: 0.40 },
  { id: 5, top: "22%",  dur: 24, delay: 14, dir: 1,  size: 22, opacity: 0.50 },
  { id: 6, top: "78%",  dur: 28, delay: 7,  dir: -1, size: 24, opacity: 0.35 },
];

const MODES = [
  { emoji: "🌍", label: "World",          sub: "All 195 countries",    href: "/play/world",          bg: "from-indigo-600 to-violet-600" },
  { emoji: "🌍", label: "Africa",         sub: "54 countries",          href: "/play/continent/africa", bg: "from-orange-500 to-rose-600" },
  { emoji: "🌏", label: "Asia",           sub: "48 countries",          href: "/play/continent/asia",   bg: "from-emerald-500 to-teal-600" },
  { emoji: "🌍", label: "Europe",         sub: "44 countries",          href: "/play/continent/europe", bg: "from-blue-500 to-cyan-600" },
  { emoji: "🌎", label: "Americas",       sub: "35 countries",          href: "/play/continent/americas", bg: "from-yellow-500 to-orange-600" },
  { emoji: "🇮🇳", label: "India States",  sub: "36 states & UTs",       href: "/play/india",            bg: "from-orange-400 to-green-500" },
  { emoji: "🏛️", label: "World Capitals", sub: "Name the capital city", href: "/play/world-capitals",   bg: "from-purple-500 to-pink-600" },
  { emoji: "🇮🇳", label: "India Capitals",sub: "State capital quiz",    href: "/play/india-capitals",   bg: "from-rose-500 to-purple-600" },
];

const STEPS = [
  { n: "01", title: "Pick a Mode",    desc: "World, continents, India states or capitals — pick your poison." },
  { n: "02", title: "Click the Map",  desc: "See the country name, find it on the map. Faster = more points." },
  { n: "03", title: "Flex on Friends",desc: "Climb leaderboards. Follow rivals. Become the geography king." },
];

interface BubbleItem { id: number; text: string; x: number; bottom: number; color: string; }

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
    const id = setInterval(flash, 900);
    return () => clearInterval(id);
  }, []);

  return (
    <ComposableMap
      width={980}
      height={520}
      projectionConfig={{ scale: 175, center: [10, 15] }}
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
                    fill: isLit ? "#22c55e" : "#1a2d4e",
                    stroke: "#080f1e",
                    strokeWidth: 0.6,
                    outline: "none",
                    transition: "fill 0.4s ease",
                  },
                  hover:   { fill: "#1a2d4e", outline: "none" },
                  pressed: { fill: "#1a2d4e", outline: "none" },
                }}
              />
            );
          })
        }
      </Geographies>
    </ComposableMap>
  );
}

function FloatingBubbles() {
  const [items, setItems] = useState<BubbleItem[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    const spawn = () => ({
      id: counter.current++,
      text: FLOAT_COUNTRIES[Math.floor(Math.random() * FLOAT_COUNTRIES.length)],
      x: 4 + Math.random() * 88,
      bottom: 5 + Math.random() * 70,
      color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
    });

    // Pre-populate so screen isn't empty on load
    setItems(Array.from({ length: 8 }, spawn));

    const id = setInterval(() => {
      setItems(prev => [...prev.slice(-18), spawn()]);
    }, 700);
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

function FlyingPlanes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {PLANES.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: p.dir === 1 ? "-80px" : "110vw" }}
          animate={{ x: p.dir === 1 ? "110vw" : "-80px" }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "linear", repeatDelay: 6 }}
          style={{
            position: "absolute",
            top: p.top,
            opacity: p.opacity,
            fontSize: p.size,
            transform: p.dir === -1 ? "scaleX(-1)" : undefined,
            filter: "drop-shadow(0 0 8px rgba(255,255,255,0.3))",
          }}
        >
          ✈️
        </motion.div>
      ))}
    </div>
  );
}

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
    <div className="bg-[#080f1e] text-white overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

        {/* Map bleeds to all edges */}
        <div className="absolute inset-0" style={{ margin: "-2px" }}>
          <AnimatedMap />
        </div>

        {/* Vignette — stronger on sides so text pops */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080f1e]/70 via-[#080f1e]/20 to-[#080f1e]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080f1e]/60 via-transparent to-[#080f1e]/60" />

        {/* Floating country score bubbles */}
        <FloatingBubbles />

        {/* Flying planes */}
        <FlyingPlanes />

        {/* Hero content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-7xl mb-6 inline-block select-none"
          >
            🌍
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-6"
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
            className="text-xl md:text-2xl text-white/60 max-w-xl mx-auto mb-10 leading-relaxed"
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
                className="bg-green-500 hover:bg-green-400 text-black font-black text-lg px-10 py-4 rounded-2xl flex items-center gap-2 transition-colors"
              >
                Play Free <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="border-2 border-white/20 hover:border-white/50 text-white font-bold text-lg px-10 py-4 rounded-2xl transition-colors backdrop-blur-sm"
              >
                Log In
              </motion.button>
            </Link>
          </motion.div>
        </div>

        {/* Scroll hint */}
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
      <section className="border-y border-white/10 bg-white/5 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { n: 195, s: "",  label: "Countries",        emoji: "🌍" },
              { n: 8,   s: "",  label: "Game Modes",       emoji: "🎮" },
              { n: 36,  s: "",  label: "India States & UTs", emoji: "🇮🇳" },
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
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-green-400 font-bold tracking-widest uppercase text-sm mb-3">Choose Your Arena</p>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight">Pick your challenge</h2>
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
                    className={`relative overflow-hidden rounded-2xl p-6 h-44 flex flex-col justify-between cursor-pointer bg-gradient-to-br ${mode.bg} shadow-xl`}
                  >
                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                    <span className="text-4xl">{mode.emoji}</span>
                    <div>
                      <p className="font-black text-lg leading-tight">{mode.label}</p>
                      <p className="text-white/70 text-xs mt-0.5">{mode.sub}</p>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-white/10">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-green-400 font-bold tracking-widest uppercase text-sm mb-3">Simple Rules</p>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight">How it works</h2>
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
      <section className="py-32 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-indigo-500/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-green-500/10 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-3xl mx-auto"
        >
          <div className="text-6xl mb-6">🏆</div>
          <h2 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
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

      <footer className="border-t border-white/10 py-8 text-center text-white/30 text-sm">
        <p>GeoMaster © 2026 — Learn the world, one click at a time.</p>
      </footer>
    </div>
  );
}
