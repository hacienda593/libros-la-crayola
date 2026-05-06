import type { Metadata } from "next";
import "./globals.css";
import WaFloat from "@/components/WaFloat";

export const metadata: Metadata = {
  title: "La Crayola · Libros Escolares",
  description: "Preventa de libros escolares · Escoge el libro de tu hijo y realiza tu pedido en línea.",
  openGraph: {
    title: "La Crayola · Libros Escolares",
    description: "Preventa de libros escolares · Escoge el libro de tu hijo y realiza tu pedido en línea.",
    url: "https://libros-la-crayola.vercel.app",
    siteName: "La Crayola",
    images: [{ url: "/og-image.png", width: 800, height: 600, alt: "La Crayola" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "La Crayola · Libros Escolares",
    description: "Preventa de libros escolares",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}<WaFloat/></body>
    </html>
  );
}
