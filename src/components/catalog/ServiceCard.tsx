import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ServicePlaceholder } from "./ServicePlaceholder";
import type { ServiceWithCategory } from "@/lib/api/types";

interface Props {
  service: ServiceWithCategory;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export function ServiceCard({ service, quantity, onAdd, onRemove }: Props) {
  const categorySlug = service.category?.slug ?? null;

  return (
    <Card className="overflow-hidden flex flex-col transition-shadow duration-200 hover:shadow-md">
      <div className="relative h-44 w-full bg-muted overflow-hidden">
        {service.image_url ? (
          <Image
            src={service.image_url}
            alt={service.name}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <ServicePlaceholder
            categorySlug={categorySlug}
            serviceName={service.name}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>
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
