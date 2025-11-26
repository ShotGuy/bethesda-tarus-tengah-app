import { NextResponse } from "next/server";
import { z } from "zod";

import { createResponse } from "@/lib/api-response";
import { withErrorHandling } from "@/lib/api-handler";
import { AppError, NotFoundError } from "@/lib/errors";
import { generateId } from "@/lib/id";
import { prisma } from "@/lib/prisma";

const alamatSchema = z.object({
  idKelurahan: z.string().length(10),
  jalan: z.string().min(2).max(50),
  RT: z.coerce.number().int().min(0),
  RW: z.coerce.number().int().min(0),
});

const updateSchema = z
  .object({
    nikKepala: z.string().length(16).optional(),
    idStatusKepemilikan: z.string().length(10).optional(),
    idRayon: z.string().length(10).optional(),
    idStatusTanah: z.string().length(10).optional(),
    idAlamat: z.string().length(10).optional(),
    alamat: alamatSchema.optional(),
  })
  .partial();

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

export const GET = withErrorHandling(async (_request, { params: paramsPromise }) => {
  const params = await paramsPromise;
  const { id } = params as { id: string };

  const keluarga = await prisma.keluarga.findUnique({
    where: { idKeluarga: id },
    include: includeOptions,
  });

  if (!keluarga) {
    throw new NotFoundError("Keluarga tidak ditemukan");
  }

  return NextResponse.json(createResponse(true, keluarga));
});

export const PATCH = withErrorHandling(async (request, { params: paramsPromise }) => {
  const params = await paramsPromise;
  const { id } = params as { id: string };
  const payload = await request.json();
  const parsed = updateSchema.safeParse(payload);

  if (!parsed.success) {
    throw new AppError("Validasi gagal", 400, parsed.error.flatten().fieldErrors);
  }

  const existing = await prisma.keluarga.findUnique({
    where: { idKeluarga: id },
    include: { alamat: true },
  });

  if (!existing) {
    throw new NotFoundError("Keluarga tidak ditemukan");
  }

  const data = parsed.data;
  let alamatId = data.idAlamat ?? existing.idAlamat;

  if (data.alamat) {
    if (existing.alamat) {
      await prisma.alamat.update({
        where: { idAlamat: existing.idAlamat },
        data: data.alamat,
      });
    } else {
      const newAlamat = await prisma.alamat.create({
        data: {
          idAlamat: generateId(10),
          ...data.alamat,
        },
      });
      alamatId = newAlamat.idAlamat;
    }
  }

  const updated = await prisma.keluarga.update({
    where: { idKeluarga: id },
    data: {
      ...(data.nikKepala && { nikKepala: data.nikKepala }),
      ...(alamatId && { idAlamat: alamatId }),
      ...(data.idStatusKepemilikan && {
        idStatusKepemilikan: data.idStatusKepemilikan,
      }),
      ...(data.idRayon && { idRayon: data.idRayon }),
      ...(data.idStatusTanah && { idStatusTanah: data.idStatusTanah }),
    },
    include: includeOptions,
  });

  return NextResponse.json(
    createResponse(true, updated, "Keluarga diperbarui"),
  );
});

export const DELETE = withErrorHandling(async (_request, { params: paramsPromise }) => {
  const params = await paramsPromise;
  const { id } = params as { id: string };
  try {
    await prisma.keluarga.delete({
      where: { idKeluarga: id },
    });
    return NextResponse.json(createResponse(true, null, "Keluarga dihapus"));
  } catch (err: any) {
    if (err?.code === 'P2003') {
      throw new AppError("Tidak dapat menghapus data karena sudah ada referensi/relasi di data lain.", 409);
    }
    throw err;
  }
});

