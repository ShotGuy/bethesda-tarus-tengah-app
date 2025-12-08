"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import JemaatModule from "@/components/modules/jemaat/jemaat-module";
import { getJemaatAction } from "@/actions/jemaat";

interface JemaatClientPageProps {
    initialData: any[] | undefined;
    masters: any;
}

export default function JemaatClientPage({
    initialData,
    masters,
}: JemaatClientPageProps) {
    const [filters, setFilters] = useState<Record<string, string>>({});

    const { data: jemaat, isLoading } = useQuery({
        queryKey: ["jemaat", filters],
        queryFn: () => getJemaatAction(filters),
        initialData: initialData,
        staleTime: 1 * 60 * 1000, // 1 minute
    });

    return (
        <JemaatModule
            initialData={jemaat}
            masters={masters}
            isLoading={isLoading}
            filters={filters}
            onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
            onResetFilters={() => setFilters({})}
        />
    );
}
