'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { locales } from '@salvacao/i18n'

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/')
    if (locales.includes(segments[1] as (typeof locales)[number])) {
      segments[1] = newLocale
    } else {
      segments.splice(1, 0, newLocale)
    }
    router.push(segments.join('/'))
  }

  return (
    <div className="flex gap-1">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className={`px-2 py-1 text-sm rounded uppercase font-medium transition-colors ${
            l === locale
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-current={l === locale ? 'true' : undefined}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
