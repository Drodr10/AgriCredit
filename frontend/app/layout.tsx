import type { Metadata } from "next";
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgriCredit",
  description:
    "AI-powered financial forecasting and credit access tailored for the next generation of global agriculture.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ClerkProvider>
          <header className="flex items-center justify-between px-6 py-3 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50 h-16">
            <span className="text-xl font-bold text-green-400 tracking-tight">
              AgriCredit
            </span>
            <div className="flex items-center gap-4">
              <Show when="signed-out">
                <SignInButton />
                <SignUpButton>
                  <button className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-800 transition-colors cursor-pointer">
                    Sign Up
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </div>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
