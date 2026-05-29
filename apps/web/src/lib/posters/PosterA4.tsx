/* eslint-disable jsx-a11y/alt-text */
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'

const TITLES = { pt: 'PROCURA-SE', en: 'LOST DOG', es: 'SE BUSCA' }
const INSTRUCTIONS = {
  pt: 'Se o vir: tire foto, não tente apanhar, reporte aqui',
  en: 'If you see it: take a photo, do not approach, report here',
  es: 'Si lo ves: saca una foto, no te acerques, repórtalo aquí',
}
const PRIVACY_NOTE = {
  pt: 'Por segurança, não todos os detalhes identificativos são públicos',
  en: 'For security, not all identifying details are public',
  es: 'Por seguridad, no todos los detalles identificativos son públicos',
}

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', backgroundColor: '#FFFFFF' },
  photo: { width: '100%', height: 280, objectFit: 'cover', marginBottom: 16, borderRadius: 4 },
  photoPlaceholder: { width: '100%', height: 280, backgroundColor: '#F3F4F6', marginBottom: 16, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontFamily: 'Helvetica-Bold', color: '#DC2626', textAlign: 'center', marginBottom: 12, letterSpacing: 2 },
  dogName: { fontSize: 22, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 6 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8, marginBottom: 8, justifyContent: 'center' },
  infoBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 11 },
  sectionLabel: { fontSize: 10, color: '#6B7280', marginBottom: 2, marginTop: 6 },
  locationText: { fontSize: 12, marginBottom: 2 },
  mark: { fontSize: 11, color: '#374151', marginBottom: 2 },
  qrSection: { alignItems: 'center', marginTop: 12 },
  qrImage: { width: 120, height: 120 },
  instruction: { fontSize: 11, textAlign: 'center', marginTop: 6, color: '#374151', fontFamily: 'Helvetica-Bold' },
  contact: { fontSize: 12, textAlign: 'center', marginTop: 8, color: '#1F2937' },
  privacyNote: { fontSize: 8, textAlign: 'center', color: '#9CA3AF', marginTop: 8 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginVertical: 8 },
})

interface Props {
  caseData: {
    slug: string
    dog_name: string | null
    breed: string
    size: string
    primary_color: string
    distinctive_marks: string[]
    last_seen_at: string
    last_seen_municipality: string
    last_seen_zone_approx: string
    reporter_contact_public: string | null
    case_images?: Array<{ public_url: string | null; is_primary: boolean }>
  }
  qrDataUrl: string
  photoUrl: string | null
  locale: 'pt' | 'en' | 'es'
}

export function PosterA4({ caseData, qrDataUrl, photoUrl, locale }: Props) {
  const date = new Date(caseData.last_seen_at).toLocaleDateString(
    locale === 'pt' ? 'pt-PT' : locale,
  )

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {photoUrl ? (
          <Image src={photoUrl} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>Sem foto disponível</Text>
          </View>
        )}

        <Text style={styles.title}>{TITLES[locale]}</Text>

        {caseData.dog_name && (
          <Text style={styles.dogName}>{caseData.dog_name}</Text>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoBadge}>{caseData.breed}</Text>
          <Text style={styles.infoBadge}>{caseData.primary_color}</Text>
          <Text style={styles.infoBadge}>{caseData.size}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>
          {locale === 'pt' ? 'Última vez visto' : locale === 'en' ? 'Last seen' : 'Última vez visto'}
        </Text>
        <Text style={styles.locationText}>
          {caseData.last_seen_municipality} — {caseData.last_seen_zone_approx}
        </Text>
        <Text style={styles.locationText}>{date}</Text>

        {caseData.distinctive_marks.slice(0, 3).map((mark, i) => (
          <Text key={i} style={styles.mark}>• {mark}</Text>
        ))}

        <View style={styles.divider} />

        <View style={styles.qrSection}>
          <Image src={qrDataUrl} style={styles.qrImage} />
          <Text style={styles.instruction}>{INSTRUCTIONS[locale]}</Text>
        </View>

        {caseData.reporter_contact_public && (
          <Text style={styles.contact}>{caseData.reporter_contact_public}</Text>
        )}

        <Text style={styles.privacyNote}>{PRIVACY_NOTE[locale]}</Text>
      </Page>
    </Document>
  )
}
