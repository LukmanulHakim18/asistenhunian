"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ClipboardList, Wallet, LogOut } from "lucide-react";

const navItems = [
  { href: "/ob/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ob/orders", label: "Daftar Order", icon: ClipboardList },
  { href: "/ob/earnings", label: "Penghasilan", icon: Wallet },
];

export function OBSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="w-60 border-r bg-background flex flex-col">
      <div className="h-16 border-b flex items-center px-6 font-bold text-lg">
        🧹 Panel OB
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              pathname.startsWith(href)
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm w-full hover:bg-muted text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
