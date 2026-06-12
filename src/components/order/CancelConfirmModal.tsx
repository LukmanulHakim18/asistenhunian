"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber: string;
  onConfirm: (reason: string) => void;
  isPending: boolean;
  requireReason?: boolean;
}

export function CancelConfirmModal({
  open,
  onOpenChange,
  orderNumber,
  onConfirm,
  isPending,
  requireReason = false,
}: Props) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) return;
    onConfirm(reason.trim());
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) setReason("");
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Batalkan Order?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Order <span className="font-mono font-medium text-foreground">{orderNumber}</span> yang
            dibatalkan tidak dapat dikembalikan.
          </p>

          <div className="space-y-1.5">
            <Label className="text-sm">
              Alasan pembatalan{requireReason ? " *" : " (opsional)"}
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tulis alasan pembatalan..."
              rows={3}
            />
            {requireReason && !reason.trim() && (
              <p className="text-xs text-destructive">Alasan wajib diisi</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Kembali
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleConfirm}
              disabled={isPending || (requireReason && !reason.trim())}
            >
              {isPending ? "Memproses..." : "Ya, Batalkan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
