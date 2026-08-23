import type { Metadata } from "next";
import { Inter, Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "JOSWIL RESTAURANTE | Menú Digital",
  description:
    "Descubre nuestra carta, promociones exclusivas y el Menú del Día de JOSWIL RESTAURANTE. Consulta disponibilidad al instante por WhatsApp.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" data-scroll-behavior="smooth" className="h-full antialiased">
      <body
        className={`${playfairDisplay.variable} ${plusJakartaSans.variable} ${inter.variable} flex min-h-full flex-col bg-brand-darker font-body text-brand-light`}
      >
        {children}
      </body>
    </html>
  );
}
