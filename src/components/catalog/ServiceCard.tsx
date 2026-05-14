import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Service } from "@/types/database";

interface Props {
  service: Service;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export function ServiceCard({ service, quantity, onAdd, onRemove }: Props) {
  return (
    <Card className="overflow-hidden flex flex-col">
      {service.image_url && (
        <div className="relative h-40 w-full bg-muted">
          <Image
            src={service.image_url}
            alt={service.name}
            fill
            className="object-cover"
          />
        </div>
      )}
      {!service.image_url && (
        <div className="h-40 w-full bg-muted flex items-center justify-center text-4xl">
          🧹
        </div>
      )}
      <CardContent className="flex-1 pt-4">
        <h3 className="font-semibold">{service.name}</h3>
        {service.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {service.description}
          </p>
        )}
        <p className="font-bold text-primary mt-2">
          {formatCurrency(service.price)}
        </p>
      </CardContent>
      <CardFooter>
        {quantity === 0 ? (
          <Button className="w-full" onClick={onAdd}>
            Pesan
          </Button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" size="sm" onClick={onRemove}>
              −
            </Button>
            <span className="font-semibold">{quantity}</span>
            <Button size="sm" onClick={onAdd}>
              +
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
