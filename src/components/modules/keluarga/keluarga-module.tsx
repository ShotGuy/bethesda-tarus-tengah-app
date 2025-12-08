"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Search, Eye, Pencil, Trash2, MoreHorizontal } from "lucide-react";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Keluarga = {
  idKeluarga: string;
  nikKepala: string;
  idRayon: string;
  idStatusKepemilikan: string;
  idStatusTanah: string;
  alamat: {
    idKelurahan: string;
    jalan: string;
    RT: number;
    RW: number;
  };
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const router = useRouter();

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
        const res = await fetch(`/api/keluarga/${encodeURIComponent(editingId)}`, {
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
      idStatusKepemilikan: item.idStatusKepemilikan,
      idStatusTanah: item.idStatusTanah,
      idRayon: item.idRayon,
      idKelurahan: item.alamat.idKelurahan,
      jalan: item.alamat.jalan,
      RT: item.alamat.RT,
      RW: item.alamat.RW,
    });
    setOpen(true);
  };

  const handleDetail = (item: Keluarga) => {
    router.push(`/keluarga/${encodeURIComponent(item.idKeluarga)}`);
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/keluarga/${encodeURIComponent(deleteTarget)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Gagal menghapus keluarga");
      setItems((prev) => prev.filter((it) => it.idKeluarga !== deleteTarget));
      toast.success("Keluarga berhasil dihapus");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
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
                      <FormLabel>NIK Kepala Keluarga <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} disabled={!!editingId} />
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
                        <FormLabel>Rayon <span className="text-red-500">*</span></FormLabel>
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
                        <FormLabel>Status Kepemilikan <span className="text-red-500">*</span></FormLabel>
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
                        <FormLabel>Status Tanah <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-60">
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="RT"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RT <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input type="number" {...field} value={field.value ?? ""} />
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
                        <FormLabel>RW <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input type="number" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="idKelurahan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kelurahan <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-60">
                            {masters.kelurahan.map((item) => (
                              <SelectItem key={item.idKelurahan} value={item.idKelurahan}>
                                {item.nama}
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
                    name="jalan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jalan <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} />
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

      <div className="hidden md:block overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Keluarga</TableHead>
              <TableHead>Nama Kepala Keluarga</TableHead>
              <TableHead>Rayon</TableHead>
              <TableHead>Jlh. Anggota</TableHead>
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
                  <TableCell><div className="h-4 w-16 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell className="text-right"><div className="ml-auto h-8 w-16 animate-pulse rounded bg-muted" /></TableCell>
                </TableRow>
              ))
            ) : (
              filteredItems.map((item) => {
                const kepala = item.jemaat?.find((j) => j.idJemaat === item.nikKepala);
                return (
                  <TableRow key={item.idKeluarga}>
                    <TableCell className="font-mono text-sm">{item.idKeluarga}</TableCell>
                    <TableCell>{kepala?.nama ?? "Tanpa Kepala Keluarga"}</TableCell>
                    <TableCell>{item.rayon?.namaRayon ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{item.jemaat?.length ?? 0}</span>
                        <span className="text-muted-foreground text-xs">jiwa</span>
                      </div>
                    </TableCell>
                    <TableCell className="space-x-1 text-right whitespace-nowrap">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => handleDetail(item)}
                        title="Lihat Detail"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                        onClick={() => handleEdit(item)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(item.idKeluarga)}
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Grid View for Keluarga */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-6 w-48 animate-pulse rounded bg-muted" />
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="flex gap-2 pt-2">
                <div className="h-8 w-12 animate-pulse rounded bg-muted" />
                <div className="h-8 w-12 animate-pulse rounded bg-muted" />
                <div className="h-8 w-12 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))
        ) : (
          filteredItems.map((item) => {
            const kepala = item.jemaat?.find((j) => j.idJemaat === item.nikKepala);
            return (
              <div key={item.idKeluarga} className="rounded-lg border bg-card p-4 shadow-sm hover:bg-accent/50 transition-colors">
                <div className="flex flex-col space-y-1.5">
                  <span className="text-xs font-mono text-muted-foreground">ID Keluarga:</span>
                  <span className="font-mono text-sm font-medium">{item.idKeluarga}</span>
                </div>

                <div className="mt-3 flex flex-col space-y-1">
                  <span className="text-xs text-muted-foreground">Kepala Keluarga:</span>
                  <span className="font-bold text-base">{kepala?.nama ?? "Tanpa Kepala Keluarga"}</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 pb-3 border-b">
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs text-muted-foreground">Rayon:</span>
                    <span className="font-medium text-sm">{item.rayon?.namaRayon ?? "-"}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs text-muted-foreground">Jlh. Anggota:</span>
                    <span className="font-medium text-sm">{item.jemaat?.length ?? 0} jiwa</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <Button variant="outline" size="icon" onClick={() => handleDetail(item)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(item.idKeluarga)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data keluarga beserta semua anggotanya akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
