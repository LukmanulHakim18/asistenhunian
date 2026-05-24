"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/types/database";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .returns<{ role: UserRole }[]>()
          .single()
          .then(({ data: profile }) => {
            if (profile) setRole(profile.role);
          });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session) setRole(null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const getDashboardLink = () => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "ob") return "/ob/dashboard";
    return "/dashboard";
  };

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg" aria-label="Asisten Hunian — Kembali ke beranda">
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          Asisten Hunian
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href={getDashboardLink()}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Dashboard
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Keluar
              </Button>
            </>
          ) : (
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Masuk
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
