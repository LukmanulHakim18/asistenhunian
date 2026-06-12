"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CancelConfirmModal } from "./CancelConfirmModal";
import { cancelOrderAction } from "@/lib/actions/orders";
import { ApiError } from "@/lib/api/client";
import { toast } from "sonner";

interface Props {
  orderId: string;
  orderNumber: string;
}

export function CancelOrderButton({ orderId, orderNumber }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleConfirm = (reason: string) => {
    startTransition(async () => {
      try {
        await cancelOrderAction(orderId, reason || undefined);
        toast.success("Order berhasil dibatalkan");
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Gagal membatalkan order");
      }
    });
  };

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        Batalkan Order
      </Button>
      <CancelConfirmModal
        open={open}
        onOpenChange={setOpen}
        orderNumber={orderNumber}
        onConfirm={handleConfirm}
        isPending={isPending}
      />
    </>
  );
}
