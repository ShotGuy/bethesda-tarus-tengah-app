import JemaatJabatanModule from "@/components/modules/jabatan/jemaat-jabatan-module";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function JabatanPage() {
  const [assignments, jemaat, jabatan] = await Promise.all([
    prisma.jemaatJabatan.findMany({
      orderBy: { tanggalMulai: "desc" },
      include: {
        jabatan: true,
      },
    }),
    prisma.jemaat.findMany({
      orderBy: { nama: "asc" },
      select: {
        idJemaat: true,
        nama: true,
      },
      take: 200,
    }),
    prisma.jabatan.findMany({ orderBy: { namaJabatan: "asc" } }),
  ]);

  const serializedAssignments = assignments.map((a: any) => ({
    ...a,
    tanggalMulai: a.tanggalMulai instanceof Date ? a.tanggalMulai.toISOString() : String(a.tanggalMulai),
    tanggalBerakhir: a.tanggalBerakhir
      ? a.tanggalBerakhir instanceof Date
        ? a.tanggalBerakhir.toISOString()
        : String(a.tanggalBerakhir)
      : null,
  }));

  return (
    <JemaatJabatanModule
      initialData={serializedAssignments}
      masters={{
        jemaat,
        jabatan,
      }}
    />
  );
}

