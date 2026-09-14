import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSessionToken, setSessionCookie, UserRole } from '@/lib/auth'
import { loginSchema, formatZodError } from '@/lib/validations'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json()

    // 1. Zod Validation
    const parsed = loginSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    // 1. Look up user in PostgreSQL
    const user = await db.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // 2. Validate password hash with bcrypt
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // 3. Issue signed JWT session token
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    })

    // 4. Set HTTP-only session cookie
    await setSessionCookie(token)

    const redirectUrl =
      user.role === 'ADMIN'
        ? '/admin'
        : user.role === 'WAITER'
          ? '/waiter'
          : user.role === 'JUICE_MAKER'
            ? '/juice'
            : '/kitchen'

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      redirectUrl,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error during authentication' },
      { status: 500 }
    )
  }
}
