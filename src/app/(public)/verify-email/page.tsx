"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";

const OTP_LENGTH = 6;

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) router.replace("/register");
  }, [email, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = [...otp];
    pasted.split("").forEach((char, i) => {
      next[i] = char;
    });
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      toast.error("Masukkan kode OTP 6 digit");
      return;
    }
    setLoading(true);
    try {
      await authApi.verifyEmail({ email, otp: code });
      toast.success("Email berhasil diverifikasi! Silakan masuk.");
      router.push("/login");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Kode OTP salah atau sudah kadaluarsa";
      toast.error(message);
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authApi.resendVerification({ email });
      toast.success("Kode verifikasi baru telah dikirim ke email kamu");
      setResendCooldown(60);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Gagal mengirim ulang kode";
      toast.error(message);
    }
  };

  const isComplete = otp.every((d) => d !== "");

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <MailCheck className="h-10 w-10 text-primary" />
          </div>
          <CardTitle>Verifikasi Email</CardTitle>
          <CardDescription>
            Kode OTP telah dikirim ke{" "}
            <span className="font-medium text-foreground">{email}</span>.
            Masukkan kode 6 digit di bawah ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OTP input boxes */}
          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <Input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-11 h-12 text-center text-xl font-bold"
              />
            ))}
          </div>

          <Button
            className="w-full"
            onClick={handleVerify}
            disabled={!isComplete || loading}
          >
            {loading ? "Memverifikasi..." : "Verifikasi"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Tidak menerima email?{" "}
            {resendCooldown > 0 ? (
              <span>Kirim ulang dalam {resendCooldown}s</span>
            ) : (
              <button
                onClick={handleResend}
                className="text-primary hover:underline font-medium"
              >
                Kirim Ulang
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
