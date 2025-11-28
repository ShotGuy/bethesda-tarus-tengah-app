import KeluargaModule from "@/components/modules/keluarga/keluarga-module";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const keluargaInclude = {
  alamat: {
    include: {
      kelurahan: {
        include: {
          kecamatan: {
            include: {
              kotaKab: {
                include: { provinsi: true },
              },
            },
          },
        },
      },
    },
  },
  statusKepemilikan: true,
  statusTanah: true,
  rayon: true,
  jemaat: {
    include: {
      status: true,
    },
  },
};

export default async function KeluargaPage() {
  const [keluarga, statusKepemilikan, statusTanah, rayon, kelurahan] =
    await Promise.all([
      prisma.keluarga.findMany({
        orderBy: { nikKepala: "asc" },
        include: keluargaInclude,
      }),
      prisma.statusKepemilikanRumah.findMany({ orderBy: { status: "asc" } }),
      prisma.statusTanah.findMany({ orderBy: { status: "asc" } }),
      prisma.rayon.findMany({ orderBy: { namaRayon: "asc" } }),
      prisma.kelurahan.findMany({ orderBy: { nama: "asc" } }),
    ]);

  return (
    <KeluargaModule
      initialData={keluarga}
      masters={{
        statusKepemilikan,
        statusTanah,
        rayon,
        kelurahan,
      }}
    />
  );
}

