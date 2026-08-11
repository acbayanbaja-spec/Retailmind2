"use client";

import { motion } from "framer-motion";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { AuthGuard } from "@/components/auth/auth-guard";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function DashboardLayout({
  children,
  title,
  description,
}: DashboardLayoutProps) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="pl-[272px]">
          <Header title={title} description={description} />
          <motion.main
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="p-6 lg:p-8"
          >
            {children}
          </motion.main>
        </div>
      </div>
    </AuthGuard>
  );
}
