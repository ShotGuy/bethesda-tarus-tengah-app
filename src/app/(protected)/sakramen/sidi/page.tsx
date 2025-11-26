import SakramenModule from "@/components/modules/sakramen/sakramen-module";
import { prisma } from "@/lib/prisma";

export default async function SakramenSidiPage() {
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

  return (
    <SakramenModule
      data={{ baptis, sidi, pernikahan }}
      masters={{ jemaat, klasis }}
      initialTab="sidi"
    />
  );
}
