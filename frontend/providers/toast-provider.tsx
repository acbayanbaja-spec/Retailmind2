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
          color: "#1A1A2E",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(123, 44, 191, 0.12)",
          padding: "14px 18px",
          border: "1px solid #E8E0F0",
          fontFamily: "var(--font-poppins), system-ui, sans-serif",
        },
        success: {
          iconTheme: { primary: "#7B2CBF", secondary: "#FFFFFF" },
        },
        error: {
          iconTheme: { primary: "#EF4444", secondary: "#FFFFFF" },
        },
      }}
    />
  );
}
