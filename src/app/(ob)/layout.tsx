import { OBSidebar } from "@/components/ob/OBSidebar";

export const dynamic = "force-dynamic";

export default function OBLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <OBSidebar />
      <main className="flex-1 overflow-y-auto bg-muted/20 p-6">{children}</main>
    </div>
  );
}
