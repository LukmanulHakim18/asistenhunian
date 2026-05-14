"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { Service } from "@/types/database";

interface OrderItem {
  service: Service;
  quantity: number;
}

interface OrderFormProps {
  allServices: Service[];
}

type Step = 1 | 2 | 3;

export function OrderForm({ allServices }: OrderFormProps) {
  const [step, setStep] = useState<Step>(1);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Customer fields
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [preferredTimeNote, setPreferredTimeNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">(
    "cash"
  );

  const supabase = createClient();

  // Parse items from URL and pre-fill from user profile
  useEffect(() => {
    const itemsParam = searchParams.get("items");
    if (itemsParam) {
      const parsed = itemsParam.split(",").flatMap((part) => {
        const [id, qty] = part.split(":");
        const service = allServices.find((s) => s.id === id);
        if (!service) return [];
        return [{ service, quantity: parseInt(qty, 10) || 1 }];
      });
      setItems(parsed);
    }

    // Pre-fill if logged in
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase
        .from("profiles")
        .select("full_name, phone, unit_number")
        .eq("id", data.user.id)
        .returns<{ full_name: string; phone: string | null; unit_number: string | null }[]>()
        .single()
        .then(({ data: profile }) => {
          if (!profile) return;
          setCustomerName(profile.full_name ?? "");
          setCustomerPhone(profile.phone ?? "");
          setUnitNumber(profile.unit_number ?? "");
          setCustomerEmail(data.user?.email ?? "");
        });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subtotal = items.reduce(
    (sum, item) => sum + item.service.price * item.quantity,
    0
  );

  const updateQuantity = (serviceId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.service.id === serviceId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const addService = (service: Service) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.service.id === service.id);
      if (existing) {
        return prev.map((i) =>
          i.service.id === service.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { service, quantity: 1 }];
    });
  };

  const handleSubmitOrder = async () => {
    if (items.length === 0) {
      toast.error("Pilih minimal satu layanan");
      return;
    }
    setLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          unitNumber,
          requestedDate,
          preferredTimeNote,
          paymentMethod,
          items: items.map((i) => ({
            serviceId: i.service.id,
            serviceName: i.service.name,
            servicePrice: i.service.price,
            quantity: i.quantity,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error ?? "Gagal membuat order");
        setLoading(false);
        return;
      }

      router.push(`/order/${result.orderId}/success`);
    } catch {
      toast.error("Terjadi kesalahan, coba lagi");
      setLoading(false);
    }
  };

  // Minimum date = tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {([1, 2, 3] as const).map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step === s
                  ? "bg-primary text-primary-foreground"
                  : step > s
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s ? "✓" : s}
            </div>
            {s < 3 && (
              <div
                className={`h-1 w-16 mx-1 rounded ${
                  step > s ? "bg-green-500" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
        <div className="ml-4 text-sm text-muted-foreground">
          {step === 1 && "Pilih Layanan"}
          {step === 2 && "Data & Jadwal"}
          {step === 3 && "Konfirmasi"}
        </div>
      </div>

      {/* Step 1: Pilih Layanan */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Pilih Layanan</h2>

          {/* Selected items */}
          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Layanan Dipilih</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((item) => (
                  <div key={item.service.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.service.price)} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.service.id, -1)}
                      >
                        −
                      </Button>
                      <span className="w-6 text-center font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.service.id, 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add more services */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tambah Layanan Lain</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {allServices
                .filter((s) => !items.find((i) => i.service.id === s.id))
                .map((service) => (
                  <div key={service.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-primary font-semibold">
                        {formatCurrency(service.price)}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => addService(service)}>
                      + Tambah
                    </Button>
                  </div>
                ))}
            </CardContent>
          </Card>

          <Button
            className="w-full"
            disabled={items.length === 0}
            onClick={() => setStep(2)}
          >
            Lanjut →
          </Button>
        </div>
      )}

      {/* Step 2: Data Diri & Jadwal */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Data Diri & Jadwal</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap *</Label>
              <Input
                id="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Budi Santoso"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Nomor Unit *</Label>
              <Input
                id="unit"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                placeholder="A-101"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor WhatsApp *</Label>
              <Input
                id="phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="08123456789"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="budi@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Tanggal yang Diinginkan *</Label>
              <Input
                id="date"
                type="date"
                min={minDateStr}
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeNote">Preferensi Waktu (opsional)</Label>
              <Textarea
                id="timeNote"
                value={preferredTimeNote}
                onChange={(e) => setPreferredTimeNote(e.target.value)}
                placeholder="Misal: pagi jam 09.00-11.00, atau siang setelah 13.00"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Metode Pembayaran *</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) =>
                  setPaymentMethod(String(v) as "cash" | "transfer")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    Cash — Bayar langsung ke OB saat selesai
                  </SelectItem>
                  <SelectItem value="transfer">
                    Transfer — Bayar via Midtrans (QRIS, VA, Kartu)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
              ← Kembali
            </Button>
            <Button
              className="flex-1"
              disabled={
                !customerName ||
                !customerEmail ||
                !customerPhone ||
                !unitNumber ||
                !requestedDate
              }
              onClick={() => setStep(3)}
            >
              Review Order →
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Konfirmasi */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Konfirmasi Order</h2>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Layanan Dipesan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((item) => (
                <div key={item.service.id} className="flex justify-between text-sm">
                  <span>
                    {item.service.name} × {item.quantity}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(item.service.price * item.quantity)}
                  </span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data & Jadwal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="grid grid-cols-2 gap-1">
                <span className="text-muted-foreground">Nama</span>
                <span className="font-medium">{customerName}</span>
                <span className="text-muted-foreground">Nomor Unit</span>
                <span className="font-medium">{unitNumber}</span>
                <span className="text-muted-foreground">WhatsApp</span>
                <span className="font-medium">{customerPhone}</span>
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{customerEmail}</span>
                <span className="text-muted-foreground">Tanggal</span>
                <span className="font-medium">{requestedDate}</span>
                {preferredTimeNote && (
                  <>
                    <span className="text-muted-foreground">Preferensi Waktu</span>
                    <span className="font-medium">{preferredTimeNote}</span>
                  </>
                )}
                <span className="text-muted-foreground">Pembayaran</span>
                <span className="font-medium capitalize">
                  {paymentMethod === "cash" ? "Cash ke OB" : "Transfer Online"}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
              ← Kembali
            </Button>
            <Button
              className="flex-1"
              disabled={loading}
              onClick={handleSubmitOrder}
            >
              {loading ? "Memproses..." : "Buat Order ✓"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
