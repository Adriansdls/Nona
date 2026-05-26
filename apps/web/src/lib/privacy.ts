import type { CasePublic } from '@salvacao/types'

const PRIVATE_FIELDS = [
  'chipNumberEncrypted',
  'chip_number_encrypted',
  'reporterName',
  'reporter_name',
  'reporterEmail',
  'reporter_email',
  'reporterPhone',
  'reporter_phone',
  'lastSeenCoordsApprox',
  'last_seen_coords_approx',
  'suspectedTheft',
  'suspected_theft',
  'adminNotes',
  'admin_notes',
  'createdBy',
  'created_by',
] as const

/**
 * Strips all private fields from a DB row before returning in a public API response.
 * Defense-in-depth on top of RLS — call this in every public-facing route handler.
 */
export function stripPrivateFields(row: Record<string, unknown>): CasePublic {
  const safe = { ...row }
  for (const field of PRIVATE_FIELDS) {
    delete safe[field]
  }
  return safe as unknown as CasePublic
}

/**
 * Throws if any private field is present in a value intended for public output.
 * Use in unit tests to verify privacy invariants.
 */
export function assertNoPrivateFields(value: unknown): void {
  const str = JSON.stringify(value)
  for (const field of PRIVATE_FIELDS) {
    if (str.includes(`"${field}"`)) {
      throw new Error(`Privacy violation: field "${field}" found in public output`)
    }
  }
}
