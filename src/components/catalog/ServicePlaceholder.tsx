import { Home, BedDouble, Layers, Droplets, ChefHat, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type CategoryConfig = {
  icon: LucideIcon;
  gradient: string;
  blob: string;
};

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  "kebersihan-unit": {
    icon: Home,
    gradient: "from-blue-600 via-blue-700 to-blue-900",
    blob: "bg-blue-400/25",
  },
  "kasur-sprei": {
    icon: BedDouble,
    gradient: "from-indigo-500 via-indigo-600 to-blue-800",
    blob: "bg-indigo-300/25",
  },
  "karpet-lantai": {
    icon: Layers,
    gradient: "from-cyan-600 via-cyan-700 to-blue-800",
    blob: "bg-cyan-300/25",
  },
  "kamar-mandi": {
    icon: Droplets,
    gradient: "from-sky-500 via-sky-600 to-cyan-800",
    blob: "bg-sky-300/25",
  },
  "dapur": {
    icon: ChefHat,
    gradient: "from-blue-500 via-indigo-600 to-indigo-800",
    blob: "bg-indigo-400/25",
  },
};

const DEFAULT_CONFIG: CategoryConfig = {
  icon: Sparkles,
  gradient: "from-blue-600 via-blue-700 to-cyan-800",
  blob: "bg-cyan-400/25",
};

interface Props {
  categorySlug?: string | null;
  serviceName: string;
}

export function ServicePlaceholder({ categorySlug, serviceName }: Props) {
  const config = categorySlug ? (CATEGORY_CONFIG[categorySlug] ?? DEFAULT_CONFIG) : DEFAULT_CONFIG;
  const Icon = config.icon;

  const label = serviceName.split(" ").slice(0, 2).join(" ");

  return (
    <div
      className={`w-full h-full bg-gradient-to-br ${config.gradient} flex items-center justify-center relative overflow-hidden`}
    >
      {/* Decorative blobs */}
      <div className={`absolute -top-10 -right-10 w-36 h-36 rounded-full ${config.blob} blur-2xl pointer-events-none`} />
      <div className={`absolute -bottom-10 -left-10 w-28 h-28 rounded-full ${config.blob} blur-xl pointer-events-none`} />

      {/* Icon card */}
      <div className="relative flex flex-col items-center gap-2.5 z-10">
        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20 shadow-inner">
          <Icon className="w-10 h-10 text-white" strokeWidth={1.5} />
        </div>
        <span className="text-white/60 text-[10px] font-semibold tracking-widest uppercase">
          {label}
        </span>
      </div>
    </div>
  );
}
