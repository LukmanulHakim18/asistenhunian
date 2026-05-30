"use client";

import { useState, useTransition } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, ToggleLeft, ToggleRight, KeyRound } from "lucide-react";
import { createOBAction, updateOBAction } from "@/lib/actions/admin";
import { ApiError } from "@/lib/api/client";
import type { User } from "@/lib/api/types";

interface Props {
  initialOBList: User[];
}

export function OBManager({ initialOBList }: Props) {
  const [obList, setOBList] = useState<User[]>(initialOBList);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetDialog, setResetDialog] = useState<{ open: boolean; ob: User | null }>({
    open: false,
    ob: null,
  });
  const [newPassword, setNewPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });

  const handleAddOB = () => {
    if (!form.full_name || !form.email || !form.password) {
      toast.error("Nama, email, dan password wajib diisi");
      return;
    }
    startTransition(async () => {
      try {
        const newOB = await createOBAction({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
        });
        toast.success("Akun OB berhasil dibuat");
        setOBList((prev) => [...prev, newOB]);
        setDialogOpen(false);
        setForm({ full_name: "", email: "", phone: "", password: "" });
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Gagal menambah OB");
      }
    });
  };

  const handleResetPassword = () => {
    if (!resetDialog.ob || newPassword.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }
    startTransition(async () => {
      try {
        await updateOBAction(resetDialog.ob!.id, { password: newPassword });
        toast.success(`Password ${resetDialog.ob!.full_name} berhasil direset`);
        setResetDialog({ open: false, ob: null });
        setNewPassword("");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Gagal reset password");
      }
    });
  };

  const handleToggleActive = (ob: User) => {
    startTransition(async () => {
      try {
        const updated = await updateOBAction(ob.id, { is_active: !ob.is_active });
        setOBList((prev) => prev.map((o) => (o.id === ob.id ? updated : o)));
        toast.success(`OB ${!ob.is_active ? "diaktifkan" : "dinonaktifkan"}`);
      } catch {
        toast.error("Gagal mengubah status OB");
      }
    });
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
            <TableHead>Email</TableHead>
            <TableHead>No. HP</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {obList.map((ob) => (
            <TableRow key={ob.id}>
              <TableCell className="font-medium">{ob.full_name}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{ob.email || "—"}</TableCell>
              <TableCell>{ob.phone ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={ob.is_active ? "default" : "secondary"}>
                  {ob.is_active ? "Aktif" : "Nonaktif"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setResetDialog({ open: true, ob }); setNewPassword(""); }}
                    title="Reset Password"
                  >
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(ob)}
                    disabled={isPending}
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
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                Belum ada OB terdaftar.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Reset Password Dialog */}
      <Dialog
        open={resetDialog.open}
        onOpenChange={(open) => setResetDialog({ open, ob: resetDialog.ob })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password — {resetDialog.ob?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={resetDialog.ob?.email ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Password Baru *</Label>
              <Input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setResetDialog({ open: false, ob: null })}>
                Batal
              </Button>
              <Button className="flex-1" onClick={handleResetPassword} disabled={isPending}>
                {isPending ? "Menyimpan..." : "Simpan Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add OB Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Akun OB Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Lengkap *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Ahmad Surya" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ahmad@rusun.com" />
            </div>
            <div className="space-y-2">
              <Label>Nomor HP</Label>
              <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08123456789" />
            </div>
            <div className="space-y-2">
              <Label>Password Sementara *</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimal 8 karakter" minLength={8} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button className="flex-1" onClick={handleAddOB} disabled={isPending}>
                {isPending ? "Membuat akun..." : "Buat Akun OB"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
