"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { createOrderAction } from "@/lib/actions/orders";
import type { CreateOrderRequest, PaymentMethod, ServiceWithCategory, User } from "@/lib/api/types";
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

interface OrderItem {
  service: ServiceWithCategory;
  quantity: number;
}

interface OrderFormProps {
  allServices: ServiceWithCategory[];
  platformFee?: number;
}

type Step = 1 | 2 | 3;

export function OrderForm({ allServices, platformFee = 0 }: OrderFormProps) {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [preferredTimeNote, setPreferredTimeNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  // Parse items dari URL params — tidak butuh effect karena tidak ada side effect
  const [items, setItems] = useState<OrderItem[]>(() => {
    const itemsParam = searchParams.get("items");
    if (!itemsParam) return [];
    return itemsParam.split(",").flatMap((part) => {
      const [id, qty] = part.split(":");
      const service = allServices.find((s) => s.id === id);
      if (!service) return [];
      return [{ service, quantity: parseInt(qty, 10) || 1 }];
    });
  });

  // Pre-fill dari profil jika user sudah login
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? (res.json() as Promise<User>) : null))
      .then((user) => {
        if (!user) return;
        setCustomerName(user.full_name ?? "");
        setCustomerPhone(user.phone ?? "");
        setUnitNumber(user.unit_number ?? "");
        setCustomerEmail(user.email ?? "");
      })
      .catch(() => {});
  }, []);

  const subtotal = items.reduce(
    (sum, item) => sum + item.service.price * item.quantity,
    0,
  );
  const grandTotal = subtotal + platformFee;

  const categories = useMemo(() =>
    allServices
      .map((s) => s.category)
      .filter((c, i, arr): c is NonNullable<typeof c> =>
        c !== null && arr.findIndex((x) => x?.id === c.id) === i
      )
      .sort((a, b) => a.sort_order - b.sort_order),
    [allServices]
  );

  const filteredAvailableServices = useMemo(() =>
    allServices
      .filter((s) => !items.find((i) => i.service.id === s.id))
      .filter((s) => activeCategory === "all" || s.category_id === activeCategory),
    [allServices, items, activeCategory]
  );

  const updateQuantity = (serviceId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.service.id === serviceId
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const addService = (service: ServiceWithCategory) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.service.id === service.id);
      if (existing) {
        return prev.map((i) =>
          i.service.id === service.id ? { ...i, quantity: i.quantity + 1 } : i,
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
      const payload: CreateOrderRequest = {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        unit_number: unitNumber,
        requested_date: requestedDate,
        payment_method: paymentMethod,
        items: items.map((i) => ({ service_id: i.service.id, quantity: i.quantity })),
      };
      if (preferredTimeNote) payload.preferred_time_note = preferredTimeNote;

      const result = await createOrderAction(payload);

      router.push(`/order/${result.order_number}/success`);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Terjadi kesalahan, coba lagi";
      toast.error(message);
      setLoading(false);
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step Indicator */}
      {(() => {
        const steps = [
          { n: 1 as const, label: "Pilih Layanan" },
          { n: 2 as const, label: "Data & Jadwal" },
          { n: 3 as const, label: "Konfirmasi" },
        ];
        return (
          <div className="relative w-full mb-8">
            {/* Connector lines — from center col-1 to center col-3 */}
            <div className="absolute top-4 left-[16.67%] right-[16.67%] flex -translate-y-1/2">
              <div className={`flex-1 h-1 transition-colors ${step > 1 ? "bg-green-500" : "bg-muted"}`} />
              <div className={`flex-1 h-1 transition-colors ${step > 2 ? "bg-green-500" : "bg-muted"}`} />
            </div>
            {/* Circles + labels */}
            <div className="relative z-10 flex">
              {steps.map(({ n, label }) => (
                <div key={n} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-background transition-colors ${
                      step === n
                        ? "bg-primary text-primary-foreground"
                        : step > n
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > n ? "✓" : n}
                  </div>
                  <span
                    className={`text-xs font-medium text-center transition-colors ${
                      step === n ? "text-primary" : step > n ? "text-green-600" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Step 1: Pilih Layanan */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Pilih Layanan</h2>

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
                      <Button variant="outline" size="sm" onClick={() => updateQuantity(item.service.id, -1)}>−</Button>
                      <span className="w-6 text-center font-semibold">{item.quantity}</span>
                      <Button variant="outline" size="sm" onClick={() => updateQuantity(item.service.id, 1)}>+</Button>
                    </div>
                  </div>
                ))}
                <Separator />
                {platformFee > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Platform Fee</span>
                      <span>{formatCurrency(platformFee)}</span>
                    </div>
                    <Separator />
                  </>
                )}
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
                <Button className="w-full mt-2" onClick={() => setStep(2)}>
                  Lanjut →
                </Button>
              </CardContent>
            </Card>
          )}

          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
              {[{ id: "all", name: "Semua" }, ...categories].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={[
                    "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium shrink-0 transition-colors",
                    activeCategory === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-foreground hover:bg-accent",
                  ].join(" ")}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tambah Layanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredAvailableServices.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2 text-center">
                  Semua layanan di kategori ini sudah dipilih.
                </p>
              ) : (
                filteredAvailableServices.map((service) => (
                  <div key={service.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-primary font-semibold">{formatCurrency(service.price)}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => addService(service)}>
                      + Tambah
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

        </div>
      )}

      {/* Step 2: Data Diri & Jadwal */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Data Diri & Jadwal</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap *</Label>
              <Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Budi Santoso" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Nomor Unit *</Label>
              <Input id="unit" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} placeholder="A-101" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor WhatsApp *</Label>
              <Input id="phone" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="08123456789" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="budi@email.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Tanggal yang Diinginkan *</Label>
              <Input id="date" type="date" min={minDateStr} value={requestedDate} onChange={(e) => setRequestedDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeNote">Preferensi Waktu (opsional)</Label>
              <Textarea id="timeNote" value={preferredTimeNote} onChange={(e) => setPreferredTimeNote(e.target.value)} placeholder="Misal: pagi jam 09.00-11.00, atau siang setelah 13.00" rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Metode Pembayaran *</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash — Bayar langsung ke OB saat selesai</SelectItem>
                  <SelectItem value="transfer">Transfer — Bayar via Midtrans (QRIS, VA, Kartu)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>← Kembali</Button>
            <Button
              className="flex-1"
              disabled={!customerName || !customerEmail || !customerPhone || !unitNumber || !requestedDate}
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
                  <span>{item.service.name} × {item.quantity}</span>
                  <span className="font-medium">{formatCurrency(item.service.price * item.quantity)}</span>
                </div>
              ))}
              <Separator />
              {platformFee > 0 && (
                <>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Platform Fee</span>
                    <span>{formatCurrency(platformFee)}</span>
                  </div>
                  <Separator />
                </>
              )}
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(grandTotal)}</span>
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
                <span className="font-medium">{paymentMethod === "cash" ? "Cash ke OB" : "Transfer Online"}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>← Kembali</Button>
            <Button className="flex-1" disabled={loading} onClick={handleSubmitOrder}>
              {loading ? "Memproses..." : "Buat Order ✓"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
