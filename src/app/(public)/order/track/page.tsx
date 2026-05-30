"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const router = useRouter();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = orderNumber.trim().toUpperCase();
    if (normalized) router.push(`/order/${normalized}/track`);
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Cek Status Order</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Nomor Order</Label>
              <Input
                id="orderNumber"
                placeholder="ORD-20260514-001"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Cek Status
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
