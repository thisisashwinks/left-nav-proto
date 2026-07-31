import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { TuningPanel } from "@/components/tuning/tuning-panel";
import { TuningProvider } from "@/components/tuning/tuning-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DEFAULT_THEME } from "@/design/theme";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Left nav prototype",
  description: "Prototype harness for the left nav redesign",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // Rendered here so the first paint already has the right tokens;
      // ThemeProvider keeps these in sync when the theme changes at runtime.
      data-accent={DEFAULT_THEME.accent}
      data-app-theme={DEFAULT_THEME.appTheme}
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full flex-col bg-app text-app-fg">
        <ThemeProvider>
          <TuningProvider>
            <TooltipProvider>{children}</TooltipProvider>
            <TuningPanel />
          </TuningProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
