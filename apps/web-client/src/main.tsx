import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { QueryErrorBoundary } from "./lib/errorBoundary/QueryErrorBoundary";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { initSentry } from "./lib/sentry";
import "./index.css";

initSentry();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <QueryErrorBoundary>
        <App />
        <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
      </QueryErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
);