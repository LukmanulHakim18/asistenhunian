"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, ToggleLeft, ToggleRight } from "lucide-react";
import type { Profile } from "@/types/database";

interface Props {
  initialOBList: Profile[];
}

export function OBManager({ initialOBList }: Props) {
  const [obList, setOBList] = useState<Profile[]>(initialOBList);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleAddOB = async () => {
    if (!form.full_name || !form.email || !form.password) {
      toast.error("Nama, email, dan password wajib diisi");
      return;
    }
    setSaving(true);

    const res = await fetch("/api/admin/ob", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Gagal menambah OB");
    } else {
      toast.success("Akun OB berhasil dibuat");
      setOBList((prev) => [...prev, data.ob as Profile]);
      setDialogOpen(false);
      setForm({ full_name: "", email: "", phone: "", password: "" });
    }
    setSaving(false);
  };

  const handleToggleActive = async (ob: Profile) => {
    const res = await fetch(`/api/admin/ob/${ob.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !ob.is_active }),
    });

    if (res.ok) {
      setOBList((prev) =>
        prev.map((o) =>
          o.id === ob.id ? { ...o, is_active: !o.is_active } : o
        )
      );
      toast.success(`OB ${!ob.is_active ? "diaktifkan" : "dinonaktifkan"}`);
    } else {
      toast.error("Gagal mengubah status OB");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah OB
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>No. HP</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {obList.map((ob) => (
            <TableRow key={ob.id}>
              <TableCell className="font-medium">{ob.full_name}</TableCell>
              <TableCell>{ob.phone ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={ob.is_active ? "default" : "secondary"}>
                  {ob.is_active ? "Aktif" : "Nonaktif"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(ob)}
                    title={ob.is_active ? "Nonaktifkan" : "Aktifkan"}
                  >
                    {ob.is_active ? (
                      <ToggleRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {obList.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center py-8 text-muted-foreground"
              >
                Belum ada OB terdaftar.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Akun OB Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Lengkap *</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Ahmad Surya"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="ahmad@rusun.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Nomor HP</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="08123456789"
              />
            </div>
            <div className="space-y-2">
              <Label>Password Sementara *</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                placeholder="Minimal 8 karakter"
                minLength={8}
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
              <Button
                className="flex-1"
                onClick={handleAddOB}
                disabled={saving}
              >
                {saving ? "Membuat akun..." : "Buat Akun OB"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
