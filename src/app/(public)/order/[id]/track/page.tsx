export default function OrderTrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  void params;
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Status Order</h1>
      <p className="text-muted-foreground">
        Fitur ini akan tersedia di Fase 6.
      </p>
    </div>
  );
}
