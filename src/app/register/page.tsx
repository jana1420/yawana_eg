"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);

    const firstName = String(formData.get("firstName") ?? "");
    const lastName = String(formData.get("lastName") ?? "");
    const email = String(formData.get("email") ?? "");
    const phone = String(formData.get("phone") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.");
      return;
    }

    if (!phone.trim()) {
      setError("Phone number is required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const payload = {
      email,
      phone,
      password,
      firstName,
      lastName,
    };

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok) {
        setError(data.error ?? "Unable to create account.");
        setIsSubmitting(false);
        return;
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("zekry-auth-change"));
      }

      router.push("/account");
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
            <h1 className="text-lg font-semibold tracking-tight">Create account</h1>
            <p className="text-xs text-muted-foreground">
              Use your phone number and a password to create an AH Adele account.
            </p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">
                First name
              </label>
              <Input
                name="firstName"
                required
                placeholder="Your first name"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">
                Last name
              </label>
              <Input
                name="lastName"
                required
                placeholder="Your last name"
                className="h-9 text-sm"
              />
            </div>
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
                Phone number
              </label>
              <Input
                name="phone"
                type="tel"
                required
                placeholder="Your mobile number"
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
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">
                Confirm password
              </label>
              <Input
                name="confirmPassword"
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
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
