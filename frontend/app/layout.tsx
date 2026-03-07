import type { Metadata } from "next";
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
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
