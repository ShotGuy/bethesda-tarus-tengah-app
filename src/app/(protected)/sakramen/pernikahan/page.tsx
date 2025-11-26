import SakramenModule from "@/components/modules/sakramen/sakramen-module";
import { prisma } from "@/lib/prisma";

export default async function SakramenPernikahanPage() {
  const [baptis, sidi, pernikahan, jemaat, klasis] = await Promise.all([
    prisma.baptis.findMany({
      orderBy: { tanggal: "desc" },
      include: { jemaat: { select: { idJemaat: true, nama: true } }, klasis: true },
    }),
    prisma.sidi.findMany({
      orderBy: { tanggal: "desc" },
      include: { jemaat: { select: { idJemaat: true, nama: true } }, klasis: true },
    }),
    prisma.pernikahan.findMany({
      orderBy: { tanggal: "desc" },
      include: { jemaats: { select: { idJemaat: true, nama: true } } },
    }),
    prisma.jemaat.findMany({ orderBy: { nama: "asc" }, select: { idJemaat: true, nama: true }, take: 200 }),
    prisma.klasis.findMany({ orderBy: { nama: "asc" } }),
  ]);

  const serializeDate = (d: any) => (d instanceof Date ? d.toISOString() : String(d));

  const serializedBaptis = baptis.map((b) => ({ ...b, tanggal: serializeDate(b.tanggal) }));
  const serializedSidi = sidi.map((s) => ({ ...s, tanggal: serializeDate(s.tanggal) }));
  const serializedPernikahan = pernikahan.map((p) => ({ ...p, tanggal: serializeDate(p.tanggal) }));

  return (
    <SakramenModule
      data={{ baptis: serializedBaptis, sidi: serializedSidi, pernikahan: serializedPernikahan }}
      masters={{ jemaat, klasis }}
      initialTab="pernikahan"
    />
  );
}
