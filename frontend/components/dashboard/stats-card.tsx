"use client";

import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  trend?: string;
  delay?: number;
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  iconColor = "text-primary",
  trend,
  delay = 0,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="relative overflow-hidden group hover:border-primary/40 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardContent className="p-5 relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">{label}</p>
              <p className="text-3xl font-bold mt-1 tracking-tight">{value}</p>
              {trend && (
                <p className="text-xs text-green-400 mt-1 font-medium">{trend}</p>
              )}
            </div>
            <div
              className={cn(
                "w-10 h-10 rounded-xl bg-muted flex items-center justify-center",
                iconColor
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
