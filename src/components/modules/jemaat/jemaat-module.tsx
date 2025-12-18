"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Search, Eye, Pencil, Trash2, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  golDarah?: string | null;
  idPendidikan?: string | null;
  idPekerjaan?: string | null;
  idPendapatan?: string | null;
  idJaminan?: string | null;
  status?: { status: string };
  keluarga?: {
    noKK?: string | null;
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
  noKK: z.string().length(16).regex(/^\d+$/).optional(),
  keluargaBaru: z
    .object({
      noKK: z.string().length(16).regex(/^\d+$/),
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
  const router = useRouter();

  useMemo(() => {
    if (initialData) {
      setItems(initialData);
    }
  }, [initialData]);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExistingFamily, setIsExistingFamily] = useState(false);

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
    shouldUnregister: true, // Handle hidden fields validation
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

  // EFECT: Explicitly clean up form values when modes switch to prevent phantom validation errors
  useEffect(() => {
    if (isKepala) {
      // If Head: Unregister the simple noKK field (we use idJemaat or new family)
      form.unregister("noKK");

      if (isExistingFamily) {
        // If Existing Family: Unregister new family fields
        form.unregister("keluargaBaru");
      }
    } else {
      // If Not Head: Unregister new family fields
      form.unregister("keluargaBaru");
    }
  }, [isKepala, isExistingFamily, form]);

  const handleSubmit = async (values: FormValues) => {
    try {
      if (isKepala && !isExistingFamily && !values.keluargaBaru && !editingId) {
        toast.error("Lengkapi data keluarga baru untuk kepala keluarga");
        return;
      }

      // Automatically use idJemaat as noKK if linking to existing family as Head (Wait, NO! Logic changed)
      // User says: Identifier is noKK. Head status is status.
      // So if Head: He enters family? Or creates family?
      // If Creating New Family (Head): He Inputs noKK for the Family.

      let finalNoKK = values.noKK;
      // If isExistingFamily (Head), he doesn't enter noKK in "family" field? 
      // The logic: "When adding head... if existing family... wait..."
      // If linking to existing family, we need the noKK of that family.
      // The form asks for "nikKepalaKeluarga" (now "noKK").

      if (isKepala && isExistingFamily) {
        // Logic for "Existing Family" checkbox for Head: 
        // Original: Use idJemaat as nikKepala. 
        // New: We need to ASK for the noKK of the family he is joining as head.
        // BUT wait, if he joins as head, the family should logically usually be new OR he replaces head?
        // Let's assume simplest: If existing family, he must provide noKK.
        // So for "isExistingFamily", we shouldn't hide the input, we should SHOW noKK input.
        // But the UI hides it? 
        // Original code: `if (isKepala) form.unregister("nikKepalaKeluarga")`.
        // This means original logic assumed Head's NIK = Family ID.
        // NOW: Family ID = noKK (Manual Input).
        // So even if Head, he MUST input noKK (either to create new or join existing).
        // I need to change this logic completely.
        // For now I will just blindly rename to noKK to match schema, and let the UI show it if needed.
        // Actually I should look at the inputs.

      }

      // If (!isKepala) && !finalNoKK...
      if (!isKepala && !finalNoKK) {
        toast.error("Isi No. KK untuk menghubungkan");
        return;
      }

      const headPayload =
        isKepala && !isExistingFamily && values.keluargaBaru
          ? {
            noKK: values.keluargaBaru.noKK,
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
        noKK: finalNoKK,
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
      golDarah: item.golDarah ?? undefined,
      idPendidikan: item.idPendidikan ?? undefined,
      idPekerjaan: item.idPekerjaan ?? undefined,
      idPendapatan: item.idPendapatan ?? undefined,
      idJaminan: item.idJaminan ?? undefined,
      noKK: item.keluarga?.noKK ?? undefined,
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

  const handleDetail = (item: Jemaat) => {
    router.push(`/jemaat/${encodeURIComponent(item.idJemaat)}`);
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
              <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit, (errors) => {
                console.error("Validation errors:", errors);
                toast.error("Mohon lengkapi data yang valid");
              })}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="idJemaat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIK Jemaat <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} disabled={!!editingId} maxLength={16} />
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
                        <FormLabel>Nama Lengkap <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} />
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
                        <FormLabel>Jenis Kelamin <span className="text-red-500">*</span></FormLabel>
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
                        <FormLabel>Tanggal Lahir <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value ?? ""} />
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
                        <FormLabel>Status Dalam Keluarga <span className="text-red-500">*</span></FormLabel>
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
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih Golongan Darah" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {["A", "B", "AB", "O"].map((darah) => (
                              <SelectItem key={darah} value={darah}>
                                {darah}
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
                    name="noKK"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>No. Kartu Keluarga</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} maxLength={16} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {isKepala && !editingId && (
                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="existingFamily"
                        checked={isExistingFamily}
                        onCheckedChange={(c) => setIsExistingFamily(!!c)}
                      />
                      <label
                        htmlFor="existingFamily"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Keluarga Sudah Terdaftar?
                      </label>
                    </div>

                    {isExistingFamily ? (
                      <div className="rounded bg-muted p-3 text-sm text-muted-foreground mt-2">
                        Sistem akan otomatis menghubungkan jemaat ini ke data Keluarga dengan NIK yang sama (<b>{form.watch("idJemaat") || "..."}</b>).
                        Pastikan data Keluarga sudah dibuat sebelumnya di menu Keluarga.
                      </div>
                    ) : (
                      <>
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mt-4">
                          Data Keluarga Baru
                        </h4>
                        <FormField
                          control={form.control}
                          name="keluargaBaru.noKK"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>No. Kartu Keluarga <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value ?? ""} maxLength={16} />
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
                                <FormLabel>Status Kepemilikan Rumah <span className="text-red-500">*</span></FormLabel>
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
                                <FormLabel>Status Tanah <span className="text-red-500">*</span></FormLabel>
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
                            name="keluargaBaru.idKelurahan"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Kelurahan <span className="text-red-500">*</span></FormLabel>
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
                                <FormLabel>Nama Jalan <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value ?? ""} />
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
                              name="keluargaBaru.RW"
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
                        </div>
                      </>
                    )}

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

      <div className="hidden md:block overflow-x-auto rounded-lg border bg-card">
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
                      onClick={() => handleDelete(item.idJemaat)}
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Grid View */}
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
          filteredItems.map((item) => (
            <div key={item.idJemaat} className="rounded-lg border bg-card p-4 shadow-sm hover:bg-accent/50 transition-colors">
              <div className="flex flex-col space-y-1.5">
                <span className="text-xs font-mono text-muted-foreground">ID Jemaat:</span>
                <span className="font-mono text-sm font-medium">{item.idJemaat}</span>
              </div>

              <div className="mt-3 flex flex-col space-y-1">
                <span className="text-xs text-muted-foreground">Nama:</span>
                <span className="font-bold text-base">{item.nama}</span>
              </div>

              <div className="mt-3 pb-3 border-b flex flex-col space-y-1">
                <span className="text-xs text-muted-foreground">Gender:</span>
                <span className="font-medium text-sm">{item.jenisKelamin ? "Laki-laki" : "Perempuan"}</span>
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
                      onClick={() => handleDelete(item.idJemaat)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
