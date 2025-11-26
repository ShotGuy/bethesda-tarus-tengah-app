"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Tag,
  Home,
  Users,
  BookOpen,
  Briefcase,
  CreditCard,
  Heart,
  MapPin,
  Award,
  Droplet,
  Star,
  
} from "lucide-react";
import { useState } from "react";

import { MASTER_DATASETS } from "@/constants/master-datasets";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/jemaat", label: "Jemaat", icon: Users },
  { href: "/keluarga", label: "Keluarga", icon: Home },
  // Sakramen will be a dropdown below, keep placeholder
  { href: "/jabatan", label: "Jabatan", icon: Briefcase },
];

const SAKRAMEN_ITEMS = [
  { href: "/sakramen/baptis", label: "Baptis", icon: Droplet },
  { href: "/sakramen/sidi", label: "Sidi", icon: Star },
  { href: "/sakramen/pernikahan", label: "Pernikahan", icon: Award },
];

const datasetIconMap: Record<string, any> = {
  pendidikan: BookOpen,
  pekerjaan: Briefcase,
  pendapatan: CreditCard,
  "jaminan-kesehatan": Heart,
  rayon: MapPin,
  klasis: Award,
  jabatan: Tag,
};

const WILAYAH_ITEM = {
  href: "/master-data/wilayah",
  label: "Wilayah Administratif",
  icon: MapPin,
};

export const Sidebar = () => {
  const pathname = usePathname();
  const isMasterActive = pathname?.startsWith("/master-data");
  const [sakramenOpen, setSakramenOpen] = useState(true);
  const [masterOpen, setMasterOpen] = useState(true);

  return (
    <aside className="hidden w-64 border-r bg-card p-6 lg:block">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          GMIT
        </p>
        <h1 className="text-2xl font-bold">Tarus Admin</h1>
      </div>

      <nav className="mt-10 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            href={item.href}
          >
            {item.icon ? (
              <item.icon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Tag className="h-4 w-4 text-muted-foreground" />
            )}
            <span>{item.label}</span>
          </Link>
        ))}

        {/* Sakramen dropdown */}
        <div>
          <button
            onClick={() => setSakramenOpen((v) => !v)}
            aria-expanded={sakramenOpen}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname?.startsWith("/sakramen")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            type="button"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span>Sakramen</span>
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", sakramenOpen ? "rotate-180" : "rotate-0")} />
          </button>

          {sakramenOpen && (
            <div className="mt-2 max-h-[55vh] overflow-auto pr-1">
              <div className="rounded-md bg-transparent">
                {SAKRAMEN_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      pathname === item.href || pathname === "/sakramen"
                        ? "bg-primary/80 text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Data Master dropdown */}
        <div>
          <button
            onClick={() => setMasterOpen((v) => !v)}
            aria-expanded={masterOpen}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isMasterActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            type="button"
          >
            <span className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span>Data Master</span>
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", masterOpen ? "rotate-180" : "rotate-0")} />
          </button>

          {masterOpen && (
            <div className="mt-2 max-h-[55vh] overflow-auto pr-1">
              <div className="rounded-md bg-transparent">
                {/* Wilayah Administratif item */}
                <Link
                  href={WILAYAH_ITEM.href}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    pathname === WILAYAH_ITEM.href
                      ? "bg-primary/80 text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <WILAYAH_ITEM.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{WILAYAH_ITEM.label}</span>
                </Link>

                {/* Master datasets */}
                {MASTER_DATASETS.map((dataset) => {
                  const Icon = datasetIconMap[dataset.slug] ?? Tag;
                  return (
                    <Link
                      key={dataset.slug}
                      href={`/master-data/${dataset.slug}`}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        pathname === `/master-data/${dataset.slug}`
                          ? "bg-primary/80 text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{dataset.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
};

