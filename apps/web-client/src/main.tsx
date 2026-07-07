import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { QueryErrorBoundary } from "@/lib/errorBoundary/QueryErrorBoundary";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { useServiceWorker } from "@/hooks/useServiceWorker";

initSentry();

function ServiceWorkerWrapper() {
  useServiceWorker();
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <QueryErrorBoundary>
        <ServiceWorkerWrapper />
        <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
      </QueryErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
);