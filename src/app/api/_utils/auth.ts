import { NextRequest } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabase, supabaseAdmin as baseSupabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/custom-auth'

export interface AuthenticatedUser {
  id: string
  email?: string | null
  phone?: string | null
  authType: 'custom' | 'supabase'
}

const serviceSupabaseInternal: SupabaseClient | null = (() => {
  if (baseSupabaseAdmin) {
    return baseSupabaseAdmin as SupabaseClient
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (url && serviceKey) {
    return createClient(url, serviceKey)
  }

  return null
})()

export const serviceSupabase = serviceSupabaseInternal

export async function authenticateRequestUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

  if (token) {
    try {
      const decoded = verifyToken(token)
      if (decoded && decoded.type === 'custom' && serviceSupabase) {
        const { data: customUser, error } = await serviceSupabase
          .from('custom_users')
          .select('id, email, phone, country_code, is_active')
          .eq('id', decoded.userId)
          .eq('is_active', true)
          .single()

        if (!error && customUser) {
          return {
            id: customUser.id,
            email: customUser.email,
            phone: customUser.phone && customUser.country_code
              ? `${customUser.country_code}${customUser.phone}`
              : customUser.phone,
            authType: 'custom'
          }
        }
      }
    } catch (error) {
      console.warn('Custom token validation failed:', error)
    }
  }

  if (token) {
    const { data: { user: tokenUser }, error } = await supabase.auth.getUser(token)
    if (!error && tokenUser) {
      return {
        id: tokenUser.id,
        email: tokenUser.email,
        phone: tokenUser.phone,
        authType: 'supabase'
      }
    }
  }

  const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser()
  if (!sessionError && sessionUser) {
    return {
      id: sessionUser.id,
      email: sessionUser.email,
      phone: sessionUser.phone,
      authType: 'supabase'
    }
  }

  return null
}
