export default function OBOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  void params;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Detail Order</h1>
      <p className="text-muted-foreground">
        Fitur ini akan tersedia di Fase 2.
      </p>
    </div>
  );
}
