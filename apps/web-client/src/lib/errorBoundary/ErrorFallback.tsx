"use client";

import { FallbackProps } from "react-error-boundary";

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="rounded-lg border border-destructive bg-destructive/10 p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold text-destructive mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {error.message || "An unexpected error occurred"}
        </p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}