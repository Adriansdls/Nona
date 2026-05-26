import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { LocaleSwitcher } from './LocaleSwitcher'

interface HeaderProps {
  locale: string
}

export function Header({ locale }: HeaderProps) {
  const t = useTranslations('nav')
  return (
    <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href={`/${locale}`} className="font-bold text-lg tracking-tight">
          SalvaCão
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href={`/${locale}/reportar`}
            className="text-sm font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
          >
            {t('report')}
          </Link>
          <Link
            href={`/${locale}/casos`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('cases')}
          </Link>
          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  )
}
