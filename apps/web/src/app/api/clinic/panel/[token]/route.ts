import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// WS-G-Vet: clinic panel data by panel_token (magic-link, no account).
// Returns the clinic + every chip_scan they submitted, with FULL chip + owner data.
// This is the ONLY place full chip numbers are exposed — behind the magic link.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const db = createServiceClient()

  const { data: clinic } = await db
    .from('clinic_partners')
    .select('id, name, municipality, contact_email, contact_phone, vet_license, intake_slug, panel_token, is_approved')
    .eq('panel_token', token)
    .single()

  if (!clinic) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!clinic.is_approved) {
    return NextResponse.json({ error: 'Clinic not yet approved' }, { status: 403 })
  }

  // Fetch every chip scan + joined case data
  const { data: scans } = await db
    .from('chip_scans')
    .select(`
      id, chip_number, chip_last_3, siac_lookup_status, owner_name, owner_contact,
      notes, created_at,
      case:cases (
        id, slug, dog_name, breed, status, last_seen_municipality,
        last_seen_zone_approx, last_seen_at, reporter_name, reporter_email, reporter_phone,
        owner_token, behavioral_profile,
        case_images (public_url, is_primary)
      )
    `)
    .eq('clinic_partner_id', clinic.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const shaped = (scans ?? []).map((s) => {
    const c = s.case as Record<string, unknown> | null
    const imgs = (c?.case_images as Array<{ public_url: string | null; is_primary: boolean }>) ?? []
    const bp = (c?.behavioral_profile as Record<string, unknown>) ?? {}
    const adRec = (bp?.ad_recommendation as Record<string, unknown>) ?? null

    return {
      scanId: s.id,
      chipNumber: s.chip_number,               // FULL chip — private panel only
      chipLast3: s.chip_last_3,
      siacStatus: s.siac_lookup_status,
      ownerName: s.owner_name,                   // from manual vet input or SIAC
      ownerContact: s.owner_contact,             // private
      notes: s.notes,
      createdAt: s.created_at,
      case: c
        ? {
            slug: c.slug as string,
            dogName: c.dog_name as string | null,
            breed: c.breed as string,
            status: c.status as string,
            municipality: c.last_seen_municipality as string,
            zone: c.last_seen_zone_approx as string,
            lastSeenAt: c.last_seen_at as string,
            reporterName: c.reporter_name as string,
            reporterEmail: c.reporter_email as string,
            reporterPhone: c.reporter_phone as string | null,
            ownerToken: c.owner_token as string, // clinic can share with owner
            img: (imgs.find((i) => i.is_primary) ?? imgs[0])?.public_url ?? null,
            adRecommendation: adRec
              ? {
                  eligible: adRec.eligible as boolean,
                  radiusKm: adRec.radiusKm as number,
                  dailyBudgetEur: adRec.dailyBudgetEur as number,
                  rationale: adRec.rationale as string,
                }
              : null,
          }
        : null,
    }
  })

  return NextResponse.json({
    clinic: {
      id: clinic.id,
      name: clinic.name,
      municipality: clinic.municipality,
      contactEmail: clinic.contact_email,
      contactPhone: clinic.contact_phone,
      vetLicense: clinic.vet_license,
      intakeSlug: clinic.intake_slug,
    },
    scans: shaped,
    intakeUrl: `/clinica/${clinic.intake_slug}`,
  })
}
