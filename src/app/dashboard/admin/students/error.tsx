"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="mt-2 text-gray-600">
        An unexpected error happened on this page.
      </p>
      <button
        onClick={() => reset()}
        className="mt-4 rounded bg-black px-4 py-2 text-white"
      >
        Try again
      </button>
    </div>
  );
}