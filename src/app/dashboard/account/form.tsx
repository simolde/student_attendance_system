"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { updateMyAccount, type AccountFormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const initialState: AccountFormState = {};
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const initials = useMemo(
    () => getInitials(previewName || email || "U"),
    [previewName, email]
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);
  }, [state]);

  async function handleFileChange(file: File | undefined) {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG, and WEBP images are allowed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be 2MB or smaller.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setUploading(true);

      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/avatar/upload",
      });

      setPreviewImage(blob.url);
      toast.success("Photo uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleRemovePhoto() {
    setPreviewImage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("Photo removed from preview. Click Save Changes to apply.");
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="flex items-center gap-4 rounded-xl border p-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={previewImage || undefined} alt={previewName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <p className="text-sm font-medium">Profile Preview</p>
          <p className="text-xs text-muted-foreground">
            Upload a photo, remove it, or use an image URL.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
          />

          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "Uploading..." : "Upload Photo"}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={uploading || !previewImage}
            onClick={handleRemovePhoto}
          >
            Remove Photo
          </Button>
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
        <label className="mb-2 block text-sm font-medium">
          Profile Image URL
        </label>
        <Input
          name="image"
          value={previewImage}
          onChange={(e) => setPreviewImage(e.target.value)}
          placeholder="https://example.com/profile.jpg"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Upload is recommended. JPG, PNG, or WEBP only. Max 2MB.
        </p>
      </div>

      <Button type="submit" disabled={pending || uploading}>
        {pending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}