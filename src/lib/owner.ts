/**
 * Utility functions to identify and protect the Cafe Admin Owner account.
 * Accessible from both Server and Client components.
 */

export const OWNER_EMAIL = (
  process.env.NEXT_PUBLIC_OWNER_EMAIL ||
  process.env.OWNER_EMAIL ||
  'admin@qrcafe.com'
).toLowerCase().trim()

/**
 * Returns true if the user object or email string corresponds to the Cafe Owner.
 */
export function isOwner(
  userOrEmail?: { email?: string | null; name?: string | null } | string | null
): boolean {
  if (!userOrEmail) return false

  if (typeof userOrEmail === 'string') {
    return userOrEmail.trim().toLowerCase() === OWNER_EMAIL
  }

  const email = userOrEmail.email?.trim().toLowerCase()
  if (email && email === OWNER_EMAIL) {
    return true
  }

  const name = userOrEmail.name?.toLowerCase()
  if (name && (name.includes('(owner)') || name.includes('admin owner'))) {
    return true
  }

  return false
}
