import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FutsalProvider } from "@/lib/store/futsalStore";
import { ToastProvider } from "@/lib/context/ToastContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FUTSALBA | Liga Oficial de Futsal",
  description:
    "Resultados, calendario, clasificación, estadísticas y partidos en vivo de FUTSALBA.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased dark`} suppressHydrationWarning>
      <body className="min-h-full bg-[#060b14] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white" suppressHydrationWarning>
        <ToastProvider>
          <FutsalProvider>{children}</FutsalProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

