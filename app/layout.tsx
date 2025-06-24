import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MovieTime',
  description: 'qou2 is cute',
  generator: 'qou2.xyz',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
