"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import type { Service, ServiceCategory } from "@/types/database";

interface Props {
  initialServices: Service[];
  categories: ServiceCategory[];
}

type ServiceForm = {
  name: string;
  description: string;
  price: string;
  category_id: string;
  sort_order: string;
};

const emptyForm: ServiceForm = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  sort_order: "0",
};

export function CatalogManager({ initialServices, categories }: Props) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const openAdd = () => {
    setEditingService(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditingService(service);
    setForm({
      name: service.name,
      description: service.description ?? "",
      price: String(service.price),
      category_id: service.category_id ?? "",
      sort_order: String(service.sort_order),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast.error("Nama dan harga wajib diisi");
      return;
    }
    setSaving(true);

    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      category_id: form.category_id || null,
      sort_order: parseInt(form.sort_order, 10) || 0,
    };

    if (editingService) {
      const { error } = await supabase
        .from("services")
        .update(payload)
        .eq("id", editingService.id);
      if (error) {
        toast.error("Gagal menyimpan perubahan");
      } else {
        toast.success("Layanan berhasil diperbarui");
        router.refresh();
        setDialogOpen(false);
      }
    } else {
      const { data, error } = await supabase
        .from("services")
        .insert({ ...payload, is_active: true })
        .select()
        .single();
      if (error || !data) {
        toast.error("Gagal menambah layanan");
      } else {
        toast.success("Layanan berhasil ditambahkan");
        setServices((prev) => [...prev, data as unknown as Service]);
        setDialogOpen(false);
      }
    }
    setSaving(false);
  };

  const handleToggleActive = async (service: Service) => {
    const { error } = await supabase
      .from("services")
      .update({ is_active: !service.is_active } as object)
      .eq("id", service.id);
    if (error) {
      toast.error("Gagal mengubah status");
    } else {
      setServices((prev) =>
        prev.map((s) =>
          s.id === service.id ? { ...s, is_active: !s.is_active } : s
        )
      );
      toast.success(`Layanan ${!service.is_active ? "diaktifkan" : "dinonaktifkan"}`);
    }
  };

  const handleDelete = async (service: Service) => {
    if (!confirm(`Hapus layanan "${service.name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", service.id);
    if (error) {
      toast.error("Gagal menghapus layanan");
    } else {
      setServices((prev) => prev.filter((s) => s.id !== service.id));
      toast.success("Layanan dihapus");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Layanan
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead className="text-right">Harga</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => {
            const category = categories.find(
              (c) => c.id === service.category_id
            );
            return (
              <TableRow key={service.id}>
                <TableCell>
                  <p className="font-medium">{service.name}</p>
                  {service.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {service.description}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  {category ? (
                    <Badge variant="outline">{category.name}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(service.price)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={service.is_active ? "default" : "secondary"}
                  >
                    {service.is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(service)}
                      title={service.is_active ? "Nonaktifkan" : "Aktifkan"}
                    >
                      {service.is_active ? (
                        <ToggleRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(service)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(service)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {services.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                Belum ada layanan. Tambahkan layanan pertama!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Edit Layanan" : "Tambah Layanan Baru"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Layanan *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Bersih Unit Studio"
              />
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select
                value={form.category_id}
                onValueChange={(v) => setForm({ ...form, category_id: String(v ?? "") })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Harga (Rp) *</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="75000"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Deskripsi singkat layanan..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Urutan Tampil</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: e.target.value })
                }
                min="0"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDialogOpen(false)}
              >
                Batal
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
