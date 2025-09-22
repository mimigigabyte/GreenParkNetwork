import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateToken, generateRefreshToken, type CustomUser, hashPassword, generateSecureRandom } from '@/lib/custom-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface WxTokenResp {
  access_token?: string
  expires_in?: number
  refresh_token?: string
  openid?: string
  scope?: string
  unionid?: string
  errcode?: number
  errmsg?: string
}

interface WxUserInfo {
  openid: string
  nickname: string
  sex?: number
  province?: string
  city?: string
  country?: string
  headimgurl?: string
  privilege?: string[]
  unionid?: string
  errcode?: number
  errmsg?: string
}

export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json()
    if (!code) {
      return NextResponse.json({ success: false, error: '缺少code参数' }, { status: 400 })
    }

    // 校验state（若存在）
    const cookieState = request.cookies.get('wx_state')?.value
    const globalAny = globalThis as any
    const store: Map<string, number> | undefined = globalAny.__wechatStateStore

    const now = Date.now()
    let stateValid = !state
    if (state && cookieState && cookieState === state) {
      stateValid = true
    } else if (state && store && store.has(state)) {
      const createdAt = store.get(state) || 0
      if (now - createdAt <= 10 * 60 * 1000) {
        stateValid = true
        store.delete(state)
      } else {
        store.delete(state)
      }
    }

    if (!stateValid) {
      return NextResponse.json({ success: false, error: '非法的state参数' }, { status: 400 })
    }

    if (state && store && store.has(state)) {
      store.delete(state)
    }

    const appId = process.env.WECHAT_APP_ID
    const appSecret = process.env.WECHAT_APP_SECRET
    if (!appId || !appSecret) {
      return NextResponse.json({ success: false, error: '微信应用配置缺失' }, { status: 500 })
    }

    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${encodeURIComponent(appId)}&secret=${encodeURIComponent(appSecret)}&code=${encodeURIComponent(code)}&grant_type=authorization_code`

    const tokenRes = await fetch(tokenUrl)
    const tokenData = (await tokenRes.json()) as WxTokenResp
    if (!tokenRes.ok || tokenData.errcode || !tokenData.access_token || !tokenData.openid) {
      const msg = tokenData.errcode ? `${tokenData.errcode}:${tokenData.errmsg}` : '微信token获取失败'
      return NextResponse.json({ success: false, error: msg }, { status: 400 })
    }

    // 获取用户信息（需要snsapi_userinfo权限）
    const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${encodeURIComponent(tokenData.access_token)}&openid=${encodeURIComponent(tokenData.openid)}&lang=zh_CN`
    const userRes = await fetch(userInfoUrl)
    const userInfo = (await userRes.json()) as WxUserInfo
    if (!userRes.ok || userInfo.errcode) {
      const msg = userInfo.errcode ? `${userInfo.errcode}:${userInfo.errmsg}` : '获取微信用户信息失败'
      return NextResponse.json({ success: false, error: msg }, { status: 400 })
    }

    const openid = tokenData.openid
    const nickname = userInfo.nickname || '微信用户'
    const avatar = userInfo.headimgurl || null
    const unionid = tokenData.unionid || userInfo.unionid || null

    // 查找是否已存在绑定该openid的用户
    let isNewUser = false
    const { data: existing, error: findErr } = await supabase
      .from('custom_users')
      .select('*')
      .contains('user_metadata', { wechat_openid: openid })
      .single()

    if (findErr && (findErr as any).code !== 'PGRST116') {
      // PGRST116: No rows found
      return NextResponse.json({ success: false, error: '查询用户失败' }, { status: 500 })
    }

    let userRow: any = existing
    if (!existing) {
      // 创建新用户（自定义认证）
      isNewUser = true
      const randomPwd = await hashPassword(generateSecureRandom(32))
      const { data: created, error: createErr } = await supabase
        .from('custom_users')
        .insert({
          phone: null,
          country_code: null,
          email: null,
          password_hash: randomPwd,
          name: nickname,
          role: 'user',
          is_active: true,
          avatar_url: avatar,
          wechat_openid: openid,
          wechat_unionid: unionid,
          wechat_nickname: nickname,
          wechat_avatar_url: avatar,
          user_metadata: {
            registration_method: 'wechat',
            wechat_openid: openid,
            wechat_unionid: unionid,
            wechat_nickname: nickname,
            wechat_avatar_url: avatar,
            phone_verified: false,
            email_verified: false
          }
        })
        .select('*')
        .single()

      if (createErr || !created) {
        return NextResponse.json({ success: false, error: createErr?.message || '创建用户失败' }, { status: 500 })
      }
      userRow = created
    } else {
      // 更新用户资料（昵称/头像/最后登录时间）
      const { data: updated, error: updErr } = await supabase
        .from('custom_users')
        .update({
          name: existing.name || nickname,
          avatar_url: avatar || existing.avatar_url,
          last_login_at: new Date().toISOString(),
          wechat_openid: openid,
          wechat_unionid: unionid,
          wechat_nickname: nickname,
          wechat_avatar_url: avatar,
          user_metadata: {
            ...(existing.user_metadata || {}),
            wechat_openid: openid,
            wechat_unionid: unionid,
            wechat_nickname: nickname,
            wechat_avatar_url: avatar
          }
        })
        .eq('id', existing.id)
        .select('*')
        .single()

      if (updErr || !updated) {
        return NextResponse.json({ success: false, error: updErr?.message || '更新用户失败' }, { status: 500 })
      }
      userRow = updated
    }

    // 生成应用自定义JWT
    const token = generateToken({
      userId: userRow.id,
      phone: userRow.phone ? `${userRow.country_code || ''}${userRow.phone}` : `wx:${openid}`,
      name: userRow.name || nickname,
      role: userRow.role || 'user'
    })
    const refreshToken = generateRefreshToken(userRow.id)

    const user: CustomUser = {
      id: userRow.id,
      phone: userRow.phone || '',
      countryCode: userRow.country_code || '+86',
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
      avatarUrl: userRow.avatar_url,
      createdAt: userRow.created_at,
      lastLoginAt: userRow.last_login_at,
      isActive: userRow.is_active,
      userMetadata: userRow.user_metadata || {}
    }

    const response = NextResponse.json({
      success: true,
      data: { user, token, refreshToken, isNewUser }
    })

    response.cookies.set('wx_state', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0
    })

    return response
  } catch (e) {
    console.error('WeChat callback error', e)
    return NextResponse.json({ success: false, error: '微信登录回调处理失败' }, { status: 500 })
  }
}
