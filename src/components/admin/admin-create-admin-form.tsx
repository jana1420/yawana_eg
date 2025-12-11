"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminCreateAdminForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          fullName,
          phone: phone || null,
          password,
        }),
      });

      const data = (await response.json()) as { error?: string; id?: string };

      if (!response.ok) {
        setError(data.error ?? "Unable to create admin.");
        setIsSubmitting(false);
        return;
      }

      setSuccess("Admin created. Share the email and password so they can sign in.");
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");

      router.refresh();
      setIsSubmitting(false);
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-3 text-xs" onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-muted-foreground">
            Full name / username
          </label>
          <Input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-muted-foreground">
            Email (used to sign in)
          </label>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-muted-foreground">
            Phone (optional)
          </label>
          <Input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-muted-foreground">
            Temporary password
          </label>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {error && <p className="text-[11px] text-red-500">{error}</p>}
      {success && <p className="text-[11px] text-emerald-600">{success}</p>}

      <Button
        type="submit"
        size="sm"
        className="mt-1 px-3 text-xs"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Creating admin..." : "Create admin"}
      </Button>
    </form>
  );
}
