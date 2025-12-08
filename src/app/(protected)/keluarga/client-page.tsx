"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import KeluargaModule from "@/components/modules/keluarga/keluarga-module";
import { getKeluargaAction } from "@/actions/keluarga";

interface KeluargaClientPageProps {
    initialData: any[] | undefined;
    masters: any;
}

export default function KeluargaClientPage({
    initialData,
    masters,
}: KeluargaClientPageProps) {
    const [filters, setFilters] = useState<Record<string, string>>({});

    const { data: keluarga, isLoading } = useQuery({
        queryKey: ["keluarga", filters],
        queryFn: () => getKeluargaAction(filters),
        initialData: initialData,
        staleTime: 1 * 60 * 1000, // 1 minute
    });

    return (
        <KeluargaModule
            initialData={keluarga}
            masters={masters}
            isLoading={isLoading}
            filters={filters}
            onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
            onResetFilters={() => setFilters({})}
        />
    );
}
