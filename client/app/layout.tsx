import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import "@/app/globals.css"
import Navbar from "@/components/navbar"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>FlexFit - Your Personal Workout Planner</title>
        <meta name="description" content="Follow your personalized 7-day workout plan with FlexFit" />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Navbar />
          <main className="container mx-auto px-4 py-4 md:py-8">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
