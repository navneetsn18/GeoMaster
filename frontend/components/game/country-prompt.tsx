"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import type { Country } from "@/types";

interface CountryPromptProps {
  country: Country;
  totalRemaining: number;
  totalCountries: number;
}

export function CountryPrompt({
  country,
  totalRemaining,
  totalCountries,
}: CountryPromptProps) {
  return (
    <div className="flex flex-col items-center py-4 px-4 gap-3">
      <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
        Find this country
      </p>
      <AnimatePresence mode="wait">
        <motion.div
          key={country.code}
          initial={{ opacity: 0, y: -12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center gap-2"
        >
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-center">
            {country.name}
          </h2>
          <div className="relative w-14 h-10 rounded-md overflow-hidden shadow-md border border-border/50">
            <Image
              src={country.flagUrl}
              alt={`Flag of ${country.name}`}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </motion.div>
      </AnimatePresence>

      <p className="text-xs text-muted-foreground">
        {totalRemaining} of {totalCountries} remaining
      </p>
    </div>
  );
}
