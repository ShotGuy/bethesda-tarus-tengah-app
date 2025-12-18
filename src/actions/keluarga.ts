"use server";

import { prisma } from "@/lib/prisma";

export async function getKeluargaAction(filters?: Record<string, string>) {
    try {
        const where: any = {};

        if (filters) {
            if (filters.idRayon && filters.idRayon !== "all") {
                where.idRayon = filters.idRayon;
            }
            if (filters.idStatusKepemilikan && filters.idStatusKepemilikan !== "all") {
                where.idStatusKepemilikan = filters.idStatusKepemilikan;
            }
            if (filters.idStatusTanah && filters.idStatusTanah !== "all") {
                where.idStatusTanah = filters.idStatusTanah;
            }
            if (filters.idKelurahan && filters.idKelurahan !== "all") {
                where.alamat = { idKelurahan: filters.idKelurahan };
            }
        }

        const data = await prisma.keluarga.findMany({
            where,
            orderBy: { idKeluarga: "asc" },
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
                statusKepemilikan: true,
                statusTanah: true,
                rayon: true,
                jemaat: {
                    include: {
                        status: true,
                    },
                },
            },
        });
        return data;
    } catch (error) {
        console.error("Failed to fetch keluarga:", error);
        throw new Error("Failed to fetch keluarga data");
    }
}
