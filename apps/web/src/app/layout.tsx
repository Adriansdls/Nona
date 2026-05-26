import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'SalvaCão — Cada cão merece voltar a casa',
    template: '%s | SalvaCão',
  },
  description: 'Tecnologia gratuita ao serviço das redes que já salvam cães no Algarve',
  openGraph: {
    siteName: 'SalvaCão',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
