"use client";

import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "./ErrorFallback";

type Props = {
  children: React.ReactNode;
};

export function QueryErrorBoundary({ children }: Props) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
      )}
      onReset={() => {
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
}