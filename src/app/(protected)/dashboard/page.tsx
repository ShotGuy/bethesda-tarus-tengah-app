type DashboardSummary = {
  success: boolean;
  data: {
    jemaat: number;
    keluarga: number;
    baptis: number;
    pernikahan: number;
  };
};

const cards = [
  { key: "jemaat", label: "Total Jemaat" },
  { key: "keluarga", label: "Total Keluarga" },
  { key: "baptis", label: "Data Baptis" },
  { key: "pernikahan", label: "Data Pernikahan" },
] as const;

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [jemaat, keluarga, baptis, pernikahan] = await Promise.all([
    prisma.jemaat.count(),
    prisma.keluarga.count(),
    prisma.baptis.count(),
    prisma.pernikahan.count(),
  ]);

  const summary: DashboardSummary = {
    success: true,
    data: {
      jemaat,
      keluarga,
      baptis,
      pernikahan,
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Ringkasan data utama jemaat GMIT Tarus.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.key} className="rounded-xl border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-3xl font-bold">
              {summary.data?.[card.key] ?? 0}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

