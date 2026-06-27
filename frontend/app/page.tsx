"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Globe, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getToken } from "@/lib/auth";

const features = [
  {
    icon: Globe,
    title: "195 Countries",
    desc: "Click on every country in the world — from tiny island nations to vast continents.",
  },
  {
    icon: Zap,
    title: "Beat the Clock",
    desc: "Race against time and build streaks to multiply your score.",
  },
  {
    icon: Trophy,
    title: "Leaderboards",
    desc: "Compete globally or follow players to see who knows geography best.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.replace("/dashboard");
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute top-40 left-10 w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-[100px]" />
        <div className="absolute top-60 right-10 w-[500px] h-[400px] rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      {/* Hero */}
      <section className="container flex flex-col items-center text-center pt-24 pb-20 gap-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-8xl mb-2 animate-pulse-glow"
        >
          🌍
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight"
        >
          Learn the World,
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            One Country at a Time
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-muted-foreground max-w-2xl"
        >
          GeoMaster challenges you to click every country on a real interactive
          world map. Build streaks, unlock achievements, and climb the
          leaderboards.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Button size="xl" asChild className="glow-indigo">
            <Link href="/signup">
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
          <Button size="xl" variant="outline" asChild>
            <Link href="/login">Log In</Link>
          </Button>
        </motion.div>

        {/* Social proof */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-sm text-muted-foreground"
        >
          Join thousands of geography enthusiasts worldwide
        </motion.p>
      </section>

      {/* Features grid */}
      <section className="container pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
              className="group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/50 hover:bg-card transition-all duration-300"
            >
              {/* Glow on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="border-t border-border/50 bg-card/30">
        <div className="container py-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold">Ready to test your geography?</h2>
            <p className="text-muted-foreground mt-1">
              Free to play. No credit card required.
            </p>
          </div>
          <Button size="xl" asChild className="shrink-0">
            <Link href="/signup">
              Start Playing Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
