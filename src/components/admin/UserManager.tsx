"use client";

import { useState, useMemo, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Pencil, Mail } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import {
  updateUserRoleAction,
  updateUserStatusAction,
  sendUserResetPasswordAction,
} from "@/lib/actions/admin";
import type { User, UserRole } from "@/lib/api/types";

interface Props {
  initialUsers: User[];
}

const ROLE_LABEL: Record<UserRole, string> = {
  customer: "Customer",
  ob: "OB",
  admin: "Admin",
};

const ROLE_VARIANT: Record<UserRole, "default" | "secondary" | "outline"> = {
  customer: "default",
  ob: "secondary",
  admin: "outline",
};

export function UserManager({ initialUsers }: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers);

  // Filter state
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [search, setSearch] = useState("");

  // Modal state
  const [editUser, setEditUser] = useState<User | null>(null);
  const [formRole, setFormRole] = useState<"customer" | "ob">("customer");
  const [formActive, setFormActive] = useState(true);

  const [isSaving, startSave] = useTransition();
  const [isSendingReset, startReset] = useTransition();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (activeFilter === "active" && !u.is_active) return false;
      if (activeFilter === "inactive" && u.is_active) return false;
      if (q && !u.full_name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [users, roleFilter, activeFilter, search]);

  const openEdit = (user: User) => {
    setEditUser(user);
    setFormRole(user.role === "admin" ? "customer" : (user.role as "customer" | "ob"));
    setFormActive(user.is_active);
  };

  const handleSave = () => {
    if (!editUser) return;

    startSave(async () => {
      try {
        let updated = editUser;

        if (formRole !== editUser.role) {
          updated = await updateUserRoleAction(editUser.id, formRole);
        }

        if (formActive !== editUser.is_active) {
          updated = await updateUserStatusAction(editUser.id, formActive);
        }

        setUsers((prev) => prev.map((u) => (u.id === editUser.id ? updated : u)));
        toast.success(`User ${editUser.full_name} berhasil diperbarui`);
        setEditUser(null);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Gagal memperbarui user");
      }
    });
  };

  const handleSendReset = () => {
    if (!editUser) return;

    startReset(async () => {
      try {
        await sendUserResetPasswordAction(editUser.id);
        toast.success(`Link reset password dikirim ke ${editUser.email}`);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Gagal mengirim link reset");
      }
    });
  };

  const isAdmin = editUser?.role === "admin";
  const hasChanges =
    editUser && (formRole !== editUser.role || formActive !== editUser.is_active);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Cari nama atau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as UserRole | "all")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Semua Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Role</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="ob">OB</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={activeFilter}
          onValueChange={(v) => setActiveFilter(v as "all" | "active" | "inactive")}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground self-center ml-auto">
          {filtered.length} user
        </span>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-medium">Nama</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium">Unit</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Terdaftar</th>
              <th className="text-right px-4 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  Tidak ada user yang sesuai filter.
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr
                  key={user.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{user.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={ROLE_VARIANT[user.role]}>{ROLE_LABEL[user.role]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.unit_number ?? <span className="italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {user.is_active ? (
                      <Badge variant="default" className="bg-green-600">
                        Aktif
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Nonaktif</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(user)}
                      title="Edit user"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit User: {editUser?.full_name}</DialogTitle>
          </DialogHeader>

          {editUser && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">Email</Label>
                <p className="text-sm font-medium">{editUser.email}</p>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Admin</Badge>
                    <span className="text-xs text-muted-foreground">Role admin tidak dapat diubah</span>
                  </div>
                ) : (
                  <Select
                    value={formRole}
                    onValueChange={(v) => setFormRole(v as "customer" | "ob")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="ob">OB</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Status Akun</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormActive(true)}
                    className={formActive ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    Aktif
                  </Button>
                  <Button
                    type="button"
                    variant={!formActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormActive(false)}
                    className={!formActive ? "bg-destructive hover:bg-destructive/90" : ""}
                  >
                    Nonaktif
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-1.5">
                <p className="text-sm font-medium">Reset Password</p>
                <p className="text-xs text-muted-foreground">
                  Kirim link reset password ke email user.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-1"
                  onClick={handleSendReset}
                  disabled={isSendingReset}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {isSendingReset ? "Mengirim..." : "Kirim Link Reset Password"}
                </Button>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditUser(null)}
                  disabled={isSaving}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                >
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
