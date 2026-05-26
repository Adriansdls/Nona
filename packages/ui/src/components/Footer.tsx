import Link from 'next/link'

interface FooterProps {
  locale: string
}

export function Footer({ locale }: FooterProps) {
  return (
    <footer className="border-t mt-auto py-8 text-sm text-muted-foreground">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <span className="font-semibold text-foreground">SalvaCão</span>
          {' — '}
          Tecnologia gratuita para salvar cães no Algarve
        </div>
        <nav className="flex gap-4">
          <Link href={`/${locale}/privacidade`} className="hover:text-foreground transition-colors">
            Privacidade
          </Link>
          <Link href={`/${locale}/termos`} className="hover:text-foreground transition-colors">
            Termos
          </Link>
          <a
            href="https://github.com/salvacao/salvacao"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  )
}
