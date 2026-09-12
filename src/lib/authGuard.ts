import { redirect } from 'next/navigation'
import { getSession, UserRole, SessionPayload } from '@/lib/auth'

/**
 * Server helper to enforce authentication and roles.
 * Call this at the top of server components or route handlers.
 */
export async function requireAuth(allowedRoles?: UserRole[]): Promise<SessionPayload> {
  const session = await getSession()

  if (!session) {
    redirect('/staff')
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    // If a Kitchen staff tries to enter Admin, route them to Kitchen dashboard
    if (session.role === 'KITCHEN') {
      redirect('/kitchen')
    }
    // If an Admin somehow hits an unauthorized area, route to /admin
    redirect('/admin')
  }

  return session
}
