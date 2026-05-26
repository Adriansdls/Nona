import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11 },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  subtitle: { fontSize: 12, color: '#6B7280', marginBottom: 20 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 6, color: '#1F2937' },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 140, color: '#6B7280', fontFamily: 'Helvetica-Bold', fontSize: 10 },
  value: { flex: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginVertical: 10 },
  legalNote: { fontSize: 9, color: '#9CA3AF', marginTop: 20, fontStyle: 'italic' },
  warning: { backgroundColor: '#FEF3C7', padding: 8, borderRadius: 4, marginBottom: 12, fontSize: 10 },
})

interface Props {
  caseData: {
    id: string
    slug: string
    type: string
    dog_name: string | null
    breed: string
    sex: string
    size: string
    primary_color: string
    secondary_color: string | null
    distinctive_marks: string[]
    age_estimate: string | null
    has_chip: boolean | null
    chip_last_3: string | null
    last_seen_at: string
    last_seen_municipality: string
    last_seen_zone_approx: string
    description: string
    reporter_name?: string
    reporter_email?: string
    reporter_phone?: string | null
    created_at?: string
    sightings?: Array<{
      municipality: string
      zone_approx: string
      seen_at: string
      description: string | null
      is_public: boolean
    }>
  }
  includePrivate: boolean
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

export function DossierPDF({ caseData, includePrivate }: Props) {
  const publicSightings = (caseData.sightings ?? []).filter((s) => s.is_public)
  const date = new Date(caseData.last_seen_at).toLocaleDateString('pt-PT')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Dossier — SalvaCão</Text>
        <Text style={styles.subtitle}>
          Caso #{caseData.slug} — Gerado em {new Date().toLocaleDateString('pt-PT')}
        </Text>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informação do animal</Text>
          <Row label="Nome" value={caseData.dog_name} />
          <Row label="Raça" value={caseData.breed} />
          <Row label="Sexo" value={caseData.sex} />
          <Row label="Tamanho" value={caseData.size} />
          <Row label="Cor principal" value={caseData.primary_color} />
          <Row label="Cor secundária" value={caseData.secondary_color} />
          <Row label="Marcas distintivas" value={caseData.distinctive_marks.join(', ')} />
          <Row label="Idade estimada" value={caseData.age_estimate} />
          <Row label="Microchip" value={caseData.has_chip ? `Sim (últimos 3: ${caseData.chip_last_3 ?? 'N/D'})` : 'Não'} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Última vez visto</Text>
          <Row label="Município" value={caseData.last_seen_municipality} />
          <Row label="Zona" value={caseData.last_seen_zone_approx} />
          <Row label="Data" value={date} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={{ lineHeight: 1.4 }}>{caseData.description}</Text>
        </View>

        {includePrivate && caseData.reporter_name && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contacto do titular</Text>
            <Row label="Nome" value={caseData.reporter_name} />
            <Row label="Email" value={caseData.reporter_email ?? null} />
            <Row label="Telefone" value={caseData.reporter_phone ?? null} />
          </View>
        )}

        {publicSightings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Avistamentos</Text>
            {publicSightings.map((s, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <Text style={{ fontFamily: 'Helvetica-Bold' }}>
                  {new Date(s.seen_at).toLocaleDateString('pt-PT')} — {s.municipality}, {s.zone_approx}
                </Text>
                {s.description && <Text style={{ color: '#374151' }}>{s.description}</Text>}
              </View>
            ))}
          </View>
        )}

        <Text style={styles.legalNote}>
          Documento de apoio gerado pela plataforma SalvaCão. Não constitui prova legal certificada.
          {'\n'}Sugestão de diligências: preservar eventuais anúncios online, verificar registo de chip no SIAC, consultar CRO local.
        </Text>
      </Page>
    </Document>
  )
}
