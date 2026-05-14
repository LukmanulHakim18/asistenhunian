import { Navbar } from "@/components/shared/Navbar";

export const dynamic = "force-dynamic";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </>
  );
}
