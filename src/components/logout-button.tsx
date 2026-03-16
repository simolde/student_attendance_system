"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="mt-4 rounded bg-red-600 px-4 py-2 text-white"
    >
      Logout
    </button>
  );
}