"use server";

import { prisma } from "@/lib/prisma";

export async function getSakramenAction(filters?: Record<string, string>) {
    try {
        const baptisWhere: any = {};
        const sidiWhere: any = {};
        const pernikahanWhere: any = {};

        if (filters) {
            if (filters.idKlasis && filters.idKlasis !== "all") {
                baptisWhere.idKlasis = filters.idKlasis;
                sidiWhere.idKlasis = filters.idKlasis;

                // Pernikahan stores klasis name, so we need to fetch the name first
                const klasis = await prisma.klasis.findUnique({
                    where: { idKlasis: filters.idKlasis },
                    select: { nama: true }
                });

                if (klasis) {
                    pernikahanWhere.klasis = klasis.nama;
                }
            }

            if (filters.jenisKelamin && filters.jenisKelamin !== "all") {
                const gender = filters.jenisKelamin === "L";
                baptisWhere.jemaat = { jenisKelamin: gender };
                sidiWhere.jemaat = { jenisKelamin: gender };
                // Pernikahan: ignore gender filter
            }
        }


        const [baptis, sidi, pernikahan] = await Promise.all([
            prisma.baptis.findMany({
                where: baptisWhere,
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
                where: sidiWhere,
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
                where: pernikahanWhere,
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
        ]);

        return { baptis, sidi, pernikahan };
    } catch (error) {
        console.error("Failed to fetch sakramen data:", error);
        throw new Error("Failed to fetch sakramen data");
    }
}
