import type { Metadata } from "next";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";
import { RealtimeNotificationsProvider } from "@/providers/realtime-notifications-provider";
import { Toaster } from "@/shared/components/ui/sonner";
import { APP_NAME } from "@/shared/constants/app";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Scilab helps students and researchers discover journals, articles, and scientific publication trends.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <RealtimeNotificationsProvider>
                {children}
              </RealtimeNotificationsProvider>
            </AuthProvider>
          </QueryProvider>
          <Toaster richColors position="top-right" closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
