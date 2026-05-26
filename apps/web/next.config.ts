import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

export default withNextIntl({
  images: {
    remotePatterns: [
      { hostname: '127.0.0.1' },
      { hostname: 'localhost' },
      { hostname: '*.supabase.co' },
    ],
  },
})
