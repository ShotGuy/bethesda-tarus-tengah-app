"use client";

import { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { MasterDataset, MasterField } from "@/constants/master-datasets";

type MasterItem = Record<string, unknown>;
type DropdownOption = { id: string; name: string; [key: string]: unknown };

type Props = {
  config: MasterDataset;
  initialItems: MasterItem[];
};

const buildSchema = (fields: MasterDataset["fields"]) =>
  z.object(
    fields.reduce(
      (acc, field) => ({
        ...acc,
        [field.name]: z.string().min(1, `${field.label} wajib diisi`),
      }),
      {} as Record<string, z.ZodString>,
    ),
  );

const defaultValues = (fields: MasterDataset["fields"]) =>
  fields.reduce(
    (acc, field) => ({
      ...acc,
      [field.name]: "",
    }),
    {} as Record<string, string>,
  );

/**
 * Get the ID field name for a given model based on field name
 * e.g., "idProv" -> "idProv", "idKotaKab" -> "idKotaKab"
 */
const getIdFieldForDropdown = (fieldName: string): string => fieldName;

export const MasterDataManager = ({ config, initialItems }: Props) => {
  const [items, setItems] = useState<MasterItem[]>(initialItems);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterItem | null>(null);

  // Dropdown state: store options for each dropdown field
  const [dropdownOptions, setDropdownOptions] = useState<Record<string, DropdownOption[]>>({});
  const [loadingDropdowns, setLoadingDropdowns] = useState<Record<string, boolean>>({});

  const schema = useMemo(() => buildSchema(config.fields), [config.fields]);
  const createForm = useForm<Record<string, string>>({
    resolver: zodResolver(schema) as any,
    defaultValues: defaultValues(config.fields),
  });
  const editForm = useForm<Record<string, string>>({
    resolver: zodResolver(schema) as any,
    defaultValues: defaultValues(config.fields),
  });

  const resetForms = () => {
    createForm.reset(defaultValues(config.fields));
    editForm.reset(defaultValues(config.fields));
    setDropdownOptions({});
  };

  // Client-side fallback: if server didn't provide initial items, try fetching from API route
  useEffect(() => {
    let mounted = true;

    const tryFetch = async () => {
      if (items.length > 0) return;

      try {
        const res = await fetch(config.apiPath);
        const data = await res.json();

        if (res.ok && data?.data?.items) {
          if (!mounted) return;
          setItems(data.data.items);
        } else if (res.ok && Array.isArray(data?.data)) {
          if (!mounted) return;
          setItems(data.data);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Client fallback fetch failed for", config.apiPath, err);
      }
    };

    tryFetch();

    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.apiPath]);

  // Keep items in sync when initialItems prop changes (e.g. when navigating between slugs)
  useEffect(() => {
    setItems(initialItems ?? []);
  }, [initialItems]);

  /**
   * Fetch dropdown options for a field
   */
  const fetchDropdownOptions = async (field: MasterField) => {
    if (!field.fetchUrl || field.type !== "dropdown") return;

    setLoadingDropdowns((prev) => ({ ...prev, [field.name]: true }));

    try {
      const res = await fetch(field.fetchUrl);
      const data = await res.json();

      if (res.ok && data?.data?.items) {
        const options = data.data.items.map((item: any) => ({
          id: item[field.name] || item[getIdFieldForDropdown(field.name)],
          name: item[field.displayField || "nama"],
        }));
        setDropdownOptions((prev) => ({ ...prev, [field.name]: options }));
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Failed to fetch dropdown options for ${field.name}:`, err);
      toast.error(`Gagal memuat pilihan untuk ${field.label}`);
    } finally {
      setLoadingDropdowns((prev) => ({ ...prev, [field.name]: false }));
    }
  };

  const handleCreate = async (values: Record<string, string>) => {
    try {
      const res = await fetch(config.apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message ?? `Gagal menambahkan data`);
      }

      setItems((prev) => [data.data, ...prev]);
      resetForms();
      setCreateOpen(false);
      toast.success(`${config.label} berhasil ditambahkan`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Terjadi kesalahan";
      toast.error(msg);
    }
  };

  const handleUpdate = async (values: Record<string, string>) => {
    if (!editingItem) return;

    const id = editingItem[config.idField];

    if (!id) {
      toast.error(`ID tidak ditemukan pada item untuk update`);
      return;
    }

    const url = `${config.apiPath}/${id}`;
    // eslint-disable-next-line no-console
    console.log("PATCH request:", { url, id, idField: config.idField, values });

    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message ?? `Gagal memperbarui data`);
      }

      setItems((prev) =>
        prev.map((item) =>
          item[config.idField] === id ? data.data : item,
        ),
      );
      setEditingItem(null);
      editForm.reset(defaultValues(config.fields));
      toast.success("Data berhasil diperbarui");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Terjadi kesalahan";
      toast.error(msg);
    }
  };

  const handleDelete = async (item: MasterItem) => {
    const id = item[config.idField];
    if (!id) return;

    const url = `${config.apiPath}/${id}`;
    // eslint-disable-next-line no-console
    console.log("DELETE request:", { url, id, idField: config.idField, itemKeys: Object.keys(item) });

    try {
      const res = await fetch(url, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message ?? `Gagal menghapus data`);
      }

      setItems((prev) =>
        prev.filter((current) => current[config.idField] !== id),
      );
      toast.success("Data berhasil dihapus");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Terjadi kesalahan";
      toast.error(msg);
    }
  };

  const openEditDialog = (item: MasterItem) => {
    setEditingItem(item);
    const values = config.fields.reduce(
      (acc, field) => ({
        ...acc,
        [field.name]: String(item[field.name] ?? ""),
      }),
      {} as Record<string, string>,
    );
    editForm.reset(values);
  };

  /**
   * Render form field - either Input or Select depending on field.type
   */
  const renderFormField = (field: MasterField, form: any, disabled: boolean = false) => {
    return (
      <FormField
        key={field.name}
        control={form.control as any}
        name={field.name}
        render={({ field: formField }) => {
          if (field.type === "dropdown") {
            return (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <Select
                  value={formField.value}
                  onValueChange={(value) => {
                    formField.onChange(value);
                  }}
                  onOpenChange={(open) => {
                    if (open && !dropdownOptions[field.name]) {
                      fetchDropdownOptions(field);
                    }
                  }}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={`Pilih ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loadingDropdowns[field.name] ? (
                        <SelectItem value="__loading" disabled>
                          Memuat...
                        </SelectItem>
                      ) : (dropdownOptions[field.name] || []).length > 0 ? (
                      (dropdownOptions[field.name] || []).map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))
                    ) : (
                        <SelectItem value="__no_options" disabled>
                          Tidak ada pilihan
                        </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }

          // Default: text input
          return (
            <FormItem>
              <FormLabel>{field.label}</FormLabel>
              <FormControl>
                <Input placeholder={field.placeholder} {...formField} disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{config.label}</h2>
        <p className="text-sm text-muted-foreground">
          Kelola data master {config.label.toLowerCase()}.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-card p-4">
        <div>
          <h3 className="text-sm font-medium">Tambah {config.label}</h3>
          <p className="text-xs text-muted-foreground">Klik tombol untuk menambahkan data baru.</p>
        </div>
        <div>
          <Button onClick={() => setCreateOpen(true)}>Tambah</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {config.columns.map((column) => (
                <TableHead key={column.name}>{column.label}</TableHead>
              ))}
              <TableHead className="w-32 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={String(item[config.idField])}>
                {config.columns.map((column) => (
                  <TableCell key={column.name}>
                    {item[column.name] == null
                      ? "-"
                      : typeof item[column.name] === "object"
                      ? JSON.stringify(item[column.name])
                      : String(item[column.name])}
                  </TableCell>
                ))}
                <TableCell className="space-x-2 text-right">
                  <Button
                    onClick={() => openEditDialog(item)}
                    size="sm"
                    variant="outline"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(item)}
                    size="sm"
                    variant="destructive"
                  >
                    Hapus
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {config.label}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              className="space-y-4"
              onSubmit={editForm.handleSubmit(handleUpdate)}
            >
              {config.fields.map((field) => renderFormField(field, editForm))}
              <DialogFooter>
                <Button type="submit">Perbarui</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={(open) => setCreateOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah {config.label}</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form className="space-y-4" onSubmit={createForm.handleSubmit(handleCreate)}>
              {config.fields.map((field) => renderFormField(field, createForm))}
              <DialogFooter>
                <Button type="submit">Simpan</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
