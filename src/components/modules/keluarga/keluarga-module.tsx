"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataFilter, FilterConfig } from "@/components/ui/data-filter";

type Keluarga = {
  idKeluarga: string;
  nikKepala: string;
  rayon?: { namaRayon: string };
  statusKepemilikan?: { status: string };
  jemaat?: Array<{ idJemaat: string; nama: string }>;
};

type Masters = {
  statusKepemilikan: Array<{ idStatusKepemilikan: string; status: string }>;
  statusTanah: Array<{ idStatusTanah: string; status: string }>;
  rayon: Array<{ idRayon: string; namaRayon: string }>;
  kelurahan: Array<{ idKelurahan: string; nama: string }>;
};

type Props = {
  initialData: Keluarga[] | undefined;
  masters: Masters;
  isLoading?: boolean;
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onResetFilters: () => void;
};

const schema = z.object({
  nikKepala: z.string().length(16),
  idStatusKepemilikan: z.string(),
  idStatusTanah: z.string(),
  idRayon: z.string(),
  idKelurahan: z.string(),
  jalan: z.string().min(3),
  RT: z.coerce.number().int().min(0),
  RW: z.coerce.number().int().min(0),
});

type FormValues = z.infer<typeof schema>;

export default function KeluargaModule({
  initialData,
  masters,
  isLoading,
  filters,
  onFilterChange,
  onResetFilters
}: Props) {
  const [items, setItems] = useState(initialData ?? []);

  useMemo(() => {
    if (initialData) {
      setItems(initialData);
    }
  }, [initialData]);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filterConfig: FilterConfig[] = useMemo(() => [
    {
      key: "idRayon",
      label: "Rayon",
      options: masters.rayon.map((r) => ({ label: r.namaRayon, value: r.idRayon })),
    },
    {
      key: "idStatusKepemilikan",
      label: "Status Rumah",
      options: masters.statusKepemilikan.map((s) => ({ label: s.status, value: s.idStatusKepemilikan })),
    },
    {
      key: "idStatusTanah",
      label: "Status Tanah",
      options: masters.statusTanah.map((s) => ({ label: s.status, value: s.idStatusTanah })),
    },
    {
      key: "idKelurahan",
      label: "Kelurahan",
      options: masters.kelurahan.map((k) => ({ label: k.nama, value: k.idKelurahan })),
    },
  ], [masters]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const lowerQuery = searchQuery.toLowerCase();
    return items.filter((item) => {
      const noKK = item.idKeluarga.toLowerCase();
      const nikKepala = item.nikKepala.toLowerCase();

      // Find head name
      const headName = item.jemaat?.find((j) => j.idJemaat === item.nikKepala)?.nama.toLowerCase() ?? "";

      return (
        noKK.includes(lowerQuery) ||
        nikKepala.includes(lowerQuery) ||
        headName.includes(lowerQuery)
      );
    });
  }, [items, searchQuery]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      const payload = {
        nikKepala: values.nikKepala,
        idStatusKepemilikan: values.idStatusKepemilikan,
        idStatusTanah: values.idStatusTanah,
        idRayon: values.idRayon,
        alamat: {
          idKelurahan: values.idKelurahan,
          jalan: values.jalan,
          RT: values.RT,
          RW: values.RW,
        },
      };

      if (editingId) {
        const res = await fetch(`/api/keluarga/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.message ?? "Gagal memperbarui keluarga");
        setItems((prev) => prev.map((it) => (it.idKeluarga === editingId ? data.data : it)));
        setEditingId(null);
        setOpen(false);
        form.reset();
        toast.success("Keluarga berhasil diperbarui");
      } else {
        const res = await fetch("/api/keluarga", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message ?? "Gagal menyimpan keluarga");
        }

        setItems((prev) => [data.data, ...prev]);
        setOpen(false);
        form.reset();
        toast.success("Keluarga berhasil ditambahkan");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    }
  };

  const handleEdit = (item: Keluarga) => {
    setEditingId(item.idKeluarga);
    form.reset({
      nikKepala: item.nikKepala,
      idStatusKepemilikan: undefined,
      idStatusTanah: undefined,
      idRayon: undefined,
      idKelurahan: undefined,
      jalan: undefined,
      RT: undefined,
      RW: undefined,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/keluarga/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Gagal menghapus keluarga");
      setItems((prev) => prev.filter((it) => it.idKeluarga !== id));
      toast.success("Keluarga berhasil dihapus");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Data Keluarga</h2>
          <p className="text-sm text-muted-foreground">
            Daftar kepala keluarga beserta rayon.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Tambah Keluarga</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Keluarga Baru</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
                <FormField
                  control={form.control}
                  name="nikKepala"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NIK Kepala Keluarga</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="idRayon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rayon</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {masters.rayon.map((item) => (
                              <SelectItem key={item.idRayon} value={item.idRayon}>
                                {item.namaRayon}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="idStatusKepemilikan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status Kepemilikan</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {masters.statusKepemilikan.map((item) => (
                              <SelectItem
                                key={item.idStatusKepemilikan}
                                value={item.idStatusKepemilikan}
                              >
                                {item.status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="idStatusTanah"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status Tanah</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {masters.statusTanah.map((item) => (
                              <SelectItem
                                key={item.idStatusTanah}
                                value={item.idStatusTanah}
                              >
                                {item.status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="idKelurahan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kelurahan</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-60">
                            {masters.kelurahan.map((item) => (
                              <SelectItem
                                key={item.idKelurahan}
                                value={item.idKelurahan}
                              >
                                {item.nama}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="jalan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat Jalan</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="RT"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RT</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="RW"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RW</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">Simpan</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari berdasarkan No KK atau Nama Kepala Keluarga..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <DataFilter
          filters={filterConfig}
          values={filters}
          onFilterChange={onFilterChange}
          onReset={onResetFilters}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Keluarga</TableHead>
              <TableHead>NIK Kepala</TableHead>
              <TableHead>Rayon</TableHead>
              <TableHead>Status Rumah</TableHead>
              <TableHead className="w-32 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-4 w-32 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-4 w-20 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell className="text-right"><div className="ml-auto h-8 w-16 animate-pulse rounded bg-muted" /></TableCell>
                </TableRow>
              ))
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.idKeluarga}>
                  <TableCell className="font-mono text-sm">{item.idKeluarga}</TableCell>
                  <TableCell>{item.nikKepala}</TableCell>
                  <TableCell>{item.rayon?.namaRayon ?? "-"}</TableCell>
                  <TableCell>{item.statusKepemilikan?.status ?? "-"}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(item.idKeluarga)}>Hapus</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

