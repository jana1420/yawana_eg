"use client";

import { useEffect, useRef, useState } from "react";

import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";

import { Button } from "@/components/ui/button";

type ScanProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  stock: number;
  imageUrl: string | null;
  sizes: string[];
  sizeStock: { size: string; stock: number }[];
  colors: string[];
  colorStock: { color: string; hex: string | null; stock: number }[];
};

type Mode = "sell" | "add";

export function AdminScanStock() {
  const [isCameraSupported, setIsCameraSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedSku, setScannedSku] = useState<string | null>(null);
  const [manualSku, setManualSku] = useState("");
  const [product, setProduct] = useState<ScanProduct | null>(null);
  const [mode, setMode] = useState<Mode>("sell");
  const [quantity, setQuantity] = useState("1");
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return;
    }

    setIsCameraSupported(!!navigator.mediaDevices?.getUserMedia);
    codeReaderRef.current = new BrowserMultiFormatReader();

    return () => {
      if (controlsRef.current && typeof controlsRef.current.stop === "function") {
        controlsRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (!product) {
      setSelectedSize("");
      setSelectedColor("");
      return;
    }

    if (product.sizeStock && product.sizeStock.length === 1) {
      setSelectedSize(product.sizeStock[0].size);
    } else {
      setSelectedSize("");
    }

    if (product.colorStock && product.colorStock.length === 1) {
      setSelectedColor(product.colorStock[0].color);
    } else {
      setSelectedColor("");
    }
  }, [product]);

  function notifySuccess() {
    if (typeof window === "undefined") return;

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(120);
      } catch {}
    }

    try {
      const AnyWindow = window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      };
      const AudioContextClass =
        window.AudioContext || AnyWindow.webkitAudioContext || null;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 880;
      osc.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 120);
    } catch {}
  }

  async function handleStartScan() {
    if (!codeReaderRef.current) return;
    if (!videoRef.current) {
      setError("Camera preview is not ready yet. Please try again.");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsScanning(true);
    setProduct(null);

    try {
      const controls = await codeReaderRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, errorResult, ctrl) => {
          if (!controlsRef.current) {
            controlsRef.current = ctrl;
          }

          if (result) {
            const text = result.getText().trim();
            if (text) {
              setScannedSku(text);
              setManualSku(text);
              setIsScanning(false);
              if (controlsRef.current) {
                controlsRef.current.stop();
              }
              void lookupProduct(text);
            }
          }
        },
      );

      controlsRef.current = controls;
    } catch {
      setError("Unable to access camera. Please check browser permissions.");
      setIsScanning(false);
    }
  }

  function handleStopScan() {
    if (controlsRef.current && typeof controlsRef.current.stop === "function") {
      controlsRef.current.stop();
    }
    setIsScanning(false);
  }

  async function lookupProduct(rawSku: string) {
    const sku = rawSku.trim();
    if (!sku) {
      setError("Please enter a SKU to look up.");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsLoadingProduct(true);
    setProduct(null);

    try {
      const response = await fetch(
        `/api/admin/scan-product-by-sku?sku=${encodeURIComponent(sku)}`,
      );
      const data = (await response.json()) as { product?: ScanProduct; error?: string };

      if (!response.ok || !data.product) {
        setError(data.error ?? "Product not found for this SKU.");
        setIsLoadingProduct(false);
        return;
      }

      setProduct(data.product);
      setSuccess(null);
      notifySuccess();
    } catch {
      setError("Network error while looking up product.");
    } finally {
      setIsLoadingProduct(false);
    }
  }

  async function handleAdjustStock(event: React.FormEvent) {
    event.preventDefault();
    if (!product) return;

    const trimmed = quantity.trim();
    const n = Number.parseInt(trimmed, 10);
    if (!Number.isInteger(n) || n <= 0) {
      setError("Quantity must be a positive integer.");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsUpdating(true);

    try {
      const response = await fetch("/api/admin/products/adjust-stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: n,
          mode,
          size: selectedSize || undefined,
          color: selectedColor || undefined,
        }),
      });

      const data = (await response.json()) as {
        stock?: number;
        sizeStock?: { size: string; stock: number }[];
        colorStock?: { color: string; hex: string | null; stock: number }[];
        error?: string;
      };

      if (!response.ok || typeof data.stock !== "number") {
        setError(data.error ?? "Unable to update stock.");
        setIsUpdating(false);
        return;
      }

      setProduct({
        ...product,
        stock: data.stock,
        sizeStock: data.sizeStock ?? product.sizeStock,
        colorStock: data.colorStock ?? product.colorStock,
      });
      setSuccess(
        mode === "sell"
          ? `Recorded sale of ${n} item${n === 1 ? "" : "s"}. New stock: ${data.stock}.`
          : `Added ${n} item${n === 1 ? "" : "s"} to stock. New stock: ${data.stock}.`,
      );
      notifySuccess();
    } catch {
      setError("Network error while updating stock.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-4 text-xs">
      <div className="space-y-1">
        <p className="text-sm font-medium tracking-tight">Scan barcode</p>
        <p className="text-[11px] text-muted-foreground">
          Use your phone camera to scan a product barcode (EAN-13, Code128, etc.). We
          will look up the product by SKU and let you adjust stock.
        </p>
      </div>

      {isCameraSupported ? (
        <div className="space-y-2 rounded-lg border border-dashed border-border bg-muted/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium text-muted-foreground">
              Camera scanner
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                className="h-7 px-2 text-[11px]"
                disabled={isScanning}
                onClick={handleStartScan}
              >
                {isScanning ? "Scanning..." : "Start scanning"}
              </Button>
              {isScanning && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-[11px]"
                  onClick={handleStopScan}
                >
                  Stop
                </Button>
              )}
            </div>
          </div>
          <div className="relative mt-2 overflow-hidden rounded-md border border-border bg-black/60">
            <video
              ref={videoRef}
              className="h-56 w-full object-cover"
              muted
              playsInline
            />
          </div>
          {scannedSku && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Last scanned code: <span className="font-mono">{scannedSku}</span>
            </p>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-red-500">
          This browser does not support camera access. Please use a modern mobile
          browser.
        </p>
      )}

      <form className="space-y-3" onSubmit={handleAdjustStock}>
        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-muted-foreground">
            SKU (from barcode)
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={manualSku}
              onChange={(event) => setManualSku(event.target.value)}
              className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Scan a code or type SKU manually"
            />
            <Button
              type="button"
              size="sm"
              className="h-8 px-3 text-[11px]"
              disabled={isLoadingProduct || !manualSku.trim()}
              onClick={() => void lookupProduct(manualSku)}
            >
              {isLoadingProduct ? "Looking up..." : "Find product"}
            </Button>
          </div>
        </div>

        {product && (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-start gap-3">
              {product.imageUrl && (
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="space-y-0.5 text-xs">
                <p className="font-medium tracking-tight">{product.name}</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {product.sku || "No SKU"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Current stock: <span className="font-semibold">{product.stock}</span>
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)]">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-muted-foreground">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-muted-foreground">
                  Action
                </label>
                <div className="inline-flex h-8 items-center gap-1 rounded-full bg-muted p-1 text-[11px]">
                  <button
                    type="button"
                    className={`inline-flex h-6 items-center rounded-full px-3 text-[11px] font-medium ${mode === "sell" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                    onClick={() => setMode("sell")}
                  >
                    Sell
                  </button>
                  <button
                    type="button"
                    className={`inline-flex h-6 items-center rounded-full px-3 text-[11px] font-medium ${mode === "add" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                    onClick={() => setMode("add")}
                  >
                    Add stock
                  </button>
                </div>
              </div>
            </div>

            {(product.sizeStock.length > 0 || product.colorStock.length > 0) && (
              <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)]">
                {product.sizeStock.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-medium text-muted-foreground">
                      Size (optional)
                    </label>
                    <select
                      value={selectedSize}
                      onChange={(event) => {
                        setSelectedSize(event.target.value);
                        setSelectedColor("");
                      }}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">All sizes</option>
                      {product.sizeStock.map((entry) => (
                        <option key={entry.size} value={entry.size}>
                          {entry.size} (stock {entry.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {product.colorStock.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-medium text-muted-foreground">
                      Color (optional)
                    </label>
                    <select
                      value={selectedColor}
                      onChange={(event) => {
                        setSelectedColor(event.target.value);
                        setSelectedSize("");
                      }}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">All colors</option>
                      {product.colorStock.map((entry) => (
                        <option key={entry.color} value={entry.color}>
                          {entry.color} (stock {entry.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              size="sm"
              className="mt-1 w-full text-[11px] sm:w-auto"
              disabled={isUpdating}
            >
              {isUpdating
                ? mode === "sell"
                  ? "Saving sale..."
                  : "Updating stock..."
                : mode === "sell"
                  ? "Save sale"
                  : "Update stock"}
            </Button>
          </div>
        )}

        {error && <p className="text-[11px] text-red-500">{error}</p>}
        {success && <p className="text-[11px] text-emerald-600">{success}</p>}
      </form>
    </div>
  );
}
