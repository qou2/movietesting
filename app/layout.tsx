import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import SecurePasswordProtection from "@/components/secure-password-protection"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Movie Time - Private Access",
  description: "Private Access",
  generator: "qou2.xyz",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SecurePasswordProtection>{children}</SecurePasswordProtection>
      </body>
    </html>
  )
}
