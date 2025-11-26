import JemaatModule from "@/components/modules/jemaat/jemaat-module";
import { prisma } from "@/lib/prisma";

const jemaatInclude = {
  keluarga: {
    include: {
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
      rayon: true,
      statusKepemilikan: true,
      statusTanah: true,
    },
  },
  status: true,
  pendidikan: true,
  pekerjaan: true,
  pendapatan: true,
  jaminan: true,
  pernikahan: true,
  baptisOwned: true,
  sidiOwned: true,
  jabatanRel: {
    include: {
      jabatan: true,
    },
  },
};

export default async function JemaatPage() {
  const [
    jemaat,
    status,
    pendidikan,
    pekerjaan,
    pendapatan,
    jaminan,
    statusKepemilikan,
    statusTanah,
    rayon,
    kelurahan,
  ] = await Promise.all([
    prisma.jemaat.findMany({
      take: 50,
      orderBy: { nama: "asc" },
      include: jemaatInclude,
    }),
    prisma.statusDalamKeluarga.findMany({ orderBy: { status: "asc" } }),
    prisma.pendidikan.findMany({ orderBy: { jenjang: "asc" } }),
    prisma.pekerjaan.findMany({ orderBy: { namaPekerjaan: "asc" } }),
    prisma.pendapatan.findMany({ orderBy: { rentang: "asc" } }),
    prisma.jaminanKes.findMany({ orderBy: { jenisJaminan: "asc" } }),
    prisma.statusKepemilikanRumah.findMany({ orderBy: { status: "asc" } }),
    prisma.statusTanah.findMany({ orderBy: { status: "asc" } }),
    prisma.rayon.findMany({ orderBy: { namaRayon: "asc" } }),
    prisma.kelurahan.findMany({ orderBy: { nama: "asc" } }),
  ]);

  const serializedJemaat = jemaat.map((j) => ({
    ...j,
    tanggalLahir: j.tanggalLahir instanceof Date ? j.tanggalLahir.toISOString() : String(j.tanggalLahir),
  }));

  return (
    <JemaatModule
      initialData={serializedJemaat}
      masters={{
        status,
        pendidikan,
        pekerjaan,
        pendapatan,
        jaminan,
        statusKepemilikan,
        statusTanah,
        rayon,
        kelurahan,
      }}
    />
  );
}

