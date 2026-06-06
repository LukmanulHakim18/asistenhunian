"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { setConfigAction } from "@/lib/actions/config";
import type { ConfigItem, ConfigType } from "@/lib/api/types";
import { Pencil, X, Check } from "lucide-react";

const CONFIG_META: Record<string, { label: string; description: string; type: ConfigType; placeholder?: string }> = {
  platform_fee: {
    label: "Platform Fee",
    description: "Biaya platform yang dikenakan per transaksi order",
    type: "number",
    placeholder: "Contoh: 5000",
  },
  admin_wa: {
    label: "Nomor WhatsApp Admin",
    description: "Nomor WA admin untuk konfirmasi pembayaran transfer (format: 628xxx)",
    type: "string",
    placeholder: "Contoh: 6281234567890",
  },
  bank_account: {
    label: "Info Rekening Bank",
    description: "Info rekening tujuan transfer yang ditampilkan di email",
    type: "string",
    placeholder: "Contoh: BCA 1234567890 a/n PT Asisten Hunian",
  },
};

// Keys that are always shown in the UI even if not yet set in the backend
const KNOWN_KEYS = ["platform_fee", "admin_wa", "bank_account"];

function ConfigRow({ item }: { item: ConfigItem }) {
  const [editing, setEditing] = useState(item.value === "");
  const [value, setValue] = useState(item.value);
  const [isPending, startTransition] = useTransition();

  const meta = CONFIG_META[item.key];
  const displayLabel = meta?.label ?? item.key;
  const displayDescription = item.description || meta?.description;
  const isNew = item.value === "";

  const handleSave = () => {
    if (!value.trim()) {
      toast.error("Nilai tidak boleh kosong");
      return;
    }
    startTransition(async () => {
      try {
        await setConfigAction(item.key, {
          type: item.type,
          value: value.trim(),
          description: meta?.description,
        });
        toast.success(`${displayLabel} berhasil disimpan`);
        setEditing(false);
      } catch {
        toast.error(`Gagal menyimpan ${displayLabel}`);
      }
    });
  };

  const handleCancel = () => {
    if (isNew) return; // can't cancel a new config
    setValue(item.value);
    setEditing(false);
  };

  const displayValue =
    item.type === "number"
      ? formatCurrency(Number(item.value))
      : item.value;

  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium">{displayLabel}</p>
          <Badge variant="outline" className="text-xs font-mono">{item.key}</Badge>
          <Badge variant="secondary" className="text-xs">{item.type}</Badge>
        </div>
        {displayDescription && (
          <p className="text-sm text-muted-foreground mb-2">{displayDescription}</p>
        )}

        {editing ? (
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label className="text-xs">Nilai</Label>
              <Input
                type={item.type === "number" ? "number" : "text"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className={`h-8 ${item.type === "number" ? "w-40" : "w-full max-w-md"}`}
                min={item.type === "number" ? "0" : undefined}
                placeholder={meta?.placeholder}
              />
              {item.type === "number" && value && (
                <p className="text-xs text-muted-foreground">
                  = {formatCurrency(Number(value))}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={isPending}>
                <Check className="h-3 w-3 mr-1" />
                {isPending ? "Menyimpan..." : "Simpan"}
              </Button>
              {!isNew && (
                <Button size="sm" variant="outline" onClick={handleCancel} disabled={isPending}>
                  <X className="h-3 w-3 mr-1" />
                  Batal
                </Button>
              )}
            </div>
          </div>
        ) : (
          <p className={`text-lg font-bold ${isNew ? "text-muted-foreground italic text-sm" : ""}`}>
            {isNew ? "Belum diisi" : displayValue}
          </p>
        )}
      </div>

      {!editing && (
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          <Pencil className="h-3 w-3 mr-1" />
          {isNew ? "Isi" : "Edit"}
        </Button>
      )}
    </div>
  );
}

interface Props {
  configs: ConfigItem[];
}

export function ConfigSettings({ configs }: Props) {
  // Merge API configs with known keys — show known keys even if not yet set
  const apiMap = new Map(configs.map((c) => [c.key, c]));
  const merged: ConfigItem[] = KNOWN_KEYS.map(
    (key) =>
      apiMap.get(key) ?? {
        key,
        type: CONFIG_META[key]?.type ?? "string",
        value: "",
        description: CONFIG_META[key]?.description,
      }
  );
  // Append any extra configs from API that aren't in KNOWN_KEYS
  configs.forEach((c) => {
    if (!KNOWN_KEYS.includes(c.key)) merged.push(c);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Konfigurasi Platform</CardTitle>
      </CardHeader>
      <CardContent className="p-0 px-6">
        {merged.map((item) => (
          <ConfigRow key={item.key} item={item} />
        ))}
      </CardContent>
    </Card>
  );
}
