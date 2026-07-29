import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/lib/site";

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
    default: siteConfig.title,
    template: `%s — ${siteConfig.title}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b border-border">
          <div className="mx-auto flex max-w-2xl items-baseline justify-between px-6 py-6">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              {siteConfig.title}
            </Link>
            <nav className="flex gap-5 text-sm text-muted">
              <Link href="/" className="hover:text-foreground">
                Writing
              </Link>
              <Link href="/admin" className="hover:text-foreground">
                Admin
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-border">
          <div className="mx-auto max-w-2xl px-6 py-6 text-sm text-muted">
            © {new Date().getFullYear()} {siteConfig.author}
          </div>
        </footer>
      </body>
    </html>
  );
}
