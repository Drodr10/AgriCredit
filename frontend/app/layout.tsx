import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";
import { VoiceProvider } from "../components/VoiceProvider";
import { LanguageSelector } from "../components/LanguageSelector";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AgriCredit — AI-Powered Farm Risk Reports",
  description:
    "AgriCredit helps Indian farmers access fairer loans by turning weather, crop, and market data into transparent AI risk assessments. No credit history needed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.className} antialiased`} suppressHydrationWarning>
        <ClerkProvider>
          <VoiceProvider>
          <header className="flex items-center justify-between px-6 lg:px-10 bg-white border-b border-gray-200 sticky top-0 z-50 h-16">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <svg className="w-7 h-7 text-green-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 20h10" />
                <path d="M12 20V10" />
                <path d="M12 10c-2-3-6-4-6-8 4 0 6 3 6 3s2-3 6-3c0 4-4 5-6 8z" fill="currentColor" stroke="none" />
              </svg>
              <span className="text-lg font-bold text-gray-900 tracking-tight">Agricredit</span>
            </a>

            <nav className="hidden sm:flex items-center gap-6">
              <a href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Dashboard
              </a>
              <a href="/profile" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Profile
              </a>
              <a href="/reports" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Reports
              </a>
              <a href="/map" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Map
              </a>
            </nav>

            <div className="flex items-center gap-4">
              <LanguageSelector />
              <Show when="signed-out">
                <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                  <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                  <button className="rounded bg-green-800 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors cursor-pointer">
                    Get Started
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </div>
          </header>
          {children}
          </VoiceProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
