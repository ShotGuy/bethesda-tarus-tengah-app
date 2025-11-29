"use client";

import { useMemo, useState } from "react";
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

type Jemaat = {
  idJemaat: string;
  nama: string;
  jenisKelamin: boolean;
  tanggalLahir: string;
  statusDalamKel: string;
  status?: { status: string };
  keluarga?: {
    nikKepala: string;
    rayon?: { namaRayon: string };
  };
};

type MasterCollections = {
  status: Array<{ idStatusDalamKel: string; status: string }>;
  pendidikan: Array<{ idPendidikan: string; jenjang: string }>;
  pekerjaan: Array<{ idPekerjaan: string; namaPekerjaan: string }>;
  pendapatan: Array<{ idPendapatan: string; rentang: string }>;
  jaminan: Array<{ idJaminan: string; jenisJaminan: string }>;
  statusKepemilikan: Array<{ idStatusKepemilikan: string; status: string }>;
  statusTanah: Array<{ idStatusTanah: string; status: string }>;
  rayon: Array<{ idRayon: string; namaRayon: string }>;
  kelurahan: Array<{ idKelurahan: string; nama: string }>;
};

type Props = {
  initialData: Jemaat[] | undefined;
  masters: MasterCollections;
  isLoading?: boolean;
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onResetFilters: () => void;
};

