"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { COUNTRY_NAMES, ISO_NUMERIC_TO_ALPHA2 } from "@/lib/country-codes";
import { getFlagUrl } from "@/lib/utils";
import Image from "next/image";

// Country-specific deep-dive mode
// Shows a detail page for a specific country; deep-dive gameplay TBD.
export default function CountryDetailPage() {
  const { country } = useParams<{ country: string }>();
  const router = useRouter();

  // country param is alpha-2 code
  const name = COUNTRY_NAMES[country?.toLowerCase() ?? ""] ?? country;
  const flagUrl = country ? getFlagUrl(country) : null;

  return (
    <div className="container py-12 max-w-lg">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/dashboard">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
      </Button>

      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-5 text-center">
          {flagUrl && (
            <div className="relative w-24 h-16 rounded-lg overflow-hidden shadow-md border border-border">
              <Image
                src={flagUrl}
                alt={`Flag of ${name}`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          <div>
            <h1 className="text-3xl font-bold mb-2">{name}</h1>
            <p className="text-muted-foreground">Country code: {country?.toUpperCase()}</p>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground text-sm border border-border/50 rounded-lg p-4 bg-muted/30">
            <Construction className="w-5 h-5 shrink-0" />
            <p>
              Country-specific deep-dive game mode is coming soon. For now, try
              the World or continent modes!
            </p>
          </div>

          <div className="flex gap-3 flex-wrap justify-center">
            <Button asChild>
              <Link href="/play/world">Play World Mode</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
