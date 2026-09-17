import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { BrandProvider } from "@/components/accounts/brand-store";
import { BulkActionsProvider } from "@/components/bulk/bulk-provider";
import { AgencyLayoutProvider } from "@/components/nav/agency-layout";
import { NavTemplatesProvider } from "@/components/nav/nav-templates";
import { PinFeedbackProvider } from "@/components/nav/pin-feedback";
import { NavProfilesProvider } from "@/components/nav/nav-profiles";
import { NavLayoutProvider } from "@/components/nav/nav-layout-provider";
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
      data-tint={DEFAULT_THEME.tint}
      data-nav-dark={DEFAULT_THEME.navDarkTone}
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-dvh flex-col overflow-hidden bg-app text-app-fg">
        <ThemeProvider>
          <TuningProvider>
            {/*
              Plans OUTSIDE the layout store, not inside it.

              The layout store now folds the agency plan into `can` — the
              permissions every editing surface reads — so it has to be able to
              ask what the plan allows. It used to sit three providers above the
              answer.
            */}
            <NavProfilesProvider>
              <NavLayoutProvider>
                <BrandProvider>
                  <PinFeedbackProvider>
                  <NavTemplatesProvider>
                    <AgencyLayoutProvider>
                      <BulkActionsProvider>
                        <TooltipProvider>{children}</TooltipProvider>
                        <TuningPanel />
                      </BulkActionsProvider>
                    </AgencyLayoutProvider>
                  </NavTemplatesProvider>
                  </PinFeedbackProvider>
                </BrandProvider>
              </NavLayoutProvider>
            </NavProfilesProvider>
          </TuningProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
