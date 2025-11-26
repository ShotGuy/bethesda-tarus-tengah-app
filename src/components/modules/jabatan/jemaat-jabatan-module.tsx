"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Assignment = {
  idJemaat: string;
  idJabatan: string;
  tanggalMulai: string;
  tanggalBerakhir?: string | null;
  statusAktif: boolean;
  jabatan?: { namaJabatan: string };
};

type Props = {
  initialData: Assignment[];
  masters: {
    jemaat: Array<{ idJemaat: string; nama: string }>;
    jabatan: Array<{ idJabatan: string; namaJabatan: string }>;
  };
};

const schema = z.object({
  idJemaat: z.string().min(1),
  idJabatan: z.string().min(1),
  tanggalMulai: z.string(),
  tanggalBerakhir: z.string().optional(),
  statusAktif: z.boolean().default(true),
  catatan: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const buildDeletePath = (assignment: Assignment) =>
  `/api/jemaat-jabatan/${assignment.idJemaat}/${assignment.idJabatan}/${assignment.tanggalMulai}`;

export default function JemaatJabatanModule({ initialData, masters }: Props) {
  const [items, setItems] = useState(initialData);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      statusAktif: true,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await fetch("/api/jemaat-jabatan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload?.message ?? "Gagal menambahkan jabatan");
      }

      setItems((prev) => [payload.data, ...prev]);
      form.reset({ statusAktif: true });
      toast.success("Jabatan jemaat tersimpan");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    }
  };

  const removeAssignment = async (assignment: Assignment) => {
    try {
      await fetch(buildDeletePath(assignment), { method: "DELETE" });
      setItems((prev) =>
        prev.filter(
          (item) =>
            !(
              item.idJemaat === assignment.idJemaat &&
              item.idJabatan === assignment.idJabatan &&
              item.tanggalMulai === assignment.tanggalMulai
            ),
        ),
      );
      toast.success("Relasi jabatan dihapus");
    } catch {
      toast.error("Gagal menghapus data");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Jabatan Jemaat</h2>
        <p className="text-sm text-muted-foreground">
          Catat penugasan jabatan pelayanan jemaat.
        </p>
      </div>

      <Form {...form}>
        <form
          className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="idJemaat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jemaat</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
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
            control={form.control}
            name="idJabatan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jabatan</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jabatan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {masters.jabatan.map((item) => (
                      <SelectItem key={item.idJabatan} value={item.idJabatan}>
                        {item.namaJabatan}
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
            name="tanggalMulai"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Mulai</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tanggalBerakhir"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Berakhir</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="catatan"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Catatan</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="statusAktif"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(!!checked)}
                  />
                </FormControl>
                <FormLabel className="mb-0">Masih aktif</FormLabel>
              </FormItem>
            )}
          />
          <div className="sm:col-span-2">
            <Button type="submit">Simpan Penugasan</Button>
          </div>
        </form>
      </Form>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jemaat</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={`${item.idJemaat}-${item.idJabatan}-${item.tanggalMulai}`}>
                <TableCell>{item.idJemaat}</TableCell>
                <TableCell>{item.jabatan?.namaJabatan ?? "-"}</TableCell>
                <TableCell>
                  {new Date(item.tanggalMulai).toLocaleDateString("id-ID")}
                  {item.tanggalBerakhir
                    ? ` - ${new Date(item.tanggalBerakhir).toLocaleDateString("id-ID")}`
                    : ""}
                </TableCell>
                <TableCell>{item.statusAktif ? "Aktif" : "Nonaktif"}</TableCell>
                <TableCell>
                  <Button
                    onClick={() => removeAssignment(item)}
                    size="sm"
                    variant="ghost"
                  >
                    Hapus
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

