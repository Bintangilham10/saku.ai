import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"

import { ThemeProvider } from "@/components/theme-provider"
import { isClerkConfigured } from "@/lib/server-config"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Saku AI • Interactive Pocket Financial Companion",
  description:
    "Teman finansial saku mahasiswa: catur pengeluaran, pantau batas budget harian, dan obrolan refleksi hangat bersama AI.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const app = (
    <html lang="id" className={`${jakarta.variable}`} suppressHydrationWarning>
      <body className="antialiased selection:bg-[#109868]/20 selection:text-[#109868]">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )

  if (!isClerkConfigured()) {
    return app
  }

  return <ClerkProvider>{app}</ClerkProvider>
}
