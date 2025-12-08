"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SakramenModule from "@/components/modules/sakramen/sakramen-module";
import { getSakramenAction } from "@/actions/sakramen";

type Props = {
    initialData: {
        baptis: any[];
        sidi: any[];
        pernikahan: any[];
    };
    masters: {
        jemaat: any[];
        klasis: any[];
    };
    initialTab?: "baptis" | "sidi" | "pernikahan";
};

export default function SakramenClientPage({ initialData, masters, initialTab }: Props) {
    const [filters, setFilters] = useState<Record<string, string>>({});

    const { data, isLoading } = useQuery({
        queryKey: ["sakramen", filters],
        queryFn: () => getSakramenAction(filters),
        initialData: Object.keys(filters).length === 0 ? initialData : undefined,
        staleTime: 1 * 60 * 1000,
    });

    return (
        <SakramenModule
            data={data || initialData}
            masters={masters}
            isLoading={isLoading}
            filters={filters}
            onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
            onResetFilters={() => setFilters({})}
            initialTab={initialTab}
        />
    );
}
