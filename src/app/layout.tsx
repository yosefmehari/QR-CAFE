import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'Aroma & Fork | QR Cafe & Bistro',
    template: '%s | Aroma & Fork Cafe',
  },
  description: 'Artisan Bistro & Specialty Coffee. Seamless table-side contactless QR ordering.',
};

import { CartProvider } from "@/context/CartContext";
import Toast from "@/components/Toast";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
          {children}
          <Toast />
        </CartProvider>
      </body>
    </html>
  );
}
