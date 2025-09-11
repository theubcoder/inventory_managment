import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { NotificationProvider } from "@/components/NotificationSystem";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import { Providers } from "@/components/providers";

export const metadata = {
  title: "Naeem Ullah Bartan Store",
  description: "Inventory Management System - Naeem Ullah Bartan Store",
  icons: {
    icon: '/Logo.svg',
    shortcut: '/Logo.svg',
    apple: '/Logo.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/Logo.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/Logo.svg" type="image/svg+xml" />
      </head>
      <body
        className="antialiased"
        suppressHydrationWarning={true}
        style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
      >
        <Providers>
          <NotificationProvider>
            <LanguageProvider>{children}</LanguageProvider>
          </NotificationProvider>
        </Providers>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
