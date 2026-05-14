import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">Jasa Kebersihan OB Rusun</h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-lg mx-auto">
        Pesan layanan kebersihan unit, kasur, karpet, dan lebih banyak lagi.
        Cepat, terpercaya, langsung dari OB rusun Anda.
      </p>
      <div className="flex gap-4 justify-center flex-wrap">
        <Link href="/order" className={cn(buttonVariants({ size: "lg" }))}>
          Pesan Sekarang
        </Link>
        <Link
          href="/order/track"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          Cek Status Order
        </Link>
      </div>
    </div>
  );
}
