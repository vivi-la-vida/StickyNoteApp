import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const patrickHand = {
  className: "patrick-hand-regular",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "I'm Board",
  description: "A fun little sticky notes board",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${patrickHand.className} h-dvh antialiased`}
    >
      <body className="h-dvh w-full overflow-hidden flex flex-col">{children}</body>
    </html>
  );
}
