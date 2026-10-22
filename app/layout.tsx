import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { LangProvider } from "@/components/lang";
import { getLang } from "@/lib/i18n-server";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Hessa: your teacher, all their lessons in one place", template: "%s | Hessa" },
  description: "Hessa connects Jordanian Tawjihi teachers with their students: videos, notes, quizzes and live classes.",
};

export const viewport: Viewport = { themeColor: "#0f4c45", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600&family=Readex+Pro:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <LangProvider lang={lang}>{children}</LangProvider>
      </body>
    </html>
  );
}
