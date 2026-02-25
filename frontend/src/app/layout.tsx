import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mini Dating App - Clique8",
  description: "A mini dating app prototype with profile creation, matching, and date scheduling.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
