import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "DESPERTAR — Modo Despertar",
  description:
    "Tudo que precisas já está na tua mente. Identifica o hábito que está a bloquear o teu crescimento e recebe um plano personalizado de 7 dias para começares a mudar.",
  keywords: ["transformação pessoal", "disciplina", "Moçambique", "mudança de hábitos"],
  openGraph: {
    title: "DESPERTAR — Modo Despertar",
    description: "Um pequeno passo pode mudar a direção da tua vida.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0A0F1E",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" style={{ backgroundColor: "#0A0F1E" }}>
      <body className={`${inter.variable} antialiased`} style={{
        backgroundColor: "#0A0F1E",
        color: "white",
        margin: 0,
        padding: 0,
        WebkitFontSmoothing: "antialiased",
        overflowX: "hidden",
      }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
