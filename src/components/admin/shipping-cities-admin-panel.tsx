"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ShippingCity = {
  id: string;
  name: string;
  fee_cents: number;
  active: boolean;
  created_at: string;
};

type ShippingCitiesAdminPanelProps = {
  initialCities: ShippingCity[];
};

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function ShippingCitiesAdminPanel({
  initialCities,
}: ShippingCitiesAdminPanelProps) {
  const [cities, setCities] = useState<ShippingCity[]>(initialCities);
  const [name, setName] = useState("");
  const [fee, setFee] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyCityId, setBusyCityId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateCity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("City name is required.");
      return;
    }

    const feeNumber = Number.parseFloat(fee.replace(",", "."));
    if (!Number.isFinite(feeNumber) || feeNumber < 0) {
      setError("Fee must be a non-negative number.");
      return;
    }

    const feeCents = Math.round(feeNumber * 100);

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/shipping-cities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          feeCents,
          active: isActive,
        }),
      });

      const data = (await response.json()) as { city?: ShippingCity; error?: string };

      if (!response.ok || !data.city) {
        setError(data.error ?? "Unable to create shipping city.");
        setIsSubmitting(false);
        return;
      }

      setCities((prev) => [data.city as ShippingCity, ...prev]);
      setName("");
      setFee("0");
      setIsActive(true);
      setIsSubmitting(false);
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(city: ShippingCity) {
    if (busyCityId) return;

    setBusyCityId(city.id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/shipping-cities/${city.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active: !city.active }),
      });

      const data = (await response.json()) as { city?: ShippingCity; error?: string };

      if (!response.ok || !data.city) {
        setError(data.error ?? "Unable to update shipping city.");
        setBusyCityId(null);
        return;
      }

      setCities((prev) =>
        prev.map((item) => (item.id === city.id ? (data.city as ShippingCity) : item)),
      );
      setBusyCityId(null);
    } catch {
      setError("Network error. Please try again.");
      setBusyCityId(null);
    }
  }

  return (
    <div className="space-y-6">
      <form className="space-y-4" onSubmit={handleCreateCity}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              City / area name
            </label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Cairo, Giza, Alexandria"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Shipping fee (EGP)
            </label>
            <Input
              value={fee}
              onChange={(event) => setFee(event.target.value)}
              inputMode="decimal"
              className="h-9 text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              This amount will be added as delivery fees at checkout.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 text-xs">
          <input
            id="shipping-city-active"
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="h-3 w-3 rounded border-input text-primary"
          />
          <label
            htmlFor="shipping-city-active"
            className="text-xs text-muted-foreground"
          >
            City is active
          </label>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <Button
          type="submit"
          className="mt-2 w-full text-sm sm:w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating city..." : "Create city"}
        </Button>
      </form>

      <div className="space-y-2 border-t pt-4">
        <h2 className="text-sm font-medium tracking-tight">Existing cities</h2>
        {cities.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No shipping cities defined yet.
          </p>
        ) : (
          <div className="space-y-1 text-xs">
            {cities.map((city) => (
              <div
                key={city.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 bg-muted/40 px-3 py-2"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium tracking-tight">{city.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Shipping fee: {formatPrice(city.fee_cents)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-medium ${
                      city.active
                        ? "text-emerald-600"
                        : "text-muted-foreground line-through"
                    }`}
                  >
                    {city.active ? "Active" : "Inactive"}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => handleToggleActive(city)}
                    disabled={busyCityId === city.id}
                  >
                    {city.active ? "Turn off" : "Turn on"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
