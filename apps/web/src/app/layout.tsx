import type { Metadata } from 'next'
import { Instrument_Serif, Inter_Tight, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
})

const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter-tight',
  display: 'swap',
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Nona — Cada cão merece voltar a casa',
    template: '%s | Nona',
  },
  description: 'Agente de IA para cães perdidos no Algarve. Cartaz, redes sociais, voluntários — em segundos.',
  openGraph: {
    siteName: 'Nona',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      suppressHydrationWarning
      className={`${instrumentSerif.variable} ${interTight.variable} ${jetBrainsMono.variable}`}
    >
      <body className="nn">{children}</body>
    </html>
  )
}
