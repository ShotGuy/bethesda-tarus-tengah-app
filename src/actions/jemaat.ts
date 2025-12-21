"use server";

import { prisma } from "@/lib/prisma";

export async function getJemaatAction(
    page: number = 1,
    limit: number = 10,
    filters?: Record<string, string>,
    searchQuery?: string
) {
    try {
        const where: any = {};

        if (filters) {
            if (filters.jenisKelamin && filters.jenisKelamin !== "all") {
                where.jenisKelamin = filters.jenisKelamin === "L";
            }
            if (filters.golDarah && filters.golDarah !== "all") {
                where.golDarah = filters.golDarah;
            }
            if (filters.statusDalamKel && filters.statusDalamKel !== "all") {
                where.statusDalamKel = filters.statusDalamKel;
            }
            if (filters.idPendidikan && filters.idPendidikan !== "all") {
                where.idPendidikan = filters.idPendidikan;
            }
            if (filters.idPekerjaan && filters.idPekerjaan !== "all") {
                where.idPekerjaan = filters.idPekerjaan;
            }
            if (filters.idRayon && filters.idRayon !== "all") {
                where.keluarga = { ...where.keluarga, idRayon: filters.idRayon };
            }
            if (filters.idStatusKepemilikan && filters.idStatusKepemilikan !== "all") {
                where.keluarga = { ...where.keluarga, idStatusKepemilikan: filters.idStatusKepemilikan };
            }
            if (filters.idStatusTanah && filters.idStatusTanah !== "all") {
                where.keluarga = { ...where.keluarga, idStatusTanah: filters.idStatusTanah };
            }
        }

        if (searchQuery) {
            where.OR = [
                { nama: { contains: searchQuery, mode: "insensitive" } },
                { idJemaat: { contains: searchQuery, mode: "insensitive" } }
            ];
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            prisma.jemaat.findMany({
                where,
                include: {
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
                },
                orderBy: {
                    nama: "asc",
                },
                take: limit,
                skip: skip,
            }),
            prisma.jemaat.count({ where }),
        ]);

        return {
            data,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }
        };
    } catch (error) {
        console.error("Failed to fetch jemaat:", error);
        throw new Error("Failed to fetch jemaat data");
    }
}
