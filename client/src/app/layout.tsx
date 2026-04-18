import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Provider";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "askGit | Premium Code Intelligence",
  description: "Talk to your repository with askGit. Advanced AI-powered code analysis and insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} font-sans antialiased`}
      ><Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
