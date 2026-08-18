import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = { title: "Portal Kemaritiman Polbeng", description: "Portal informasi, OBE, sumber belajar, laboratorium, dan kinerja Jurusan Kemaritiman Politeknik Negeri Bengkalis.", icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" } };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="id"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>; }
