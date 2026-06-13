import { FlaskConical } from "lucide-react";

async function getEnv(): Promise<string> {
  try {
    const BASE_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.asistenhunian.com";
    const res = await fetch(`${BASE_URL}/health`, { next: { revalidate: 300 } });
    if (!res.ok) return "production";
    const data = await res.json() as { env?: string };
    return data.env ?? "production";
  } catch {
    return "production";
  }
}

export async function SandboxBanner() {
  const env = await getEnv();
  if (env !== "sandbox") return null;

  return (
    <div className="bg-yellow-400/90 text-yellow-900 text-sm font-medium px-4 py-2 flex items-center gap-2">
      <FlaskConical className="h-4 w-4 shrink-0" />
      <span>
        Mode <strong>Sandbox</strong> — transaksi tidak nyata, data tidak mempengaruhi produksi
      </span>
    </div>
  );
}
