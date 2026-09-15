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
    if (session.role === 'KITCHEN') {
      redirect('/kitchen')
    }
    if (session.role === 'JUICE_MAKER') {
      redirect('/juice')
    }
    if (session.role === 'WAITER') {
      redirect('/waiter')
    }
    if (session.role === 'DELIVERY') {
      redirect('/delivery')
    }
    redirect('/admin')
  }

  return session
}
