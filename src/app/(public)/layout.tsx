import Link from "next/link";
import { Navbar } from "@/components/shared/Navbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-8 text-sm text-muted-foreground">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Asisten Hunian. Semua hak dilindungi.</p>
          <div className="flex gap-4">
            <Link href="/order/track" className="hover:text-foreground transition-colors">
              Cek Status Order
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Masuk
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
