"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Lock,
  Mail,
  Package,
  ShoppingCart,
  Sparkles,
  Store,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants/colors";
import { useAuth } from "@/providers/auth-provider";
import { loginSchema, LoginFormValues } from "@/schemas/auth.schema";
import { ApiError } from "@/lib/api-client";

const features = [
  { icon: ShoppingCart, label: "Point of Sale" },
  { icon: Package, label: "Inventory Control" },
  { icon: BarChart3, label: "AI Analytics" },
  { icon: Store, label: "Multi-Store Ready" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    try {
      await login(values);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Login failed. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-10 w-10 rounded-full border-[3px] border-primary border-t-transparent"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — brand showcase */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-[#4a148c] lg:flex lg:flex-col lg:justify-between"
      >
        {/* Decorative circles */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/5" />
          <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-white/5" />
          <div className="absolute right-1/4 top-1/3 h-48 w-48 rounded-full bg-secondary/20 blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center px-12 xl:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-5xl font-bold tracking-tight text-white xl:text-6xl">
              {APP_NAME}
              <span className="text-secondary">.</span>
            </h1>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-white/80">
              {APP_DESCRIPTION}
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-12 grid grid-cols-2 gap-3"
          >
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white/90">
                    {feature.label}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Promo banner */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-10 overflow-hidden rounded-3xl bg-white/10 backdrop-blur-sm"
          >
            <div className="flex items-center gap-6 p-6">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-yellow to-warning">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">
                  Get Started Today
                </p>
                <p className="mt-1 text-sm text-white/70">
                  Streamline your retail operations with AI-powered insights
                  and real-time analytics.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 px-12 pb-8 xl:px-16">
          <p className="text-xs text-white/40">
            &copy; 2026 {APP_NAME}. All rights reserved.
          </p>
        </div>
      </motion.div>

      {/* Right panel — login form */}
      <div className="flex w-full flex-col items-center justify-center bg-background px-6 py-12 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full max-w-md"
        >
          {/* Mobile brand */}
          <div className="mb-8 text-center lg:hidden">
            <h1 className="text-3xl font-bold text-primary">
              {APP_NAME}
              <span className="text-secondary">.</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {APP_DESCRIPTION}
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to access your dashboard
            </p>
          </div>

          <Card className="border-0 shadow-[var(--shadow-card)]">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="admin@retailmind.dev"
                error={errors.email?.message}
                {...register("email")}
              />

              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                error={errors.password?.message}
                {...register("password")}
              />

              <Button
                type="submit"
                className="group w-full"
                isLoading={isSubmitting}
              >
                {!isSubmitting && (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 rounded-2xl bg-muted/80 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Development credentials
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-primary/60" />
                  admin@retailmind.dev
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-primary/60" />
                  DevPassword123!
                </li>
              </ul>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
