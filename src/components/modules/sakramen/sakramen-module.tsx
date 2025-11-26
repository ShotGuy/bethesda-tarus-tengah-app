"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
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

type BaptisRecord = {
  idBaptis: string;
  tanggal: string;
  jemaat?: { nama: string };
};

type SidiRecord = {
  idSidi: string;
  tanggal: string;
  jemaat?: { nama: string };
};

type PernikahanRecord = {
  idPernikahan: string;
  klasis: string;
  tanggal: string;
  jemaats: Array<{ nama: string }>;
};

type Props = {
  data: {
    baptis: BaptisRecord[];
    sidi: SidiRecord[];
    pernikahan: PernikahanRecord[];
  };
  masters: {
    jemaat: Array<{ idJemaat: string; nama: string }>;
    klasis: Array<{ idKlasis: string; nama: string }>;
  };
  initialTab?: "baptis" | "sidi" | "pernikahan";
};

const baptisSchema = z.object({
  idJemaat: z.string().min(1),
  idKlasis: z.string().min(1),
  tanggal: z.string(),
});

const sidiSchema = baptisSchema;

const pernikahanSchema = z.object({
  klasis: z.string().min(2),
  tanggal: z.string(),
  jemaatIds: z
    .string()
    .min(3)
    .transform((value) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    )
    .refine((arr) => arr.length >= 2, "Minimal 2 jemaat"),
});

type BaptisValues = z.infer<typeof baptisSchema>;
type PernikahanValues = z.infer<typeof pernikahanSchema>;

export default function SakramenModule({ data, masters, initialTab }: Props) {
  const [baptisList, setBaptisList] = useState(data.baptis);
  const [sidiList, setSidiList] = useState(data.sidi);
  const [pernikahanList, setPernikahanList] = useState(data.pernikahan);

  const baptisForm = useForm<BaptisValues>({
    resolver: zodResolver(baptisSchema),
  });
  const sidiForm = useForm<BaptisValues>({
    resolver: zodResolver(sidiSchema),
  });
  const pernikahanForm = useForm<PernikahanValues>({
    resolver: zodResolver(pernikahanSchema),
  });

  const createBaptis = async (values: BaptisValues) => {
    try {
      const res = await fetch("/api/baptis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message ?? "Gagal menyimpan");
      setBaptisList((prev) => [payload.data, ...prev]);
      baptisForm.reset();
      toast.success("Data baptis tersimpan");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    }
  };

  const createSidi = async (values: BaptisValues) => {
    try {
      const res = await fetch("/api/sidi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message ?? "Gagal menyimpan");
      setSidiList((prev) => [payload.data, ...prev]);
      sidiForm.reset();
      toast.success("Data sidi tersimpan");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    }
  };

  const createPernikahan = async (values: PernikahanValues) => {
    try {
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
      pernikahanForm.reset();
      toast.success("Data pernikahan tersimpan");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">Sakramen</h2>
      <p className="text-sm text-muted-foreground">
        Catatan baptis, sidi, dan pernikahan jemaat.
      </p>

      <Tabs className="mt-6" defaultValue={initialTab ?? "baptis"}>
        <TabsList>
          <TabsTrigger value="baptis">Baptis</TabsTrigger>
          <TabsTrigger value="sidi">Sidi</TabsTrigger>
          <TabsTrigger value="pernikahan">Pernikahan</TabsTrigger>
        </TabsList>

        <TabsContent value="baptis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tambah Data Baptis</CardTitle>
              <CardDescription>
                Pilih jemaat yang akan dicatat sakramen baptisnya.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...baptisForm}>
                <form
                  className="grid gap-4 sm:grid-cols-3"
                  onSubmit={baptisForm.handleSubmit(createBaptis)}
                >
                  <FormField
                    control={baptisForm.control}
                    name="idJemaat"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
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
                    control={baptisForm.control}
                    name="idKlasis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Klasis</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
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
                        <FormLabel>Tanggal</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="sm:col-span-3">
                    <Button type="submit">Simpan Baptis</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Baptis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {baptisList.map((item) => (
                <div key={item.idBaptis} className="rounded-lg border p-3">
                  <p className="font-medium">{item.jemaat?.nama ?? "-"}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(item.tanggal).toLocaleDateString("id-ID")}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sidi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tambah Data Sidi</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...sidiForm}>
                <form
                  className="grid gap-4 sm:grid-cols-3"
                  onSubmit={sidiForm.handleSubmit(createSidi)}
                >
                  <FormField
                    control={sidiForm.control}
                    name="idJemaat"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
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
                    control={sidiForm.control}
                    name="idKlasis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Klasis</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
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
                        <FormLabel>Tanggal</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="sm:col-span-3">
                    <Button type="submit">Simpan Sidi</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Sidi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sidiList.map((item) => (
                <div key={item.idSidi} className="rounded-lg border p-3">
                  <p className="font-medium">{item.jemaat?.nama ?? "-"}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(item.tanggal).toLocaleDateString("id-ID")}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pernikahan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tambah Data Pernikahan</CardTitle>
              <CardDescription>
                Masukkan ID jemaat (pisahkan dengan koma) minimal dua orang.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...pernikahanForm}>
                <form
                  className="space-y-4"
                  onSubmit={pernikahanForm.handleSubmit(createPernikahan)}
                >
                  <FormField
                    control={pernikahanForm.control}
                    name="klasis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Klasis</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={pernikahanForm.control}
                    name="tanggal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={pernikahanForm.control}
                    name="jemaatIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Jemaat (pisahkan dengan koma)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Contoh: JM0001, JM0002"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Simpan Pernikahan</Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Pernikahan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pernikahanList.map((item) => (
                <div key={item.idPernikahan} className="rounded-lg border p-3">
                  <p className="font-semibold">{item.klasis}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(item.tanggal).toLocaleDateString("id-ID")}
                  </p>
                  <p className="text-sm">
                    Pasangan: {item.jemaats.map((j) => j.nama).join(", ")}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

