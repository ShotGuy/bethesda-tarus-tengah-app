import SakramenClientPage from "./client-page";
import { prisma } from "@/lib/prisma";
import { getKlasis } from "@/lib/cached-data";

export const dynamic = "force-dynamic";

export default async function SakramenPage() {
  const [baptis, sidi, pernikahan, jemaat, klasis] = await Promise.all([
    prisma.baptis.findMany({
      orderBy: { tanggal: "desc" },
      include: {
        jemaat: {
          select: {
            idJemaat: true,
            nama: true,
          },
        },
        klasis: true,
      },
    }),
    prisma.sidi.findMany({
      orderBy: { tanggal: "desc" },
      include: {
        jemaat: {
          select: {
            idJemaat: true,
            nama: true,
          },
        },
        klasis: true,
      },
    }),
    prisma.pernikahan.findMany({
      orderBy: { tanggal: "desc" },
      include: {
        jemaats: {
          select: {
            idJemaat: true,
            nama: true,
          },
        },
      },
    }),
    prisma.jemaat.findMany({
      orderBy: { nama: "asc" },
      select: {
        idJemaat: true,
        nama: true,
        jenisKelamin: true,
      },
    }),
    getKlasis(),
  ]);

  return (
    <SakramenClientPage
      initialData={{ baptis, sidi, pernikahan }}
      masters={{ jemaat, klasis }}
    />
  );
}
