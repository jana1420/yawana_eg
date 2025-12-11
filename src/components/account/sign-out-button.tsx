"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignOut() {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("zekry-auth-change"));
      }
    } finally {
      setIsSubmitting(false);
      router.push("/");
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-xs text-muted-foreground hover:text-foreground"
      onClick={handleSignOut}
      disabled={isSubmitting}
    >
      Sign out
    </Button>
  );
}
