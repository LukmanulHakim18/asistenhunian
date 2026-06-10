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
          <p>Dikembangkan oleh <span className="font-medium text-foreground">APCorp</span></p>
        </div>
      </footer>
    </>
  );
}