const formSchema = z.object({
  idJemaat: z.string().min(5),
  nama: z.string().min(3),
  jenisKelamin: z.enum(["L", "P"]),
  tanggalLahir: z.string(),
  statusDalamKel: z.string().min(1),
  golDarah: z.string().max(5).optional(),
  idPendidikan: z.string().optional(),
  idPekerjaan: z.string().optional(),
  idPendapatan: z.string().optional(),
  idJaminan: z.string().optional(),
  nikKepalaKeluarga: z.string().length(16).optional(),
  keluargaBaru: z
    .object({
      nikKepala: z.string().length(16),
      idStatusKepemilikan: z.string(),
      idStatusTanah: z.string(),
      idRayon: z.string(),
      idKelurahan: z.string(),
      jalan: z.string().min(3),
      RT: z.coerce.number().int().min(0),
      RW: z.coerce.number().int().min(0),
    })
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

const normalizeStatus = (value: string) => value.toLowerCase().includes("kepala");

export default function JemaatModule({
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
      key: "jenisKelamin",
      label: "Jenis Kelamin",
      options: [
        { label: "Laki-laki", value: "L" },
        { label: "Perempuan", value: "P" },
      ],
    },
    {
      key: "golDarah",
      label: "Golongan Darah",
      options: ["A", "B", "AB", "O"].map((g) => ({ label: g, value: g })),
    },
    {
      key: "statusDalamKel",
      label: "Status Keluarga",
      options: masters.status.map((s) => ({ label: s.status, value: s.idStatusDalamKel })),
    },
    {
      key: "idRayon",
      label: "Rayon",
      options: masters.rayon.map((r) => ({ label: r.namaRayon, value: r.idRayon })),
    },
    {
      key: "idPendidikan",
      label: "Pendidikan",
      options: masters.pendidikan.map((p) => ({ label: p.jenjang, value: p.idPendidikan })),
    },
    {
      key: "idPekerjaan",
      label: "Pekerjaan",
      options: masters.pekerjaan.map((p) => ({ label: p.namaPekerjaan, value: p.idPekerjaan })),
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
  ], [masters]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const lowerQuery = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.nama.toLowerCase().includes(lowerQuery) ||
        item.idJemaat.toLowerCase().includes(lowerQuery)
    );
  }, [items, searchQuery]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      jenisKelamin: "L",
    },
  });

  const selectedStatus = form.watch("statusDalamKel");
  const statusLabel = useMemo(() => {
    return masters.status.find(
      (item) => item.idStatusDalamKel === selectedStatus,
    )?.status;
  }, [selectedStatus, masters.status]);

  const isKepala = !!statusLabel && normalizeStatus(statusLabel);

  const handleSubmit = async (values: FormValues) => {
    try {
      if (isKepala && !values.keluargaBaru) {
        toast.error("Lengkapi data keluarga baru untuk kepala keluarga");
        return;
      }

      if (!isKepala && !values.nikKepalaKeluarga) {
        toast.error("Isi NIK kepala keluarga untuk jemaat non kepala");
        return;
      }

      const headPayload =
        isKepala && values.keluargaBaru
          ? {
            nikKepala: values.keluargaBaru.nikKepala,
            idStatusKepemilikan: values.keluargaBaru.idStatusKepemilikan,
            idStatusTanah: values.keluargaBaru.idStatusTanah,
            idRayon: values.keluargaBaru.idRayon,
            alamat: {
              idKelurahan: values.keluargaBaru.idKelurahan,
              jalan: values.keluargaBaru.jalan,
              RT: values.keluargaBaru.RT,
              RW: values.keluargaBaru.RW,
            },
          }
          : undefined;

      const payload = {
        ...values,
        jenisKelamin: values.jenisKelamin === "L",
        keluargaBaru: headPayload,
      };

      if (editingId) {
        // Update existing jemaat
        const updatePayload: any = {
          nama: values.nama,
          jenisKelamin: values.jenisKelamin === "L",
          tanggalLahir: values.tanggalLahir,
          golDarah: values.golDarah ?? null,
          statusDalamKel: values.statusDalamKel,
          idPendidikan: values.idPendidikan ?? null,
          idPekerjaan: values.idPekerjaan ?? null,
          idPendapatan: values.idPendapatan ?? null,
          idJaminan: values.idJaminan ?? null,
        };

        const res = await fetch(`/api/jemaat/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message ?? "Gagal memperbarui jemaat");
        }

        setItems((prev) => prev.map((it) => (it.idJemaat === editingId ? data.data : it)));
        setEditingId(null);
        setOpen(false);
        form.reset();
        toast.success("Jemaat berhasil diperbarui");
      } else {
        const res = await fetch("/api/jemaat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message ?? "Gagal menambahkan jemaat");
        }

        setItems((prev) => [data.data, ...prev]);
        setOpen(false);
        form.reset();
        toast.success("Jemaat berhasil ditambahkan");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Terjadi kesalahan",
      );
    }
  };

  const handleEdit = (item: Jemaat) => {
    setEditingId(item.idJemaat);
    // populate form
    form.reset({
      idJemaat: item.idJemaat,
      nama: item.nama,
      jenisKelamin: item.jenisKelamin ? "L" : "P",
      tanggalLahir: (item.tanggalLahir as any) instanceof Date
        ? (item.tanggalLahir as any).toISOString().split("T")[0]
        : String(item.tanggalLahir).split("T")[0],
      statusDalamKel: item.statusDalamKel,
      golDarah: undefined,
      idPendidikan: undefined,
      idPekerjaan: undefined,
      idPendapatan: undefined,
      idJaminan: undefined,
      nikKepalaKeluarga: item.keluarga?.nikKepala,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/jemaat/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Gagal menghapus jemaat");
      setItems((prev) => prev.filter((it) => it.idJemaat !== id));
      toast.success("Jemaat berhasil dihapus");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Data Jemaat</h2>
          <p className="text-sm text-muted-foreground">
            Kelola data jemaat beserta status keluarga.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Tambah Jemaat</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tambah Jemaat</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="idJemaat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Jemaat (NIK)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nama"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="jenisKelamin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jenis Kelamin</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="L">Laki-laki</SelectItem>
                            <SelectItem value="P">Perempuan</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tanggalLahir"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Lahir</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="statusDalamKel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status Dalam Keluarga</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {masters.status.map((item) => (
                              <SelectItem
                                key={item.idStatusDalamKel}
                                value={item.idStatusDalamKel}
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
                    name="golDarah"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Golongan Darah</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="idPendidikan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pendidikan</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {masters.pendidikan.map((item) => (
                              <SelectItem key={item.idPendidikan} value={item.idPendidikan}>
                                {item.jenjang}
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
                    name="idPekerjaan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pekerjaan</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {masters.pekerjaan.map((item) => (
                              <SelectItem key={item.idPekerjaan} value={item.idPekerjaan}>
                                {item.namaPekerjaan}
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
                    name="idPendapatan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pendapatan</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {masters.pendapatan.map((item) => (
                              <SelectItem key={item.idPendapatan} value={item.idPendapatan}>
                                {item.rentang}
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
                    name="idJaminan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jaminan Kesehatan</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {masters.jaminan.map((item) => (
                              <SelectItem key={item.idJaminan} value={item.idJaminan}>
                                {item.jenisJaminan}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {!isKepala && (
                  <FormField
                    control={form.control}
                    name="nikKepalaKeluarga"
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
                )}

                {isKepala && (
                  <div className="space-y-4 rounded-lg border p-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Data Keluarga Baru
                    </h4>
                    <FormField
                      control={form.control}
                      name="keluargaBaru.nikKepala"
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
                        name="keluargaBaru.idStatusKepemilikan"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status Kepemilikan Rumah</FormLabel>
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
                        name="keluargaBaru.idStatusTanah"
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
                        name="keluargaBaru.idRayon"
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
                        name="keluargaBaru.idKelurahan"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kelurahan</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Pilih" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
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
                      <FormField
                        control={form.control}
                        name="keluargaBaru.jalan"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nama Jalan</FormLabel>
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
                          name="keluargaBaru.RT"
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
                          name="keluargaBaru.RW"
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
                    </div>

                  </div>
                )}

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
            placeholder="Cari berdasarkan NIK atau Nama..."
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
              <TableHead>ID Jemaat</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rayon</TableHead>
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
              filteredItems.map((item) => (
                <TableRow key={item.idJemaat}>
                  <TableCell className="font-mono text-sm">{item.idJemaat}</TableCell>
                  <TableCell>{item.nama}</TableCell>
                  <TableCell>{item.status?.status ?? "-"}</TableCell>
                  <TableCell>{item.keluarga?.rayon?.namaRayon ?? "-"}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(item.idJemaat)}>Hapus</Button>
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
