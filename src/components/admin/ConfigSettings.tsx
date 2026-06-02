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
import type { ConfigItem } from "@/lib/api/types";
import { Pencil, X, Check } from "lucide-react";

const CONFIG_LABELS: Record<string, { label: string; description: string }> = {
  platform_fee: {
    label: "Platform Fee",
    description: "Biaya platform yang dikenakan per transaksi order",
  },
};

function ConfigRow({ item }: { item: ConfigItem }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(item.value);
  const [description, setDescription] = useState(item.description ?? "");
  const [isPending, startTransition] = useTransition();

  const meta = CONFIG_LABELS[item.key];
  const displayLabel = meta?.label ?? item.key;
  const displayDescription = description || meta?.description;

  const handleSave = () => {
    startTransition(async () => {
      try {
        await setConfigAction(item.key, {
          type: item.type,
          value,
          description: description || undefined,
        });
        toast.success(`${displayLabel} berhasil diperbarui`);
        setEditing(false);
      } catch {
        toast.error(`Gagal memperbarui ${displayLabel}`);
      }
    });
  };

  const handleCancel = () => {
    setValue(item.value);
    setDescription(item.description ?? "");
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
                className="h-8 w-48"
                min={item.type === "number" ? "0" : undefined}
              />
              {item.type === "number" && value && (
                <p className="text-xs text-muted-foreground">
                  = {formatCurrency(Number(value))}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Deskripsi (opsional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-8"
                placeholder="Keterangan config ini..."
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={isPending}>
                <Check className="h-3 w-3 mr-1" />
                {isPending ? "Menyimpan..." : "Simpan"}
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} disabled={isPending}>
                <X className="h-3 w-3 mr-1" />
                Batal
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-lg font-bold">{displayValue}</p>
        )}
      </div>

      {!editing && (
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          <Pencil className="h-3 w-3 mr-1" />
          Edit
        </Button>
      )}
    </div>
  );
}

interface Props {
  configs: ConfigItem[];
}

export function ConfigSettings({ configs }: Props) {
  if (configs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Belum ada konfigurasi.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Konfigurasi Platform</CardTitle>
      </CardHeader>
      <CardContent className="p-0 px-6">
        {configs.map((item) => (
          <ConfigRow key={item.key} item={item} />
        ))}
      </CardContent>
    </Card>
  );
}
