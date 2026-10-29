"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFutsal } from "@/lib/store/futsalStore";

interface AuthGuardProps {
  children: React.ReactNode;
  fallbackMessage?: string;
}

export function AuthGuard({
  children,
  fallbackMessage = "Verificando acceso de aficionado...",
}: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isAuthLoading } = useFutsal();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#050914] text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-black text-2xl animate-pulse mb-3 shadow-lg shadow-blue-500/20">
          F
        </div>
        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold animate-pulse">
          {fallbackMessage}
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
