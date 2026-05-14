"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ServiceCard } from "./ServiceCard";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { ServiceWithCategory, ServiceCategory } from "@/types/database";
import { ShoppingCart } from "lucide-react";

interface Props {
  services: ServiceWithCategory[];
  categories: ServiceCategory[];
}

export type CartItem = { serviceId: string; quantity: number };

export function ServiceCatalog({ services, categories }: Props) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const router = useRouter();

  const addToCart = useCallback((serviceId: string) => {
    setCart((prev) => ({ ...prev, [serviceId]: (prev[serviceId] ?? 0) + 1 }));
  }, []);

  const removeFromCart = useCallback((serviceId: string) => {
    setCart((prev) => {
      const current = prev[serviceId] ?? 0;
      if (current <= 1) {
        const { [serviceId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [serviceId]: current - 1 };
    });
  }, []);

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const service = services.find((s) => s.id === id);
    return sum + (service?.price ?? 0) * qty;
  }, 0);

  const filteredServices =
    activeCategory === "all"
      ? services
      : services.filter((s) => s.category_id === activeCategory);

  const handleProceedToOrder = () => {
    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => `${id}:${qty}`)
      .join(",");
    router.push(`/order?items=${encodeURIComponent(items)}`);
  };

  return (
    <div>
      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        <Button
          variant={activeCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveCategory("all")}
        >
          Semua
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Service Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredServices.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            quantity={cart[service.id] ?? 0}
            onAdd={() => addToCart(service.id)}
            onRemove={() => removeFromCart(service.id)}
          />
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          Tidak ada layanan di kategori ini.
        </div>
      )}

      {/* Sticky Cart Summary */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-primary text-primary-foreground rounded-full px-6 py-3 shadow-lg flex items-center gap-4">
            <ShoppingCart className="h-5 w-5" />
            <span className="font-medium">
              {totalItems} layanan · {formatCurrency(totalPrice)}
            </span>
            <button
              onClick={handleProceedToOrder}
              className="bg-white text-primary font-semibold rounded-full px-4 py-1 text-sm hover:bg-gray-100 transition-colors"
            >
              Lanjut Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
