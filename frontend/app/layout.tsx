import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { ErrorToastHandler } from "@/components/error-toast-handler"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GyanSetu – Real-Time Classroom Q&A",
  description: "Ask, answer, and learn together – instantly. A modern academic Q&A platform connecting students, mentors, and educators.",
  keywords: ["education", "Q&A", "academic", "learning", "students", "questions", "answers"],
  authors: [{ name: "GyanSetu Team" }],
  creator: "GyanSetu",
  publisher: "GyanSetu",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://gyansetu.vercel.app"),
  openGraph: {
    title: "GyanSetu – Real-Time Classroom Q&A",
    description: "Ask, answer, and learn together – instantly.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "GyanSetu – Real-Time Classroom Q&A",
    description: "Ask, answer, and learn together – instantly.",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.json",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body className={`font-sans antialiased`}>
        <div className="min-h-screen bg-background animate-fade-in">
          {children}
        </div>
        <Toaster />
        <ErrorToastHandler />
        <Analytics />
      </body>
    </html>
  )
}
