import { NextResponse } from "next/server";
import { z } from "zod";

import { createResponse } from "@/lib/api-response";
import { withErrorHandling } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";
import { generateId } from "@/lib/id";
import { prisma } from "@/lib/prisma";
import { generateKeluargaId } from "@/lib/keluarga-service";

const alamatSchema = z.object({
  idKelurahan: z.string().length(10),
  jalan: z.string().min(2).max(50),
  RT: z.coerce.number().int().min(0),
  RW: z.coerce.number().int().min(0),
});

const createSchema = z.object({
  idKeluarga: z.string().length(16).optional(),
  nikKepala: z.string().length(16),
  idAlamat: z.string().length(10).optional(),
  alamat: alamatSchema.optional(),
  idStatusKepemilikan: z.string().length(10),
  idRayon: z.string().length(10),
  idStatusTanah: z.string().length(10),
});

const includeOptions = {
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
  jemaat: true,
};

export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const idRayon = searchParams.get("idRayon") ?? undefined;
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);
  const skip = (page - 1) * limit;

  const where: any = {
    ...(idRayon ? { idRayon } : {}),
    ...(search
      ? {
        OR: [
          { nikKepala: { contains: search, mode: "insensitive" } },
          { idKeluarga: { contains: search, mode: "insensitive" } },
        ],
      }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.keluarga.findMany({
      where,
      skip,
      take: limit,
      orderBy: { nikKepala: "asc" },
      include: includeOptions,
    }),
    prisma.keluarga.count({ where }),
  ]);

  return NextResponse.json(
    createResponse(true, {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }),
  );
});

export const POST = withErrorHandling(async (request) => {
  const payload = await request.json();
  const parsed = createSchema.safeParse(payload);

  if (!parsed.success) {
    throw new AppError("Validasi gagal", 400, parsed.error.flatten().fieldErrors);
  }

  const data = parsed.data;

  if (!data.idAlamat && !data.alamat) {
    throw new AppError("Alamat wajib diisi (pilih atau buat baru)", 400);
  }

  const existingNik = await prisma.keluarga.findUnique({
    where: { nikKepala: data.nikKepala },
  });

  if (existingNik) {
    throw new AppError("NIK kepala keluarga sudah terdaftar", 409);
  }

  // ID Generation Logic
  const newIdKeluarga = await generateKeluargaId(prisma, data.idRayon);

  // Check collision (just in case)
  const collision = await prisma.keluarga.findUnique({
    where: { idKeluarga: newIdKeluarga },
  });

  if (collision) {
    throw new AppError("Gagal men-generate ID unik, silakan coba lagi", 409);
  }

  let alamatId = data.idAlamat ?? null;

  if (!alamatId && data.alamat) {
    const newAlamat = await prisma.alamat.create({
      data: {
        idAlamat: generateId(10),
        ...data.alamat,
      },
    });
    alamatId = newAlamat.idAlamat;
  }

  const created = await prisma.keluarga.create({
    data: {
      idKeluarga: newIdKeluarga,
      nikKepala: data.nikKepala,
      idAlamat: alamatId!,
      idStatusKepemilikan: data.idStatusKepemilikan,
      idRayon: data.idRayon,
      idStatusTanah: data.idStatusTanah,
    },
    include: includeOptions,
  });

  return NextResponse.json(
    createResponse(true, created, "Keluarga berhasil ditambahkan"),
    { status: 201 },
  );
});

