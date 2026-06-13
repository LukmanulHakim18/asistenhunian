"use client";

import Image from "next/image";

export function QrisPayment({ qrUrl }: { qrUrl: string }) {
  return (
    <div className="mb-4 rounded-lg border p-4 flex flex-col items-center gap-3 text-center">
      <p className="text-sm font-medium">Scan QR Code untuk membayar</p>
      <div className="relative w-52 h-52">
        <Image
          src={qrUrl}
          alt="QR Code Pembayaran QRIS"
          fill
          className="object-contain"
          unoptimized
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Buka aplikasi e-wallet atau mobile banking, lalu scan QR di atas.
      </p>
    </div>
  );
}
