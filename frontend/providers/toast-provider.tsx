"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#FFFFFF",
          color: "#111827",
          borderRadius: "12px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          padding: "12px 16px",
        },
        success: {
          iconTheme: { primary: "#10B981", secondary: "#FFFFFF" },
        },
        error: {
          iconTheme: { primary: "#EF4444", secondary: "#FFFFFF" },
        },
      }}
    />
  );
}
