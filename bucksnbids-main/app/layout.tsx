import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bucksnbids',
  description: 'Created with nextjs, typescript, tailwindcss',
  generator: 'payalkatiyar',
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
