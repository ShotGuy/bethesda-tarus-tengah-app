"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Search, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DataFilter, FilterConfig } from "@/components/ui/data-filter";

type BaptisRecord = {
  idBaptis: string;
  tanggal: string;
  idJemaat: string;
  idKlasis: string;
  jemaat?: { idJemaat: string; nama: string };
};

type SidiRecord = {
  idSidi: string;
  tanggal: string;
  idJemaat: string;
  idKlasis: string;
  jemaat?: { idJemaat: string; nama: string };
};

type PernikahanRecord = {
  idPernikahan: string;
  klasis: string;
  tanggal: string;
  jemaats: Array<{ idJemaat: string; nama: string }>;
};

type Props = {
  data: {
    baptis: BaptisRecord[];
    sidi: SidiRecord[];
    pernikahan: PernikahanRecord[];
  };
  masters: {
    jemaat: Array<{ idJemaat: string; nama: string; jenisKelamin: boolean }>;
    klasis: Array<{ idKlasis: string; nama: string }>;
  };
  initialTab?: "baptis" | "sidi" | "pernikahan";
  isLoading?: boolean;
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onResetFilters: () => void;
};

const baptisSchema = z.object({
  idJemaat: z.string().min(1, "Jemaat harus dipilih"),
  idKlasis: z.string().min(1, "Klasis harus dipilih"),
  tanggal: z.string().min(1, "Tanggal harus diisi"),
});

const sidiSchema = baptisSchema;

const pernikahanSchema = z.object({
  klasis: z.string().min(1, "Klasis harus dipilih"),
  tanggal: z.string().min(1, "Tanggal harus diisi"),
  jemaatIds: z.array(z.string()).length(2, "Harus memilih 2 jemaat"),
});

type BaptisValues = z.infer<typeof baptisSchema>;
type PernikahanValues = z.infer<typeof pernikahanSchema>;

