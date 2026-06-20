import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"

import { ThemeProvider } from "@/components/theme-provider"
import { isClerkConfigured } from "@/lib/server-config"
import "./globals.css"

export const metadata: Metadata = {
  title: "Saku AI",
  description:
    "Asisten keuangan pintar untuk mahasiswa dengan dashboard, budget tracker, dan chat AI.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const app = (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
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
