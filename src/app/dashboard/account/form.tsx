"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { updateMyAccount, type AccountFormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const initialState: AccountFormState = {};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function AccountForm({
  name,
  email,
  image,
}: {
  name: string;
  email: string;
  image?: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateMyAccount,
    initialState
  );

  const [previewName, setPreviewName] = useState(name);
  const [previewImage, setPreviewImage] = useState(image ?? "");

  const initials = useMemo(
    () => getInitials(previewName || email || "U"),
    [previewName, email]
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);
  }, [state]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="flex items-center gap-4 rounded-xl border p-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={previewImage || undefined} alt={previewName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div>
          <p className="text-sm font-medium">Profile Preview</p>
          <p className="text-xs text-muted-foreground">
            Your image will appear in the sidebar profile menu.
          </p>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Full Name</label>
        <Input
          name="name"
          defaultValue={name}
          placeholder="Your full name"
          onChange={(e) => setPreviewName(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Email</label>
        <Input
          name="email"
          type="email"
          defaultValue={email}
          placeholder="Your email"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Profile Image URL</label>
        <Input
          name="image"
          defaultValue={image ?? ""}
          placeholder="https://example.com/profile.jpg"
          onChange={(e) => setPreviewImage(e.target.value)}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Use a direct image URL, or leave it empty to use initials.
        </p>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}