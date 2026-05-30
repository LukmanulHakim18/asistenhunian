"use client";

import { Button } from "@/components/ui/button";

export function PaymentButton({ paymentUrl }: { paymentUrl: string }) {
  return (
    <div className="mb-4">
      <Button
        onClick={() => { window.location.href = paymentUrl; }}
        className="w-full"
      >
        Bayar Sekarang
      </Button>
    </div>
  );
}
