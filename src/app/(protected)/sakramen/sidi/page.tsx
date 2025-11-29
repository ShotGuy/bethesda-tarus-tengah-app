import SakramenClientPage from "../client-page";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SakramenSidiPage() {
  const [baptis, sidi, pernikahan, jemaat, klasis] = await Promise.all([
    prisma.baptis.findMany({
      orderBy: { tanggal: "desc" },
      include: {
        jemaat: { select: { idJemaat: true, nama: true } },
        klasis: true,
      },
    }),
    prisma.sidi.findMany({
      orderBy: { tanggal: "desc" },
      include: { jemaat: { select: { idJemaat: true, nama: true } }, klasis: true },
    }),
    prisma.pernikahan.findMany({
      orderBy: { tanggal: "desc" },
      include: { jemaats: { select: { idJemaat: true, nama: true } } },
    }),
    prisma.jemaat.findMany({ orderBy: { nama: "asc" }, take: 1000 }).then((items) =>
      items.map((item) => ({
        idJemaat: item.idJemaat,
        nama: item.nama,
        jenisKelamin: item.jenisKelamin,
      }))
    ),
    prisma.klasis.findMany({ orderBy: { nama: "asc" } }),
  ]);
  const serializeDate = (d: any) => (d instanceof Date ? d.toISOString() : String(d));

  const serializedBaptis = baptis.map((b: any) => ({
    ...b,
    tanggal: serializeDate(b.tanggal),
  }));

  const serializedSidi = sidi.map((s: any) => ({
    ...s,
    tanggal: serializeDate(s.tanggal),
  }));

  const serializedPernikahan = pernikahan.map((p: any) => ({
    ...p,
    tanggal: serializeDate(p.tanggal),
  }));

  return (
    <SakramenClientPage
      initialData={{ baptis: serializedBaptis, sidi: serializedSidi, pernikahan: serializedPernikahan }}
      masters={{ jemaat, klasis }}
      initialTab="sidi"
    />
  );
}
