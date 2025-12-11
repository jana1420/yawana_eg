"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);

    const payload = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok) {
        setError(data.error ?? "Unable to sign in.");
        setIsSubmitting(false);
        return;
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("zekry-auth-change"));
      }

      const from = searchParams.get("from");
      const target = from && from.startsWith("/") ? from : "/account";
      router.push(target);
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center pb-16 pt-10">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <h1 className="text-lg font-semibold tracking-tight">Sign in</h1>
            <p className="text-xs text-muted-foreground">
              Use your email and password to access your LooseBrand account.
            </p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">
                Email
              </label>
              <Input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">
                Password
              </label>
              <Input
                name="password"
                type="password"
                required
                minLength={6}
                className="h-9 text-sm"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button
              type="submit"
              className="w-full text-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Create one
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