export default function SakramenModule({
  data,
  masters,
  initialTab,
  isLoading,
  filters,
  onFilterChange,
  onResetFilters
}: Props) {
  const [baptisList, setBaptisList] = useState(data.baptis);
  const [sidiList, setSidiList] = useState(data.sidi);
  const [pernikahanList, setPernikahanList] = useState(data.pernikahan);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setBaptisList(data.baptis);
    setSidiList(data.sidi);
    setPernikahanList(data.pernikahan);
  }, [data]);

  const [openBaptis, setOpenBaptis] = useState(false);
  const [openSidi, setOpenSidi] = useState(false);
  const [openPernikahan, setOpenPernikahan] = useState(false);

  const [openCombobox1, setOpenCombobox1] = useState(false);
  const [openCombobox2, setOpenCombobox2] = useState(false);

  const [editingBaptisId, setEditingBaptisId] = useState<string | null>(null);
  const [editingSidiId, setEditingSidiId] = useState<string | null>(null);
  const [editingPernikahanId, setEditingPernikahanId] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: "baptis" | "sidi" | "pernikahan" } | null>(null);

  const filterConfig: FilterConfig[] = useMemo(() => [
    {
      key: "idKlasis",
      label: "Klasis",
      options: masters.klasis.map((k) => ({ label: k.nama, value: k.idKlasis })),
    },
    {
      key: "jenisKelamin",
      label: "Jenis Kelamin",
      options: [
        { label: "Laki-laki", value: "L" },
        { label: "Perempuan", value: "P" },
      ],
    },
  ], [masters]);



  const filteredBaptis = baptisList.filter((item) =>
    item.jemaat?.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSidi = sidiList.filter((item) =>
    item.jemaat?.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPernikahan = pernikahanList.filter((item) =>
    item.jemaats.some((j) => j.nama.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const baptisForm = useForm<BaptisValues>({
    resolver: zodResolver(baptisSchema),
    defaultValues: {
      idJemaat: "",
      idKlasis: "",
      tanggal: "",
    },
  });
  const sidiForm = useForm<BaptisValues>({
    resolver: zodResolver(sidiSchema),
    defaultValues: {
      idJemaat: "",
      idKlasis: "",
      tanggal: "",
    },
  });
  const pernikahanForm = useForm<PernikahanValues>({
    resolver: zodResolver(pernikahanSchema),
    defaultValues: {
      klasis: "",
      tanggal: "",
      jemaatIds: [],
    },
  });

  const createBaptis = async (values: BaptisValues) => {
    try {
      if (editingBaptisId) {
        const res = await fetch(`/api/baptis/${editingBaptisId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message ?? "Gagal memperbarui");

        setBaptisList((prev) => prev.map(item => item.idBaptis === editingBaptisId ? payload.data : item));
        setEditingBaptisId(null);
        toast.success("Data baptis diperbarui");
      } else {
        const res = await fetch("/api/baptis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message ?? "Gagal menyimpan");
        setBaptisList((prev) => [payload.data, ...prev]);
        toast.success("Data baptis tersimpan");
      }
      baptisForm.reset();
      setOpenBaptis(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    }
  };

  const handleDeleteBaptis = async (id: string) => {
    try {
      const res = await fetch(`/api/baptis/${id}`, { method: "DELETE" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message ?? "Gagal menghapus");
      setBaptisList((prev) => prev.filter((item) => item.idBaptis !== id));
      toast.success("Data baptis dihapus");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "baptis") {
      await handleDeleteBaptis(deleteTarget.id);
    } else if (deleteTarget.type === "sidi") {
      await handleDeleteSidi(deleteTarget.id);
    } else if (deleteTarget.type === "pernikahan") {
      await handleDeletePernikahan(deleteTarget.id);
    }
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const openDeleteDialog = (id: string, type: "baptis" | "sidi" | "pernikahan") => {
    setDeleteTarget({ id, type });
    setDeleteDialogOpen(true);
  };

  const handleEditBaptis = (item: BaptisRecord) => {
    setEditingBaptisId(item.idBaptis);
    baptisForm.reset({
      idJemaat: item.idJemaat,
      idKlasis: item.idKlasis,
      tanggal: new Date(item.tanggal).toISOString().split("T")[0],
    });
    setOpenBaptis(true);
  };

  const createSidi = async (values: BaptisValues) => {
    try {
      if (editingSidiId) {
        const res = await fetch(`/api/sidi/${editingSidiId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message ?? "Gagal memperbarui");

        setSidiList((prev) => prev.map(item => item.idSidi === editingSidiId ? payload.data : item));
        setEditingSidiId(null);
        toast.success("Data sidi diperbarui");
      } else {
        const res = await fetch("/api/sidi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message ?? "Gagal menyimpan");
        setSidiList((prev) => [payload.data, ...prev]);
        toast.success("Data sidi tersimpan");
      }
      sidiForm.reset();
      setOpenSidi(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    }
  };

  const handleDeleteSidi = async (id: string) => {
    try {
      const res = await fetch(`/api/sidi/${id}`, { method: "DELETE" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message ?? "Gagal menghapus");
      setSidiList((prev) => prev.filter((item) => item.idSidi !== id));
      toast.success("Data sidi dihapus");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    }
  };

  const handleEditSidi = (item: SidiRecord) => {
    setEditingSidiId(item.idSidi);
    sidiForm.reset({
      idJemaat: item.idJemaat,
      idKlasis: item.idKlasis,
      tanggal: new Date(item.tanggal).toISOString().split("T")[0],
    });
    setOpenSidi(true);
  };

  const createPernikahan = async (values: PernikahanValues) => {
    const [id1, id2] = values.jemaatIds;
    const jemaat1 = masters.jemaat.find((j) => j.idJemaat === id1);
    const jemaat2 = masters.jemaat.find((j) => j.idJemaat === id2);

    const gender1 = jemaat1?.jenisKelamin === true || String(jemaat1?.jenisKelamin) === "true";
    const gender2 = jemaat2?.jenisKelamin === true || String(jemaat2?.jenisKelamin) === "true";

    if (jemaat1 && jemaat2 && gender1 === gender2) {
      toast.error("Pasangan tidak boleh berjenis kelamin sama");
      return;
    }

    try {
      if (editingPernikahanId) {
        const res = await fetch(`/api/pernikahan/${editingPernikahanId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            klasis: values.klasis,
            tanggal: values.tanggal,
            jemaatIds: values.jemaatIds,
          }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message ?? "Gagal memperbarui");

        setPernikahanList((prev) => prev.map(item => item.idPernikahan === editingPernikahanId ? payload.data : item));
        setEditingPernikahanId(null);
        toast.success("Data pernikahan diperbarui");
      } else {
        const res = await fetch("/api/pernikahan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            klasis: values.klasis,
            tanggal: values.tanggal,
            jemaatIds: values.jemaatIds,
          }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message ?? "Gagal menyimpan");
        setPernikahanList((prev) => [payload.data, ...prev]);
        toast.success("Data pernikahan tersimpan");
      }
      pernikahanForm.reset();
      setOpenPernikahan(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    }
  };

  const handleDeletePernikahan = async (id: string) => {
    try {
      const res = await fetch(`/api/pernikahan/${id}`, { method: "DELETE" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message ?? "Gagal menghapus");
      setPernikahanList((prev) => prev.filter((item) => item.idPernikahan !== id));
      toast.success("Data pernikahan dihapus");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    }
  };

  const handleEditPernikahan = (item: PernikahanRecord) => {
    setEditingPernikahanId(item.idPernikahan);
    pernikahanForm.reset({
      klasis: item.klasis,
      tanggal: new Date(item.tanggal).toISOString().split("T")[0],
      jemaatIds: item.jemaats.map(j => j.idJemaat),
    });
    setOpenPernikahan(true);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">Sakramen</h2>
      <p className="text-sm text-muted-foreground">
        Catatan baptis, sidi, dan pernikahan jemaat.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari..."
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

      <Tabs className="mt-6" defaultValue={initialTab ?? "baptis"}>

        <TabsContent value="baptis" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openBaptis} onOpenChange={setOpenBaptis}>
              <DialogTrigger asChild>
                <Button>Tambah Data Baptis</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingBaptisId ? "Edit Data Baptis" : "Tambah Data Baptis"}</DialogTitle>
                </DialogHeader>
                <Form {...baptisForm}>
                  <form
                    className="grid gap-4 py-4"
                    onSubmit={baptisForm.handleSubmit(createBaptis)}
                  >
                    <FormField
                      control={baptisForm.control}
                      name="idJemaat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jemaat <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih jemaat" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-60">
                              {masters.jemaat.map((item) => (
                                <SelectItem key={item.idJemaat} value={item.idJemaat}>
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
                      control={baptisForm.control}
                      name="idKlasis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Klasis <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {masters.klasis.map((item) => (
                                <SelectItem key={item.idKlasis} value={item.idKlasis}>
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
                      control={baptisForm.control}
                      name="tanggal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tanggal <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit">Simpan Baptis</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Baptis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">

              {filteredBaptis.map((item) => (
                <div key={item.idBaptis} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{item.jemaat?.nama ?? "-"}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.tanggal).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleEditBaptis(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => openDeleteDialog(item.idBaptis, "baptis")}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sidi" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openSidi} onOpenChange={setOpenSidi}>
              <DialogTrigger asChild>
                <Button>Tambah Data Sidi</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingSidiId ? "Edit Data Sidi" : "Tambah Data Sidi"}</DialogTitle>
                </DialogHeader>
                <Form {...sidiForm}>
                  <form
                    className="grid gap-4 py-4"
                    onSubmit={sidiForm.handleSubmit(createSidi)}
                  >
                    <FormField
                      control={sidiForm.control}
                      name="idJemaat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jemaat <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih jemaat" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-60">
                              {masters.jemaat.map((item) => (
                                <SelectItem key={item.idJemaat} value={item.idJemaat}>
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
                      control={sidiForm.control}
                      name="idKlasis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Klasis <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {masters.klasis.map((item) => (
                                <SelectItem key={item.idKlasis} value={item.idKlasis}>
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
                      control={sidiForm.control}
                      name="tanggal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tanggal <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit">Simpan Sidi</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Sidi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">

              {filteredSidi.map((item) => (
                <div key={item.idSidi} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{item.jemaat?.nama ?? "-"}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.tanggal).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleEditSidi(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => openDeleteDialog(item.idSidi, "sidi")}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pernikahan" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openPernikahan} onOpenChange={setOpenPernikahan}>
              <DialogTrigger asChild>
                <Button>Tambah Data Pernikahan</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingPernikahanId ? "Edit Data Pernikahan" : "Tambah Data Pernikahan"}</DialogTitle>
                </DialogHeader>
                <Form {...pernikahanForm}>
                  <form
                    className="grid gap-4 py-4"
                    onSubmit={pernikahanForm.handleSubmit(createPernikahan)}
                  >
                    <FormField
                      control={pernikahanForm.control}
                      name="klasis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Klasis <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih klasis" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {masters.klasis.map((item) => (
                                <SelectItem key={item.idKlasis} value={item.nama}>
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
                      control={pernikahanForm.control}
                      name="tanggal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tanggal <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Pasangan 1 */}
                    <FormField
                      control={pernikahanForm.control}
                      name="jemaatIds"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Pasangan 1 <span className="text-red-500">*</span></FormLabel>
                          <Popover open={openCombobox1} onOpenChange={setOpenCombobox1}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between",
                                    !field.value?.[0] && "text-muted-foreground"
                                  )}
                                >
                                  {field.value?.[0]
                                    ? masters.jemaat.find(
                                      (j) => j.idJemaat === field.value[0]
                                    )?.nama
                                    : "Pilih jemaat"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                              <Command>
                                <CommandInput placeholder="Cari jemaat..." />
                                <CommandList>
                                  <CommandEmpty>Jemaat tidak ditemukan.</CommandEmpty>
                                  <CommandGroup>
                                    {masters.jemaat.map((jemaat) => (
                                      <CommandItem
                                        value={jemaat.nama}
                                        key={jemaat.idJemaat}
                                        onSelect={() => {
                                          const newValue = [...(field.value || [])];
                                          newValue[0] = jemaat.idJemaat;
                                          field.onChange(newValue);
                                          setOpenCombobox1(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            jemaat.idJemaat === field.value?.[0]
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {jemaat.nama}
                                        <span className="ml-2 text-xs text-muted-foreground">
                                          ({jemaat.jenisKelamin ? "L" : "P"})
                                        </span>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Pasangan 2 */}
                    <FormField
                      control={pernikahanForm.control}
                      name="jemaatIds"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Pasangan 2 <span className="text-red-500">*</span></FormLabel>
                          <Popover open={openCombobox2} onOpenChange={setOpenCombobox2}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between",
                                    !field.value?.[1] && "text-muted-foreground"
                                  )}
                                >
                                  {field.value?.[1]
                                    ? masters.jemaat.find(
                                      (j) => j.idJemaat === field.value[1]
                                    )?.nama
                                    : "Pilih jemaat"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                              <Command>
                                <CommandInput placeholder="Cari jemaat..." />
                                <CommandList>
                                  <CommandEmpty>Jemaat tidak ditemukan.</CommandEmpty>
                                  <CommandGroup>
                                    {masters.jemaat.map((jemaat) => (
                                      <CommandItem
                                        value={jemaat.nama}
                                        key={jemaat.idJemaat}
                                        onSelect={() => {
                                          const newValue = [...(field.value || [])];
                                          newValue[1] = jemaat.idJemaat;
                                          field.onChange(newValue);
                                          setOpenCombobox2(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            jemaat.idJemaat === field.value?.[1]
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {jemaat.nama}
                                        <span className="ml-2 text-xs text-muted-foreground">
                                          ({jemaat.jenisKelamin ? "L" : "P"})
                                        </span>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="submit">Simpan Pernikahan</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Pernikahan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">

              {filteredPernikahan.map((item) => (
                <div key={item.idPernikahan} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-semibold">{item.klasis}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.tanggal).toLocaleDateString("id-ID")}
                    </p>
                    <p className="text-sm">
                      Pasangan: {item.jemaats.map((j) => j.nama).join(", ")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleEditPernikahan(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => openDeleteDialog(item.idPernikahan, "pernikahan")}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data akan dihapus secara permanen dari database.
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

