"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function CopyBatchIdButton({
  value,
  label = "Copy Batch ID",
  size = "sm",
  variant = "outline",
}: {
  value: string;
  label?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Batch ID copied");

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error(error);
      toast.error("Failed to copy batch ID");
    }
  }

  return (
    <Button type="button" variant={variant} size={size} onClick={handleCopy}>
      {copied ? (
        <Check className="mr-2 h-4 w-4" />
      ) : (
        <Copy className="mr-2 h-4 w-4" />
      )}
      {copied ? "Copied" : label}
    </Button>
  );
}