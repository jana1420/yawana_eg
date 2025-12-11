"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);

    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      message: String(formData.get("message") ?? ""),
    };

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Unable to send message.");
        setIsSubmitting(false);
        return;
      }

      setSuccess("Your message has been sent. We will get back to you soon.");
      (event.target as HTMLFormElement).reset();
      setIsSubmitting(false);
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Name
        </label>
        <Input
          name="name"
          required
          placeholder="Your name"
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
          Message
        </label>
        <textarea
          name="message"
          required
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && <p className="text-xs text-green-600">{success}</p>}

      <Button
        type="submit"
        className="mt-1 w-full text-sm sm:w-auto"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
