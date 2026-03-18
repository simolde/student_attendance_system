"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { getPasswordStrength } from "@/lib/password-policy";
import { Button } from "@/components/ui/button";

type PasswordFieldProps = {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
};

export default function PasswordField({
  name,
  label,
  placeholder,
  defaultValue = "",
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  const [value, setValue] = useState(defaultValue);

  const strength = useMemo(() => getPasswordStrength(value), [value]);

  function getStrengthClass() {
    if (!value) return "text-muted-foreground";
    if (strength === "Weak") return "text-destructive";
    if (strength === "Medium") return "text-yellow-600";
    return "text-green-600";
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>

      <div className="flex gap-2">
        <Input
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => setShow((prev) => !prev)}
        >
          {show ? "Hide" : "Show"}
        </Button>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <p className="text-muted-foreground">
          Use 12–64 characters with uppercase, lowercase, number, and special character.
        </p>
        <p className={getStrengthClass()}>
          {value ? `Strength: ${strength}` : "Strength: -"}
        </p>
      </div>
    </div>
  );
}