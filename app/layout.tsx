import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KT VEEXORA — Everything You Need. One Place.",
  description:
    "KT VEEXORA is an all-in-one online utility platform for image, PDF, document and digital tools. Resize, compress, convert, edit and manage files easily.",

    verification: {
  google: "kD8-qw0xaMlkFy1vjvfQ5QRtJsuLVatONUKbMx6mhWs",
},
  keywords: [
    "KT VEEXORA",
    "Veexora",
    "online tools",
    "image tools",
    "PDF tools",
    "document tools",
    "image compressor",
    "image converter",
    "PDF tools online",
    "file tools",
    "free online tools",
  ],
  authors: [{ name: "KT VEEXORA" }],
  creator: "KT VEEXORA",
  publisher: "KT VEEXORA",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
  icon: "/logo.jpeg",
  shortcut: "/logo.jpeg",
  apple: "/logo.jpeg",
},
};
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
